import assert from "node:assert/strict";
import test from "node:test";

test("대표 상품을 바꾸면 동반 상품의 중복과 이전 실행을 해제한다", async () => {
  const selection = await import("./campaign-five-selection.ts");
  const next = selection.selectPrimaryProduct(
    new URLSearchParams("campaign=complete_set&product=a&companions=b,c&run=old"),
    "b",
  );
  assert.equal(next.get("product"), "b");
  assert.equal(next.get("companions"), "c");
  assert.equal(next.has("run"), false);
  assert.equal(next.get("campaign"), "complete_set");
});

test("동반 상품을 선택·해제하고 대표 상품과 최대 10개 제한을 지킨다", async () => {
  const { toggleCompanionProduct } = await import("./campaign-five-selection.ts");
  const original = new URLSearchParams("product=a&companions=b&run=old");
  assert.equal(toggleCompanionProduct(original, "c").get("companions"), "b,c");
  assert.equal(toggleCompanionProduct(original, "b").has("companions"), false);
  assert.equal(toggleCompanionProduct(original, "a").get("companions"), "b");
  assert.equal(original.get("run"), "old");
  const full = new URLSearchParams("product=a&companions=0,1,2,3,4,5,6,7,8,9");
  assert.equal(toggleCompanionProduct(full, "extra").get("companions"), "0,1,2,3,4,5,6,7,8,9");
  assert.equal(toggleCompanionProduct(full, "9").get("companions"), "0,1,2,3,4,5,6,7,8");
});
