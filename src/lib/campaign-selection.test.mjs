import assert from "node:assert/strict";
import test from "node:test";
import { pickCampaign } from "./campaign-selection.ts";

test("다른 카드를 고르면 이전 상품 선택과 열린 선택 영역을 초기화한다", () => {
  const params = new URLSearchParams(
    "campaign=complete_set&picked=complete_set&product=a&companions=b&brandId=c&productIndex=0&run=d&keep=yes",
  );
  const next = pickCampaign(params, "real_usage");
  assert.equal(next.toString(), "picked=real_usage&keep=yes");
  assert.equal(params.get("product"), "a");
});

test("같은 카드를 다시 고르면 상품 선택을 유지한다", () => {
  const params = new URLSearchParams("campaign=complete_set&picked=complete_set&product=a");
  assert.equal(pickCampaign(params, "complete_set").toString(), params.toString());
});
