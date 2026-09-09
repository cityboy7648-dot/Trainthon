import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import { createHash } from "node:crypto";

const events = [];
let imageFailure = false;
const productKey = (product) => createHash("sha256").update(JSON.stringify(product)).digest("hex");
globalThis.campaignFiveTest = {
  async parse(schema, name, prompt, input, context, images) {
    events.push({ kind: "plan", input: JSON.parse(input), context, images });
    return {
      output: schema.parse({
        concept: "완성 세트",
        image_briefs: Array.from({ length: 11 }, (_, i) => `브리프${i + 1}`),
        captions: ["D1", "D2", "D3", "D4", "D5"],
        product_links: [
          { key: primaryKey, url: "https://example.com/products/primary" },
          { key: companionKey, url: "https://evil.example/product" },
        ],
      }),
    };
  },
  async image(prompt, images, format, context) {
    events.push({ kind: "image", prompt, images, format, context });
    if (imageFailure && context.assetId === "asset-2") throw new Error("test failure");
    return Buffer.from("image");
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
        "export const parseStructuredOutput=globalThis.campaignFiveTest.parse; export const generateCampaignImage=globalThis.campaignFiveTest.image;",
      "@/lib/providers/firecrawl":
        "export async function collectSite(){return {pages:[{url:'https://example.com/',links:['https://example.com/products/primary','https://evil.example/product','javascript:alert(1)']} ]};}",
      "@/lib/log": "export const log={info(){},error(){}};",
      "@/lib/data/campaign-five":
        "export const setCampaignFiveRunStatus=globalThis.campaignFiveTest.status; export const updateCampaignFiveAsset=globalThis.campaignFiveTest.update; export const saveCampaignFiveImage=globalThis.campaignFiveTest.save; export const failCampaignFiveRun=globalThis.campaignFiveTest.fail;",
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

const { generateCampaignFive } = await import("./agents/complete-set/generate.ts");
const primary = {
  name: "재킷",
  image_url: "https://example.com/jacket.jpg",
  description: null,
  price: null,
};
const companion = {
  name: "셔츠",
  image_url: "https://example.com/shirt.jpg",
  description: null,
  price: null,
};
const primaryKey = productKey(primary);
const companionKey = productKey(companion);
const slots = [
  [1, "feed"],
  [2, "feed"],
  [2, "pinterest"],
  [3, "feed"],
  [3, "pinterest"],
  [4, "carousel"],
  [4, "carousel"],
  [4, "carousel"],
  [5, "carousel"],
  [5, "carousel"],
  [5, "carousel"],
];
const run = {
  client: {},
  runId: "run-id",
  profile: { source_url: "https://example.com", products: [primary, companion] },
  primaryProduct: primary,
  primaryProductKey: primaryKey,
  companionProducts: [{ key: companionKey, product: companion }],
  assets: slots.map(([day, format], i) => ({
    id: `asset-${i + 1}`,
    meta: {
      position: i + 1,
      day,
      format,
      primary_product: primary,
      primary_product_key: primaryKey,
      companion_products: [{ key: companionKey, product: companion }],
      product_links: [],
      caption: null,
      error: null,
    },
  })),
};

test("승인 레퍼런스와 선택 상품으로 정확히 11장을 생성하고 2장은 Pinterest 비율이다", async () => {
  events.length = 0;
  await generateCampaignFive(run, "request-id");
  const plan = events.find((event) => event.kind === "plan");
  assert.equal(plan.images.length, 3);
  assert.deepEqual(plan.input.selected_products, [primary, companion]);
  const images = events.filter((event) => event.kind === "image");
  assert.equal(images.length, 11);
  assert.equal(images.filter((event) => event.format === "pinterest").length, 2);
  assert.equal(events.filter((event) => event.kind === "save").length, 11);
  assert.equal(events.at(-1).status, "done");
});

test("사이트에서 확인하지 못한 상품 주소는 null로 저장한다", async () => {
  events.length = 0;
  await generateCampaignFive(run, "request-id");
  const meta = events.find((event) => event.kind === "save").meta;
  assert.deepEqual(meta.product_links, [
    { key: primaryKey, name: "재킷", url: "https://example.com/products/primary" },
    { key: companionKey, name: "셔츠", url: null },
  ]);
});

test("한 장 실패 시 다른 10장은 보존하고 실행을 실패로 마친다", async () => {
  events.length = 0;
  imageFailure = true;
  await generateCampaignFive(run, "request-id");
  assert.equal(events.filter((event) => event.kind === "save").length, 10);
  assert.ok(
    events.find(
      (event) =>
        event.kind === "update" && event.id === "asset-2" && event.values.status === "failed",
    ),
  );
  assert.equal(events.at(-1).status, "failed");
  imageFailure = false;
});

test("저장된 상품 스냅샷과 키가 달라지면 유료 생성을 시작하지 않는다", async () => {
  events.length = 0;
  await generateCampaignFive({ ...run, primaryProductKey: "0".repeat(64) }, "request-id");
  assert.equal(events.filter((event) => event.kind === "image").length, 0);
  assert.equal(events.at(-1).kind, "failed_run");
});
