import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/"))
      return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return next(specifier, context);
  },
});

test("갤러리 표지는 생성 콘텐츠가 아니라 캠페인 대표 이미지를 사용한다", async () => {
  const { toCampaignGalleryCard } = await import("./campaign-gallery.ts");
  const card = toCampaignGalleryCard({
    id: "run",
    campaign_key: "signature_grid",
    status: "processing",
    created_at: "2026-09-10T00:00:00Z",
    brands: { profile: { name: "브랜드" } },
    assets: [
      { kind: "image", status: "done", storage_path: "content.png", meta: {} },
      { kind: "image", status: "failed", meta: {} },
      { kind: "caption", status: "done", meta: {} },
    ],
  });
  assert.equal(card.image, "/campaigns/signature-grid/card-thumbnail-soft.png");
  assert.equal(card.total, 2);
  assert.equal(card.completed, 1);
  assert.equal(card.failed, 1);
  assert.equal(card.endDate, "2026-09-18");
  assert.deepEqual(card.channels, ["Instagram"]);
  const set = toCampaignGalleryCard({
    id: "set",
    campaign_key: "complete_set",
    status: "pending",
    created_at: "2026-09-10",
    brands: { profile: { name: "브랜드" } },
    assets: [],
  });
  assert.deepEqual(set.channels, ["Instagram", "Pinterest"]);
  assert.equal(set.endDate, "2026-09-14");
});

test("완료 외 캠페인은 진행중에 남기고 검색·채널 필터를 적용한다", async () => {
  const { filterCampaignGallery } = await import("./campaign-gallery.ts");
  const cards = ["pending", "processing", "failed", "done"].map((status, i) => ({
    id: String(i),
    status,
    name: "시그니처",
    brand: "브랜드",
    channels: ["Instagram"],
    endDate: "2026-09-18",
    createdAt: "2026-09-10",
  }));
  assert.deepEqual(
    filterCampaignGallery(cards, new URLSearchParams()).map((c) => c.id),
    ["0", "1", "2"],
  );
  assert.deepEqual(
    filterCampaignGallery(cards, new URLSearchParams("status=done")).map((c) => c.id),
    ["3"],
  );
  assert.equal(filterCampaignGallery(cards, new URLSearchParams("q=없는상품")).length, 0);
  assert.equal(filterCampaignGallery(cards, new URLSearchParams("channel=Pinterest")).length, 0);
  assert.equal(
    filterCampaignGallery(cards, new URLSearchParams("from=2026-10-01&to=2026-09-01")).length,
    0,
  );
});
