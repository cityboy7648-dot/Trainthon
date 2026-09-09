import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/types") {
      return nextResolve(new URL("./types.ts", import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});

test("분석 완료 여부를 확인하고 계정 변경 시 이전 브랜드를 지운다", async () => {
  const values = {};
  const storage = new Proxy(values, {
    get(target, key) {
      if (key === "getItem") return (name) => target[name] ?? null;
      if (key === "setItem")
        return (name, value) => {
          target[name] = value;
        };
      if (key === "removeItem")
        return (name) => {
          delete target[name];
        };
      return target[key];
    },
  });
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const oldWindow = globalThis.window;
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: storage });
  globalThis.window = new EventTarget();
  try {
    const { initializeBrandSession, hasAnalyzedBrandProfile } =
      await import("./brand-profile-session.ts");
    initializeBrandSession("first@example.com");
    assert.equal(hasAnalyzedBrandProfile(), false);
    storage.setItem("brand-profile:active", "https://example.com");
    storage.setItem("brand-profile:https://example.com", "invalid json");
    assert.equal(hasAnalyzedBrandProfile(), false);
    initializeBrandSession("second@example.com");
    assert.equal(storage.getItem("brand-profile:https://example.com"), null);
    assert.equal(hasAnalyzedBrandProfile(), false);
  } finally {
    if (oldStorage) Object.defineProperty(globalThis, "sessionStorage", oldStorage);
    else delete globalThis.sessionStorage;
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
  }
});

test("개발 미리보기는 로그인한 브랜드가 없어도 앱 화면을 연다", async () => {
  const { shouldAllowPreviewAccess } = await import("./brand-profile-session.ts");

  assert.equal(shouldAllowPreviewAccess(false, true), true);
  assert.equal(shouldAllowPreviewAccess(true, true), false);
});
