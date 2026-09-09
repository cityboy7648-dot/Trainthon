import assert from "node:assert/strict";
import test from "node:test";
import { campaign3RequestSchema, campaign3PlanSchema } from "./types.ts";
import { campaign3 } from "../definitions/campaign-3.ts";

test("공개일과 선택 상품을 반드시 받고 임의 프롬프트는 거부한다", () => {
  const input = {
    brandId: "a9d69a1d-dffe-4d9f-afb1-0a7539de1931",
    productIndex: 0,
    launchDate: "2026-10-01",
  };
  assert.equal(campaign3RequestSchema.safeParse(input).success, true);
  for (const key of Object.keys(input)) {
    const missing = { ...input };
    delete missing[key];
    assert.equal(campaign3RequestSchema.safeParse(missing).success, false);
  }
  for (const launchDate of ["2026-02-30", "내일", ""]) {
    assert.equal(campaign3RequestSchema.safeParse({ ...input, launchDate }).success, false);
  }
  assert.equal(campaign3RequestSchema.safeParse({ ...input, prompt: "변경" }).success, false);
});

test("승인 일정은 피드 7장과 D-3·D-day·D+3 스토리 3장이다", () => {
  assert.equal(campaign3.schedule.length, 7);
  assert.deepEqual(
    campaign3.schedule.filter((slot) => slot.story).map((slot) => slot.offset),
    [-3, 0, 3],
  );
});

test("기획 결과에서 날짜별 피드와 스토리를 빠뜨릴 수 없다", () => {
  const post = { imagePrompt: "제품 사진", caption: "소개" };
  const plan = {
    concept: "공개 캠페인",
    days: Object.fromEntries(
      campaign3.schedule.map((slot) => [
        slot.key,
        { feed: post, ...(slot.story ? { storyPrompt: "세로 티저" } : {}) },
      ]),
    ),
  };
  assert.equal(campaign3PlanSchema.safeParse(plan).success, true);
  delete plan.days.launch.storyPrompt;
  assert.equal(campaign3PlanSchema.safeParse(plan).success, false);
});
