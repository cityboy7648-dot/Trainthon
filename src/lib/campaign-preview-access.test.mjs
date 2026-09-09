import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
registerHooks({
  resolve(s, c, n) {
    const modules = {
      "next/navigation":
        "export const usePathname=()=>'/campaigns/preview-signature-grid';export const useRouter=()=>({replace(){}});",
      "@/components/app-sidebar/app-sidebar": "export const AppSidebar=()=>null;",
      "@/components/home/home-header": "export const HomeHeader=()=>null;",
      "@/components/home/home-skeleton": "export const HomeSkeleton=()=> 'stuck-loading';",
      "@/components/ui/sidebar": "export const SidebarProvider=({children})=>children;",
      "@/lib/env": "export const isProduction=false;export const isPreviewAnalysis=true;",
    };
    if (modules[s])
      return { url: "data:text/javascript," + encodeURIComponent(modules[s]), shortCircuit: true };
    if (s.startsWith("@/")) return n(new URL(`../${s.slice(2)}.ts`, import.meta.url).href, c);
    return n(s, c);
  },
  load(url, c, n) {
    if (url.endsWith(".tsx"))
      return {
        format: "module",
        source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
          compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
        }).outputText,
        shortCircuit: true,
      };
    return n(url, c);
  },
});
const { AppAccess } = await import("../components/app-sidebar/app-access.tsx");
test("미리보기는 animation frame이나 브랜드 세션 초기화를 기다리지 않는다", () => {
  const html = renderToStaticMarkup(
    createElement(AppAccess, { user: null }, "campaign-detail-visible"),
  );
  assert.ok(html.includes("campaign-detail-visible"));
  assert.ok(!html.includes("stuck-loading"));
});
