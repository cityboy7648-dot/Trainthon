import assert from "node:assert/strict";
import test from "node:test";
import { resolveUrlSubmission, toBrandSourceUrl } from "./home.ts";

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
