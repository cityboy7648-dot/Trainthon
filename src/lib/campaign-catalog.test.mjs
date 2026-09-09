import assert from "node:assert/strict";
import test from "node:test";
import { campaigns } from "../definitions/campaigns.ts";
import { getCampaignCandidates } from "./data/campaign-catalog.ts";

test("세트 캠페인을 선택할 수 있고 5일 결과 구성을 안내한다", () => {
  const completeSet = campaigns.find((item) => item.key === "complete_set");
  assert.ok(completeSet);
  assert.equal(completeSet.duration_days, 5);
  assert.equal(completeSet.schedule.length, 5);
  assert.ok(completeSet.outputs.some((item) => item.includes("캐러셀 2세트")));
  assert.ok(completeSet.outputs.some((item) => item.includes("2:3")));
  assert.ok(getCampaignCandidates().some((item) => item.key === "complete_set"));
});

test("캠페인 상세에 확정된 결과물과 비율이 있다", () => {
  const grid = campaigns.find((item) => item.key === "signature_grid");
  const scenes = campaigns.find((item) => item.key === "one_product_three_scenes");
  assert.ok(grid.outputs.some((item) => item.includes("9장") && item.includes("1:1")));
  assert.ok(grid.outputs.some((item) => item.includes("캡션 9개")));
  assert.ok(scenes.outputs.some((item) => item.includes("4장") && item.includes("4:5")));
  assert.ok(scenes.outputs.some((item) => item.includes("3장") && item.includes("9:16")));
  assert.ok(scenes.outputs.some((item) => item.includes("캐러셀 3장")));
  assert.ok(scenes.outputs.some((item) => item.includes("캡션 5개")));
});

test("확정 목록에서 중복 없이 최대 3개를 선택하고 원본은 보존한다", () => {
  const original = [...campaigns];
  try {
    for (const count of [0, 1, 2, 3, 8]) {
      const catalog = Array.from({ length: count }, (_, index) => ({
        ...original[0],
        key: `campaign-${index}`,
      }));
      campaigns.splice(0, campaigns.length, ...catalog);
      for (let attempt = 0; attempt < 20; attempt++) {
        const result = getCampaignCandidates();
        assert.equal(result.length, Math.min(count, 3));
        assert.equal(new Set(result.map((campaign) => campaign.key)).size, result.length);
        assert.ok(result.every((campaign) => catalog.includes(campaign)));
        assert.deepEqual(campaigns, catalog);
      }
    }
  } finally {
    campaigns.splice(0, campaigns.length, ...original);
  }
});
