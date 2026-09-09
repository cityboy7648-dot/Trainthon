import assert from "node:assert/strict";
import test from "node:test";
import { campaigns } from "../definitions/campaigns.ts";
import { getCampaignCandidates } from "./data/campaign-catalog.ts";

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
