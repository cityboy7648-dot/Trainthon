// MOCK: 예시 데이터. 서버 연결 전 임시.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});

test("입력한 사이트 주소를 브랜드 프로필에 유지한다", async () => {
  const { getMockBrandProfile } = await import("./brand-profile.ts");

  const profile = await getMockBrandProfile("https://example.com");

  assert.equal(profile.source_url, "https://example.com/");
});

test("추적 파라미터가 있는 주소는 브랜드 프로필에서 뺀다", async () => {
  const { getMockBrandProfile } = await import("./brand-profile.ts");

  const profile = await getMockBrandProfile(
    "https://havehad.kr/?srsltid=AfmBOop9Lvk98_xcjaceL1sIzACnaISfr4JQtcmgrqUfV4BpmbtFNZRj",
  );

  assert.equal(profile.source_url, "https://havehad.kr/");
});

test("모든 제품과 서비스에 가격이 있다", async () => {
  const { getMockBrandProfile } = await import("./brand-profile.ts");

  const profile = await getMockBrandProfile("https://example.com");

  assert.equal(profile.products.length, 12);
  assert.equal(
    profile.products.every((product) => product.price !== null),
    true,
  );
});
