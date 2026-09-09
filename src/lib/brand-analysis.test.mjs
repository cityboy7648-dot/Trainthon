import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertCompleteAnalysis,
  normalizeBrandProfile,
} from "./agents/brand-analysis/normalize-brand-profile.ts";
import { AppError } from "./errors.ts";
import { brandAnalysisRequestSchema, brandProfileSchema } from "./types.ts";

const draft = {
  name: "Example",
  tagline: null,
  industry: null,
  logo_url: null,
  palette: ["#aabbcc", "#AABBCC"],
  font_feel: null,
  voice: null,
  mood_keywords: ["차분함", " 차분함 "],
  products: [
    {
      name: "상품 A",
      image_url: null,
      description: "설명",
      price: null,
    },
    {
      name: "상품  A",
      image_url: "https://example.com/a.jpg",
      description: null,
      price: "10,000원",
    },
  ],
  target_audience: null,
};

test("HTTP(S) URL만 분석 요청으로 받는다", () => {
  assert.equal(brandAnalysisRequestSchema.safeParse({ url: " https://example.com " }).success, true);
  assert.equal(brandAnalysisRequestSchema.safeParse({ url: "ftp://example.com" }).success, false);
  assert.equal(brandAnalysisRequestSchema.safeParse({ url: "not-a-url" }).success, false);
});

test("색상과 키워드, 중복 제품을 정규화한다", () => {
  const profile = normalizeBrandProfile(draft, "https://example.com");

  assert.deepEqual(profile.palette, ["#AABBCC"]);
  assert.deepEqual(profile.mood_keywords, ["차분함"]);
  assert.equal(profile.products.length, 1);
  assert.equal(profile.products[0]?.image_url, "https://example.com/a.jpg");
  assert.equal(profile.products[0]?.price, "10,000원");
  assert.equal(brandProfileSchema.safeParse(profile).success, true);
});

test("전체 수집을 확인하지 못한 결과는 실패한다", () => {
  assert.throws(
    () =>
      assertCompleteAnalysis({
        profile: draft,
        collection_complete: false,
        incomplete_reason: "마지막 페이지를 확인하지 못했다.",
      }),
    (error) =>
      error instanceof AppError &&
      error.code === "analysis_failed" &&
      error.cause === "마지막 페이지를 확인하지 못했다.",
  );
});
