import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

let activeExtractions = 0;
let maxActiveExtractions = 0;
let mergeStartedWithActiveExtractions = null;
let mergeInput = null;

globalThis.analyzeBrandTest = {
  async collectSite() {
    return {
      branding: null,
      dynamicCatalog: "테스트 수집 범위",
      pages: [
        {
          url: "https://example.com/",
          title: "홈",
          markdown: "홈".repeat(130_000),
          links: [],
          images: [],
        },
        {
          url: "https://example.com/shop",
          title: "상품",
          markdown: "상품".repeat(130_000),
          links: [],
          images: [],
        },
        {
          url: "https://example.com/about",
          title: "소개",
          markdown: "소개".repeat(130_000),
          links: [],
          images: [],
        },
      ],
    };
  },
  async parseStructuredOutput(_schema, schemaName, _instructions, input) {
    if (schemaName === "brand_evidence") {
      const { chunk } = JSON.parse(input);
      activeExtractions += 1;
      maxActiveExtractions = Math.max(maxActiveExtractions, activeExtractions);
      await new Promise((resolve) => setTimeout(resolve, chunk === 1 ? 30 : 5));
      activeExtractions -= 1;
      return {
        output: {
          name: `chunk-${chunk}`,
          address: null,
          tagline: null,
          industry: null,
          logo_url: null,
          palette: [],
          font_feel: null,
          voice: null,
          mood_keywords: [],
          products: [],
          target_audience: null,
        },
        usage: { inputTokens: 1, outputTokens: 1, calls: 1 },
      };
    }

    mergeStartedWithActiveExtractions = activeExtractions;
    mergeInput = JSON.parse(input);
    return {
      output: {
        profile: {
          name: "Example",
          address: null,
          tagline: null,
          industry: null,
          logo_url: null,
          palette: [],
          font_feel: null,
          voice: null,
          mood_keywords: [],
          products: [],
          target_audience: null,
        },
        collection_complete: true,
        incomplete_reason: null,
      },
      usage: { inputTokens: 1, outputTokens: 1, calls: 1 },
    };
  },
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    const stubs = {
      "@/lib/providers/firecrawl":
        "export const collectSite = (...args) => globalThis.analyzeBrandTest.collectSite(...args);",
      "@/lib/providers/openai":
        "export const parseStructuredOutput = (...args) => globalThis.analyzeBrandTest.parseStructuredOutput(...args);",
      "./normalize-brand-profile":
        "export function assertCompleteAnalysis() {} export function normalizeBrandProfile(profile, source_url) { return {...profile, source_url, analyzed_at: new Date().toISOString()}; }",
      "./prompt":
        "export const extractBrandEvidencePrompt = ''; export const mergeBrandProfilePrompt = '';",
    };
    if (stubs[specifier]) {
      return {
        url: `data:text/javascript,${encodeURIComponent(stubs[specifier])}`,
        shortCircuit: true,
      };
    }
    if (specifier.startsWith("@/lib/")) {
      return nextResolve(new URL(`./${specifier.slice(6)}.ts`, import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});

test("사이트 조각을 최대 2개씩 분석한 뒤 순서대로 병합한다", async () => {
  const { analyzeBrand } = await import("./agents/brand-analysis/analyze-brand.ts");
  const result = await analyzeBrand("https://example.com/", {
    requestId: "request-1",
    runId: null,
    assetId: null,
  });

  assert.equal(maxActiveExtractions, 2);
  assert.equal(mergeStartedWithActiveExtractions, 0);
  assert.deepEqual(
    mergeInput.extracted_evidence.map((item) => item.name),
    ["chunk-1", "chunk-2", "chunk-3"],
  );
  assert.deepEqual(result.usage, { inputTokens: 4, outputTokens: 4, calls: 4 });
});
