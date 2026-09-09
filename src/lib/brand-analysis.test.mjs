import assert from "node:assert/strict";
import { test } from "node:test";
import { listingUrlsFromLinks } from "./agents/brand-analysis/listing-urls.ts";
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
  assert.equal(
    brandAnalysisRequestSchema.safeParse({ url: " https://example.com " }).success,
    true,
  );
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

test("브랜드 주소에서 광고·검색 추적 파라미터를 뺀다", () => {
  const profile = normalizeBrandProfile(
    draft,
    "https://havehad.kr/?srsltid=AfmBOop9Lvk98_xcjaceL1sIzACnaISfr4JQtcmgrqUfV4BpmbtFNZRj",
  );

  assert.equal(profile.source_url, "https://havehad.kr/");
});

test("지도 장소 페이지에서는 같은 대상의 메뉴 링크만 따라간다", () => {
  const links = [
    "https://pcmap.place.naver.com/restaurant/1630421798/menu?fromPanelNum=1",
    "https://pcmap.place.naver.com/restaurant/1630421798/review/visitor",
    "https://pcmap.place.naver.com/restaurant/1630421798/photo",
    "https://pcmap.place.naver.com/restaurant/information",
    "https://mail.naver.com/",
  ];

  assert.deepEqual(
    listingUrlsFromLinks(links, "https://map.naver.com/p/entry/place/1630421798", 5),
    ["https://pcmap.place.naver.com/restaurant/1630421798/menu"],
  );
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
