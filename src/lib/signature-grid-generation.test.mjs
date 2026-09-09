import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
const events = [];
let available = true;
let invalidPlan = false;
let imageFailure = false;
const posts = Array.from({ length: 9 }, (_, i) => ({
  position: i + 1,
  upload_order: 9 - i,
  purpose: "상품 소개",
  source_facts: ["브랜드 상품"],
  source_image_urls: ["https://example.com/product.png"],
  image_brief: "상품 사진",
  text_in_image: null,
  caption: "상품 소개",
}));
globalThis.signatureTest = {
  async claim() {
    if (!available) return null;
    available = false;
    return {
      client: {},
      run: { id: "run" },
      profile: {
        source_url: "https://example.com",
        products: [{ image_url: "https://example.com/product.png" }],
        logo_url: null,
      },
      assets: posts.map((post) => ({
        id: `asset-${post.position}`,
        meta: { day: post.upload_order, position: post.position, format: "feed", caption: null },
      })),
    };
  },
  async parse(schema) {
    return {
      output: schema.parse({
        campaign_key: "signature_grid",
        concept: "브랜드",
        reference_direction: {
          colors: ["white"],
          lighting: "자연광",
          photography: "사진",
          typography: "절제",
          layout: "그리드",
        },
        posts: invalidPlan ? posts.map((p) => ({ ...p, position: 1 })) : posts,
      }),
    };
  },
  async image(prompt, images, format, context) {
    events.push({ kind: "image", format, images });
    if (imageFailure && context.assetId === "asset-1") throw new Error("image failure");
    return Buffer.from("image");
  },
  async save(client, runId, id, image, meta) {
    events.push({ kind: "save", id, meta });
  },
  async update() {},
  async status(client, id, status) {
    events.push({ kind: "status", status });
  },
  async fail() {
    events.push({ kind: "fail" });
  },
};
registerHooks({
  resolve(s, c, n) {
    const stubs = {
      "@/lib/data/signature-grid":
        "export const claimSignatureGridRun = globalThis.signatureTest.claim; export const failSignatureGridRun = globalThis.signatureTest.fail;",
      "@/lib/data/campaign-assets":
        "export const updateCampaignAsset = globalThis.signatureTest.update; export const saveCampaignImage = globalThis.signatureTest.save; export const setCampaignRunStatus = globalThis.signatureTest.status;",
      "@/lib/providers/openai":
        "export const parseStructuredOutput = globalThis.signatureTest.parse; export const generateCampaignImage = globalThis.signatureTest.image; export async function asCampaignImageUrl(url){return url;}",
      "@/lib/providers/firecrawl": "export async function collectSite(){return {pages:[]}}",
      "@/lib/log": "export const log={error(){},info(){}}",
    };
    if (stubs[s])
      return { url: `data:text/javascript,${encodeURIComponent(stubs[s])}`, shortCircuit: true };
    if (s.startsWith("@/")) return n(new URL(`../${s.slice(2)}.ts`, import.meta.url).href, c);
    if (s === "./prompt") return n("./prompt.ts", c);
    return n(s, c);
  },
});
test("1번은 승인 레퍼런스로 정사각 이미지 9장과 캡션을 저장하며 중복 실행하지 않는다", async () => {
  const { generateSignatureGrid } = await import("./agents/signature-grid/generate.ts");
  await generateSignatureGrid("run");
  assert.equal(events.filter((e) => e.kind === "image").length, 9);
  assert.ok(
    events
      .filter((e) => e.kind === "image")
      .every((e) => e.format === "square" && e.images.length === 5),
  );
  assert.equal(events.filter((e) => e.kind === "save").length, 9);
  assert.ok(events.filter((e) => e.kind === "save").every((e) => e.meta.caption === "상품 소개"));
  assert.equal(events.at(-1).status, "done");
  await generateSignatureGrid("run");
  assert.equal(events.filter((e) => e.kind === "image").length, 9);
});
test("중복 위치 계획은 유료 이미지 요청 전에 거부한다", async () => {
  available = true;
  invalidPlan = true;
  events.length = 0;
  const { generateSignatureGrid } = await import("./agents/signature-grid/generate.ts");
  await generateSignatureGrid("run");
  assert.equal(events.filter((e) => e.kind === "image").length, 0);
  assert.equal(events.at(-1).kind, "fail");
});
test("한 장 실패해도 완료된 나머지 8장은 보존한다", async () => {
  available = true;
  invalidPlan = false;
  imageFailure = true;
  events.length = 0;
  const { generateSignatureGrid } = await import("./agents/signature-grid/generate.ts");
  await generateSignatureGrid("run");
  assert.equal(events.filter((e) => e.kind === "save").length, 8);
  assert.equal(events.at(-1).status, "failed");
});
test("최종 그리드와 실제 업로드 순서가 반대인 계획은 거부한다", async () => {
  const { signatureGridPlanSchema } = await import("./types.ts");
  const result = signatureGridPlanSchema.safeParse({
    campaign_key: "signature_grid",
    concept: "브랜드",
    reference_direction: { colors: [], lighting: "", photography: "", typography: "", layout: "" },
    posts: posts.map((post) => ({ ...post, upload_order: post.position })),
  });
  assert.equal(result.success, false);
});
