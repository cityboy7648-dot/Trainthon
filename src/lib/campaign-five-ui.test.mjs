import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

registerHooks({
  resolve(specifier, context, nextResolve) {
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
