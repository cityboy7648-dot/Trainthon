import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

globalThis.brandEntry = { user: null, profile: null, failed: false, reads: 0 };
registerHooks({
  resolve(specifier, context, next) {
    const sources = {
      "next/navigation":
        "export function redirect(path) { throw Object.assign(new Error('redirect'), { path }); }",
      "@/lib/env": "export const isPreviewAnalysis = false; export const isProduction = true;",
      "@/lib/data/session":
        "export async function getSessionUser() { return globalThis.brandEntry.user; }",
      "@/lib/data/brand-profile":
        "export async function getSavedBrandProfile() { const state = globalThis.brandEntry; state.reads++; if (state.failed) throw new Error('database unavailable'); return state.profile; }",
    };
    if (specifier in sources)
      return {
        url: `data:text/javascript,${encodeURIComponent(sources[specifier])}`,
        shortCircuit: true,
      };
    if (specifier.startsWith("@/components/")) {
      const name = specifier
        .split("/")
        .at(-1)
        .split("-")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join("");
      return {
        url: `data:text/javascript,export function ${name}() { return null; }`,
        shortCircuit: true,
      };
    }
    if (specifier.startsWith("@/"))
      return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith(".tsx"))
      return {
        format: "module",
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
          compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
        }).outputText,
      };
    return next(url, context);
  },
});

const { default: HomePage } = await import("../app/(onboarding)/page.tsx");
const { default: AppLayout } = await import("../app/(app)/layout.tsx");
const user = { name: "관리자", email: "admin@example.com" };

test("기존 브랜드가 있는 로그인 사용자는 첫 화면 대신 대시보드로 간다", async () => {
  globalThis.brandEntry = {
    user,
    profile: { source_url: "https://example.com" },
    failed: false,
    reads: 0,
  };
  await assert.rejects(HomePage(), (error) => error.path === "/dashboard");
});

test("로그인하지 않았거나 브랜드가 없으면 URL 입력 화면을 유지한다", async () => {
  globalThis.brandEntry = { user: null, profile: null, failed: false, reads: 0 };
  assert.equal((await HomePage()).type, "main");
  assert.equal(globalThis.brandEntry.reads, 0);
  globalThis.brandEntry.user = user;
  assert.equal((await HomePage()).type, "main");
});

test("앱 진입 시 서버 브랜드를 전달해 자식 화면 전에 복원할 수 있다", async () => {
  const profile = { source_url: "https://example.com" };
  globalThis.brandEntry = { user, profile, failed: false, reads: 0 };
  const result = await AppLayout({ children: "dashboard" });
  assert.deepEqual(result.props.savedProfile, profile);
  assert.equal(result.props.user.email, user.email);
});

test("저장된 브랜드 조회 실패를 미설정 사용자로 취급하지 않는다", async () => {
  globalThis.brandEntry = { user, profile: null, failed: true, reads: 0 };
  assert.equal((await HomePage()).props.code, "network");
  assert.equal((await AppLayout({ children: "dashboard" })).props.code, "network");
});
