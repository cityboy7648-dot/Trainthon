import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime.js";
import { imageConfigDefault } from "next/dist/shared/lib/image-config.js";
import nextConfig from "../../next.config.ts";

function renderCampaignSelection(component) {
  return renderToStaticMarkup(
    createElement(
      ImageConfigContext.Provider,
      {
        value: { ...imageConfigDefault, ...nextConfig.images },
      },
      component,
    ),
  );
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/navigation") return { url: "test:navigation", shortCircuit: true };
    if (specifier === "@/lib/data/campaign-workspace-actions")
      return { url: "test:selection-action", shortCircuit: true };
    if (specifier === "@/components/campaigns/campaign-product-picker")
      return { url: "test:product-picker", shortCircuit: true };
    if (specifier === "next/image") return { url: "test:next-image-interop", shortCircuit: true };
    if (specifier.startsWith("@/") || specifier.startsWith(".")) {
      const base = specifier.startsWith("@/")
        ? new URL(`../${specifier.slice(2)}`, import.meta.url)
        : new URL(specifier, context.parentURL);
      for (const suffix of ["", ".ts", ".tsx"]) {
        const path = fileURLToPath(base) + suffix;
        if (existsSync(path) && /\.tsx?$/.test(path))
          return { url: pathToFileURL(path).href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "test:navigation")
      return {
        format: "module",
        shortCircuit: true,
        source: `export const useSearchParams = () => new URLSearchParams(globalThis.campaignQuery ?? ''); export const usePathname = () => '/campaigns/new'; export const useRouter = () => ({ push() {} });`,
      };
    if (url === "test:selection-action")
      return {
        format: "module",
        shortCircuit: true,
        source: `export function selectSavedCampaign() { throw new Error('No writes in render tests'); }`,
      };
    if (url === "test:product-picker")
      return {
        format: "module",
        shortCircuit: true,
        source: `import { createElement } from ${JSON.stringify(import.meta.resolve("react"))}; export function CampaignProductPicker({campaignNumber}) { return createElement('section', {'data-picker': campaignNumber}); }`,
      };
    if (url === "test:next-image-interop") {
      const imageUrl = import.meta.resolve("next/image.js");
      return {
        format: "module",
        shortCircuit: true,
        source: `import image from ${JSON.stringify(imageUrl)}; export default image.default;`,
      };
    }
    if (url.endsWith(".tsx")) {
      return {
        format: "module",
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
          compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
        }).outputText,
      };
    }
    return nextLoad(url, context);
  },
});

test("선택 후에도 카드 세 개 아래에 선택 버튼과 상품 선택 영역을 유지한다", async () => {
  const { CampaignSelection } = await import("../components/campaigns/campaign-selection.tsx");
  const { campaigns } = await import("../definitions/campaigns.ts");
  globalThis.campaignQuery = "campaign=complete_set";
  const html = renderCampaignSelection(
    createElement(CampaignSelection, {
      campaigns: campaigns.filter((item) => item.key !== "complete_set").slice(0, 3),
    }),
  );
  assert.equal((html.match(/<article /g) ?? []).length, 3);
  assert.match(html, /md:col-start-3/);
  assert.match(html, /aria-expanded="true"/);
  assert.ok(
    html.lastIndexOf("</article>") < html.indexOf('aria-controls="campaign-product-selection"'),
  );
  assert.ok(
    html.indexOf('aria-controls="campaign-product-selection"') < html.indexOf('data-picker="5"'),
  );
  assert.doesNotMatch(html, /campaign-hero-image|fixed right-6/);
  globalThis.campaignQuery = "";
});

test("카드를 고르기 전 선택 버튼은 비활성화되고 상품 영역은 닫혀 있다", async () => {
  const { CampaignSelection } = await import("../components/campaigns/campaign-selection.tsx");
  const { campaigns } = await import("../definitions/campaigns.ts");
  globalThis.campaignQuery = "";
  const html = renderCampaignSelection(
    createElement(CampaignSelection, { campaigns: campaigns.slice(0, 3) }),
  );
  assert.match(html, /<button[^>]*disabled[^>]*aria-expanded="false"/);
  assert.doesNotMatch(html, /data-picker=/);
});

test("상품 목록은 선택 상태와 가격을 표시하고 이미지 없는 상품을 비활성화한다", async () => {
  const { CampaignProductOptions } =
    await import("../components/campaigns/campaign-product-options.tsx");
  const html = renderToStaticMarkup(
    createElement(CampaignProductOptions, {
      products: [
        {
          key: "a",
          product: { name: "선택 상품", price: "10,000원", image_url: "https://example.com/a.png" },
        },
        { key: "b", product: { name: "이미지 없음", price: null, image_url: null } },
      ],
      selectedKeys: ["a"],
      disabled: false,
      onSelect() {},
      label: "상품 선택",
    }),
  );
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /10,000원/);
  assert.match(html, /<button[^>]*disabled=""[^>]*aria-pressed="false"/);
});

test("동반 상품 한도에 도달해도 선택된 상품은 해제할 수 있다", async () => {
  const { CampaignProductOptions } =
    await import("../components/campaigns/campaign-product-options.tsx");
  const html = renderToStaticMarkup(
    createElement(CampaignProductOptions, {
      products: ["a", "b"].map((key) => ({
        key,
        product: { name: key, price: null, image_url: "https://example.com/a.png" },
      })),
      selectedKeys: ["a"],
      disabled: false,
      limit: 1,
      onSelect() {},
      label: "동반 상품",
    }),
  );
  const buttons = html.match(/<button[^>]+>/g) ?? [];
  assert.equal(buttons.length, 2);
  assert.doesNotMatch(buttons[0], / disabled=""/);
  assert.match(buttons[1], / disabled=""/);
});

test("결과 화면은 11장과 일자별 캡션 5개, 확인된 상품 주소를 표시한다", async () => {
  const { CampaignFiveOutputs } = await import("../components/campaigns/campaign-five-outputs.tsx");
  const slots = [
    [1, "feed"],
    [2, "feed"],
    [2, "pinterest"],
    [3, "feed"],
    [3, "pinterest"],
    [4, "carousel"],
    [4, "carousel"],
    [4, "carousel"],
    [5, "carousel"],
    [5, "carousel"],
    [5, "carousel"],
  ];
  const result = {
    run_id: "run",
    status: "done",
    assets: slots.map(([day, format], index) => ({
      id: String(index),
      status: "done",
      image_url: "https://example.com/result.png",
      meta: {
        position: index + 1,
        day,
        format,
        primary_product: { name: "대표상품" },
        caption: `일자별본문${day}`,
        error: null,
      },
    })),
    product_links: [
      { key: "a", name: "상품A", url: "https://example.com/products/a" },
      { key: "b", name: "상품B", url: null },
    ],
  };
  const html = renderToStaticMarkup(createElement(CampaignFiveOutputs, { result, onRetry() {} }));
  assert.equal((html.match(/<img /g) ?? []).length, 11);
  assert.equal((html.match(/일자별본문/g) ?? []).length, 5);
  assert.equal((html.match(/data-pinterest="true"/g) ?? []).length, 2);
  assert.match(html, /href="https:\/\/example.com\/products\/a"/);
  assert.match(html, /상품 상세 주소를 확인하지 못했어요/);
});
