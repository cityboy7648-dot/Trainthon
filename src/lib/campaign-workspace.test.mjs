import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
registerHooks({
  resolve(s, c, n) {
    if (s.startsWith("@/")) return n(new URL(`../${s.slice(2)}.ts`, import.meta.url).href, c);
    return n(s, c);
  },
});
const { campaignDate, isGeneratedCampaign, signatureSlots, previewModes, validateCampaignImage } =
  await import("./campaign-workspace.ts");
test("진행률은 완료된 서버 항목만 세고 실패는 완료로 계산하지 않는다", async () => {
  const { campaignProgress } = await import("./campaign-workspace.ts");
  const posts = ["done", "done", "done", "processing", "pending", "failed"].map((status) => ({
    status,
  }));
  assert.deepEqual(campaignProgress(posts), {
    total: 6,
    done: 3,
    failed: 1,
    active: true,
    percent: 50,
  });
  assert.equal(campaignProgress([]).percent, 0);
  assert.equal(campaignProgress([{ status: "done" }]).percent, 100);
  assert.equal(campaignProgress([{ status: "failed" }]).active, false);
});
test("9개 게시 슬롯은 날짜와 그리드 위치를 분리한다", () => {
  const slots = signatureSlots("2026-12-29");
  assert.equal(slots.length, 9);
  assert.equal(slots[0].position, 9);
  assert.equal(slots[8].position, 1);
  assert.equal(campaignDate("2026-12-29", 9), "2027-01-06");
  assert.equal(campaignDate("2028-02-28", 2), "2028-02-29");
  assert.throws(() => campaignDate("2026-02-30", 1));
});
test("시그니처 그리드는 스토리 탭을 표시하지 않는다", () => {
  assert.equal(isGeneratedCampaign("signature_grid"), true);
  assert.deepEqual(previewModes("signature_grid"), ["feed", "grid"]);
  assert.deepEqual(previewModes("one_product_three_scenes"), ["feed", "story", "carousel"]);
  assert.deepEqual(previewModes("complete_set"), ["feed", "pinterest", "carousel"]);
});
test("세트 캠페인 메타는 Pinterest와 상품 링크를 보존한다", async () => {
  const { campaignPostMetaSchema } = await import("./types.ts");
  const meta = campaignPostMetaSchema.parse({
    day: 2,
    position: 3,
    format: "pinterest",
    product_links: [{ name: "상품", key: "key", url: "https://example.com" }],
  });
  assert.equal(meta.format, "pinterest");
  assert.equal(meta.product_links[0].name, "상품");
});
test("업로드는 파일 확장자가 아니라 내용과 크기를 검사한다", () => {
  assert.throws(() => validateCampaignImage(Buffer.from("<svg></svg>"), "image/png"));
  assert.throws(() => validateCampaignImage(Buffer.alloc(5 * 1024 * 1024 + 1), "image/png"));
  assert.equal(
    validateCampaignImage(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png"),
    "png",
  );
});
