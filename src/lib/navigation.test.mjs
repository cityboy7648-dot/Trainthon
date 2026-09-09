import assert from "node:assert/strict";
import test from "node:test";
import { getPrimaryNavHref } from "./navigation.ts";

test("대시보드는 사이드바 앱 화면으로 이동한다", () => {
  assert.equal(getPrimaryNavHref("dashboard"), "/dashboard");
});
