import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";

const events = [];
let imageFailure = false;
let elapsed = 0;
let slowImages = false;
globalThis.campaignTwoTest = {
  async parse(schema, name, prompt, input, context, images) {
    events.push({ kind: "plan", input: JSON.parse(input), context, images });
    return {
      output: schema.parse({
        concept: "동일 상품",
        product_brief: "상품 단독",
        scenes: [1, 2, 3].map((n) => ({ name: String(n), image_brief: `장면${n}` })),
        captions: ["소개", "장면1", "장면2", "장면3", "정리"],
      }),
    };
  },
  async image(prompt, images, story, context) {
    events.push({ kind: "image", prompt, images, story, context });
    if (slowImages) {
      const start = elapsed;
      await new Promise((resolve) => setImmediate(resolve));
      elapsed = Math.max(elapsed, start + 120000);
    }
    if (imageFailure && context.assetId === "asset-2") throw new Error("test image failure");
    return Buffer.from("test-image");
  },
  async update(client, id, values) {
    events.push({ kind: "update", id, values });
  },
  async save(client, runId, assetId, image, meta) {
    events.push({ kind: "save", runId, assetId, meta });
  },
  async status(client, runId, status) {
    events.push({ kind: "status", runId, status });
  },
  async fail(client, runId, cause) {
    events.push({ kind: "failed_run", runId, cause });
  },
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const stubs = {
      "@/lib/providers/openai":
        "export const parseStructuredOutput = globalThis.campaignTwoTest.parse; export const generateCampaignImage = globalThis.campaignTwoTest.image;",
      "@/lib/providers/firecrawl": "export async function collectSite() {return {pages: []};}",
      "@/lib/log": "export const log = {info(){},error(){}};",
      "@/lib/data/campaign-two":
        "export const setCampaignTwoRunStatus = globalThis.campaignTwoTest.status; export const updateCampaignTwoAsset = globalThis.campaignTwoTest.update; export const saveCampaignTwoImage = globalThis.campaignTwoTest.save; export const failCampaignTwoRun = globalThis.campaignTwoTest.fail;",
    };
    if (stubs[specifier])
      return {
        url: `data:text/javascript,${encodeURIComponent(stubs[specifier])}`,
        shortCircuit: true,
      };
    if (specifier.startsWith("@/"))
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    if (specifier === "./prompt") return nextResolve("./prompt.ts", context);
    return nextResolve(specifier, context);
  },
});
const { generateCampaignTwo } = await import("./agents/one-product-three-scenes/generate.ts");
const product = {
  name: "선택한 가방",
  image_url: "https://example.com/bag.jpg",
  description: null,
  price: null,
};
const slots = [
  [1, "feed"],
  [2, "feed"],
  [2, "story"],
  [3, "feed"],
  [3, "story"],
  [4, "feed"],
  [4, "story"],
  [5, "carousel"],
  [5, "carousel"],
  [5, "carousel"],
];
const run = {
  client: {},
  runId: "run-id",
  profile: { source_url: "https://example.com", products: [product] },
  product,
  assets: slots.map(([day, format], i) => ({
    id: `asset-${i + 1}`,
    meta: { position: i + 1, day, format, product, product_key: "key", caption: null, error: null },
  })),
};

test("이미지마다 2분 걸려도 10장 모두 서버 제한 안에 저장한다", async (t) => {
  events.length = 0;
  elapsed = 0;
  slowImages = true;
  t.mock.method(Date, "now", () => elapsed);
  try {
    await generateCampaignTwo(run, "request-id");
    assert.equal(events.filter((e) => e.kind === "save").length, 10);
    assert.ok(elapsed < 270000);
    assert.equal(events.at(-1).status, "done");
  } finally {
    slowImages = false;
  }
});

test("기획과 10장 생성 모두 선택 상품과 승인 레퍼런스 4장을 전달한다", async () => {
  events.length = 0;
  await generateCampaignTwo(run, "request-id");
  const plan = events.find((e) => e.kind === "plan");
  assert.deepEqual(plan.input.selected_product, product);
  assert.equal(plan.images[0], product.image_url);
  assert.equal(plan.images.length, 5);
  assert.ok(plan.images.slice(1).every((url) => url.startsWith("data:image/jpeg;base64,")));
  const images = events.filter((e) => e.kind === "image");
  assert.equal(images.length, 10);
  assert.equal(images.filter((e) => e.story).length, 3);
  assert.ok(
    images.every(
      (e) =>
        e.images[0] === product.image_url && e.context.runId === run.runId && e.context.assetId,
    ),
  );
  assert.equal(events.filter((e) => e.kind === "save").length, 10);
  assert.equal(events.at(-1).status, "done");
});

test("한 장 실패 시 완료 이미지는 보존하고 실패 원인을 저장한다", async () => {
  events.length = 0;
  imageFailure = true;
  await generateCampaignTwo(run, "request-id");
  assert.equal(events.filter((e) => e.kind === "save").length, 9);
  const failure = events.find(
    (e) => e.kind === "update" && e.id === "asset-2" && e.values.status === "failed",
  );
  assert.ok(failure.values.meta.error);
  assert.equal(events.at(-1).status, "failed");
  imageFailure = false;
});

test("요청 시간이 부족하면 추가 유료 생성을 시작하지 않고 실패를 저장한다", async (t) => {
  events.length = 0;
  let calls = 0;
  t.mock.method(Date, "now", () => (calls++ === 0 ? 0 : 196_000));
  await generateCampaignTwo(run, "request-id");
  assert.equal(events.filter((e) => e.kind === "image").length, 0);
  assert.equal(events.at(-1).kind, "failed_run");
  assert.ok(events.at(-1).cause);
});
