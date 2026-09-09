import assert from "node:assert/strict";
import test from "node:test";
import { getCampaignOverview } from "./campaigns.ts";

const campaign = {
  id: "campaign-1",
  status: "processing",
  campaign: { key: "brand-awareness" },
};

test("만든 캠페인이 없으면 새 캠페인 화면을 연다", () => {
  assert.deepEqual(getCampaignOverview([], "processing"), { mode: "create" });
});

test("선택한 상태의 캠페인만 갤러리에 보여준다", () => {
  const draftCampaign = {
    ...campaign,
    id: "campaign-2",
    status: "draft",
  };

  assert.deepEqual(getCampaignOverview([campaign, draftCampaign], "draft"), {
    mode: "gallery",
    status: "draft",
    campaigns: [draftCampaign],
    counts: { processing: 1, done: 0, draft: 1 },
  });
});

test("알 수 없는 상태는 진행 중으로 표시한다", () => {
  assert.deepEqual(getCampaignOverview([campaign], "unknown"), {
    mode: "gallery",
    status: "processing",
    campaigns: [campaign],
    counts: { processing: 1, done: 0, draft: 0 },
  });
});
