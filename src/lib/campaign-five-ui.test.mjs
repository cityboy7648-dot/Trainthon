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
    if (specifier === "@/lib/env")
      return {
        url: "data:text/javascript,export const isCampaignPreview=false",
        shortCircuit: true,
      };
    if (specifier === "@/lib/data/campaign-workspace")
      return { url: "test:workspace-data", shortCircuit: true };
    if (specifier === "next/link") return { url: "test:next-link-interop", shortCircuit: true };
    if (specifier === "@/lib/data/campaign-4-actions")
      return { url: "test:campaign-four-action", shortCircuit: true };
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
    if (url === "test:workspace-data")
      return {
        format: "module",
        shortCircuit: true,
        source: `export async function ownedCampaign(){return {run:{campaign_key:globalThis.detailCampaign.key}}} export async function getSavedCampaign(){return globalThis.detailCampaign}`,
      };
    if (url === "test:next-link-interop")
      return {
        format: "module",
        shortCircuit: true,
        source: `import link from ${JSON.stringify(import.meta.resolve("next/link.js"))}; export default link.default;`,
      };
    if (url === "test:campaign-four-action")
      return {
        format: "module",
        shortCircuit: true,
        source: `export async function requestCampaign4Images() { throw new Error('No paid calls in render tests'); }`,
      };
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
        source: `export function selectSavedCampaign() { throw new Error('No writes in render tests'); } export const editCampaignPost = selectSavedCampaign; export const replaceCampaignImage = selectSavedCampaign; export const refreshSavedCampaign = selectSavedCampaign;`,
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
          compilerOptions: {
            jsx: ts.JsxEmit.ReactJSX,
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ESNext,
          },
        }).outputText,
      };
    }
    return nextLoad(url, context);
  },
});

test("상세 상단은 경로·개발 안내 대신 뒤로가기 버튼을 표시한다", async () => {
  const { CampaignWorkspace } = await import("../components/campaigns/campaign-workspace.tsx");
  const { previewCampaign } = await import("../mock/campaign-workspace.ts");
  globalThis.campaignQuery = "";
  const html = renderCampaignSelection(
    createElement(CampaignWorkspace, { campaign: previewCampaign, onPreviewEdit: async () => {} }),
  );
  assert.match(html, /href="\/campaigns"/);
  assert.match(html, /뒤로가기/);
  assert.doesNotMatch(html, /개발 미리보기/);
  assert.doesNotMatch(html, /<nav/);
  assert.match(html, /font-shell/);
});

test("갤러리는 진행중·완료만 표시하고 대표 이미지 카드에서 기존 상세로 연결한다", async () => {
  const { CampaignGalleryView } = await import("../components/campaigns/campaign-gallery-view.tsx");
  const { toCampaignGalleryCard } = await import("./campaign-gallery.ts");
  const campaign = toCampaignGalleryCard({
    id: "saved-run",
    campaign_key: "signature_grid",
    status: "done",
    created_at: "2026-09-10",
    brands: { profile: { name: "브랜드" } },
    assets: [],
  });
  globalThis.campaignQuery = "status=done";
  const html = renderCampaignSelection(
    createElement(CampaignGalleryView, { campaigns: [campaign], preview: false }),
  );
  assert.match(html, /진행중/);
  assert.match(html, /완료/);
  assert.doesNotMatch(html, /초안/);
  assert.match(html, /href="\/campaigns\/saved-run"/);
  assert.match(html, /card-thumbnail-soft/);
  assert.match(html, /aspect-campaign-image/);
  assert.doesNotMatch(html, />브랜드</);
  globalThis.campaignQuery = "";
});

test("리얼 사용기는 대표 상품 이미지와 가격을 표시하고 선택 후 생성할 수 있다", async () => {
  const { Campaign4Planner } = await import("../components/campaigns/campaign-4-planner.tsx");
  globalThis.campaignQuery = "brandId=brand&productIndex=0";
  const html = renderCampaignSelection(
    createElement(Campaign4Planner, {
      brands: [
        {
          brandId: "brand",
          brandName: "브랜드",
          products: [
            {
              index: 0,
              name: "대표 상품",
              price: "10,000원",
              description: null,
              image_url: "https://example.com/product.png",
            },
          ],
        },
      ],
    }),
  );
  assert.match(html, /alt="대표 상품"/);
  assert.match(html, /10,000원/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /캠페인 생성하기/);
  assert.doesNotMatch(html, /<button[^>]*type="submit"[^>]* disabled=/);
  assert.doesNotMatch(html, /aria-busy/);
  assert.doesNotMatch(html, /같은 상품과 인물로 이미지 5장을 만들고 있어요/);
  globalThis.campaignQuery = "";
});

test("리얼 사용기 상세는 생성 중 스켈레톤을 보여 준다", async () => {
  const { CampaignWorkspaceResult } =
    await import("../components/campaigns/campaign-workspace-result.tsx");
  globalThis.detailCampaign = { key: "real_usage" };
  const html = renderCampaignSelection(
    await CampaignWorkspaceResult({ id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" }),
  );
  assert.match(html, /리얼 사용기/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /같은 상품과 인물로 이미지 5장을 만들고 있어요/);
  assert.doesNotMatch(html, /게시 일정/);
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

test("세트 상세는 11개 일정과 Pinterest 미리보기·상품 주소를 표시한다", async () => {
  const { CampaignWorkspaceResult } =
    await import("../components/campaigns/campaign-workspace-result.tsx");
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
      image_url: null,
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
  globalThis.detailCampaign = {
    id: "run",
    key: "complete_set",
    name: "세트로 완성",
    brand: "브랜드",
    startDate: "2026-09-10",
    status: "done",
    posts: result.assets.map((a) => ({
      ...a,
      meta: { ...a.meta, product_links: result.product_links },
    })),
  };
  globalThis.campaignQuery = "post=2&view=pinterest";
  const html = renderCampaignSelection(await CampaignWorkspaceResult({ id: "run" }));
  assert.equal((html.match(/data-selected=/g) ?? []).length, 11);
  assert.match(html, /게시 일정/);
  assert.match(html, /미리보기/);
  assert.match(html, /aspect-campaign-pinterest/);
  assert.match(html, /일자별본문2/);
  assert.match(html, /href="https:\/\/example.com\/products\/a"/);
  assert.match(html, /상품 상세 주소를 확인하지 못했어요/);
  globalThis.campaignQuery = "";
});

test("캠페인 2 상세는 생성 중에도 게시 일정·미리보기·진행 bar를 유지한다", async () => {
  const { CampaignWorkspaceResult } =
    await import("../components/campaigns/campaign-workspace-result.tsx");
  globalThis.campaignQuery = "";
  globalThis.detailCampaign = {
    id: "run",
    key: "one_product_three_scenes",
    name: "한 상품, 세 장면",
    brand: "브랜드",
    startDate: "2026-09-10",
    status: "processing",
    posts: [
      {
        id: "one",
        status: "processing",
        image_url: null,
        meta: { day: 1, position: 1, format: "feed", caption: null },
      },
    ],
  };
  const html = renderCampaignSelection(await CampaignWorkspaceResult({ id: "run" }));
  assert.match(html, /게시 일정/);
  assert.match(html, /미리보기/);
  assert.match(html, /<progress/);
  assert.match(html, /value="0"/);
  assert.doesNotMatch(html, />재시도</);
  globalThis.detailCampaign = {
    ...globalThis.detailCampaign,
    status: "failed",
    posts: globalThis.detailCampaign.posts.map((p) => ({
      ...p,
      status: "failed",
      meta: { ...p.meta, error: "시간 초과" },
    })),
  };
  const failed = renderCampaignSelection(await CampaignWorkspaceResult({ id: "run" }));
  assert.match(failed, /시간 초과/);
  assert.doesNotMatch(failed, />콘텐츠를 생성하고 있어요/);
  assert.match(failed, />재시도</);
  assert.ok(failed.indexOf("재시도") < failed.indexOf("전체 다운로드"));
  assert.match(failed, /bg-shell-button/);
});
