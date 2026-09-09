import assert from "node:assert/strict";
import test from "node:test";
import {
  homeAnalysisFailureHref,
  homeErrorFromSearch,
  resolveUrlSubmission,
  toBrandSourceUrl,
} from "./home.ts";

test("로그인하지 않은 URL 제출은 로그인 요청으로 바꾼다", () => {
  assert.deepEqual(resolveUrlSubmission("https://example.com", false), {
    kind: "authenticate",
  });
});

test("접속할 수 있는 사이트 주소는 분석 화면으로 보낸다", () => {
  assert.deepEqual(resolveUrlSubmission(" https://example.com/path ", true), {
    kind: "navigate",
    href: "/analyzing?url=https%3A%2F%2Fexample.com%2Fpath",
  });
  assert.deepEqual(resolveUrlSubmission("shop.com", true), {
    kind: "navigate",
    href: "/analyzing?url=https%3A%2F%2Fshop.com%2F",
  });
  assert.deepEqual(resolveUrlSubmission("localhost:3000", true), {
    kind: "navigate",
    href: "/analyzing?url=https%3A%2F%2Flocalhost%3A3000%2F",
  });
  assert.deepEqual(resolveUrlSubmission("ftp://example.com", true), {
    kind: "invalid",
  });
  assert.deepEqual(resolveUrlSubmission("hello", true), {
    kind: "invalid",
  });
  assert.deepEqual(resolveUrlSubmission("사이트주소", true), {
    kind: "invalid",
  });
});

test("전체 분석 실패는 첫 화면 오류로 보낸다", () => {
  const href = homeAnalysisFailureHref("사이트를 수집하지 못했다.");
  const params = new URL(href, "https://example.com").searchParams;

  assert.equal(params.get("error"), "analysis_failed");
  assert.equal(params.get("cause"), "사이트를 수집하지 못했다.");
  assert.deepEqual(homeErrorFromSearch("analysis_failed", "사이트를 수집하지 못했다."), {
    code: "analysis_failed",
    cause: "사이트를 수집하지 못했다.",
  });
  assert.equal(homeErrorFromSearch("nope"), undefined);
});

test("브랜드 탭 주소에서 광고·검색 추적을 뺀다", () => {
  assert.equal(
    toBrandSourceUrl(
      "https://havehad.kr/?srsltid=AfmBOop9Lvk98_xcjaceL1sIzACnaISfr4JQtcmgrqUfV4BpmbtFNZRj",
    ),
    "https://havehad.kr/",
  );
  assert.equal(
    toBrandSourceUrl("https://example.com/shop?utm_source=google#top"),
    "https://example.com/shop",
  );
  assert.equal(
    toBrandSourceUrl("https://map.naver.com/p/entry/place/1630421798"),
    "https://map.naver.com/p/entry/place/1630421798",
  );
});
