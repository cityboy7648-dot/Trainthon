import { AppError } from "@/lib/errors";
import type { LogContext } from "@/lib/log";
import { collectSite } from "@/lib/providers/firecrawl";
import { parseStructuredOutput } from "@/lib/providers/openai";
import {
  brandAnalysisOutputSchema,
  brandEvidenceSchema,
  type BrandEvidence,
  type BrandProfileData,
  type CollectedPage,
} from "@/lib/types";
import { assertCompleteAnalysis, normalizeBrandProfile } from "./normalize-brand-profile";
import { extractBrandEvidencePrompt, mergeBrandProfilePrompt } from "./prompt";

const MAX_CHUNK_CHARACTERS = 240_000;
const MAX_PAGE_CHARACTERS = 500_000;
const MAX_MERGE_CHARACTERS = 2_500_000;

function serializePage(page: CollectedPage): string {
  return JSON.stringify({
    url: page.url,
    title: page.title,
    markdown: page.markdown,
    links: page.links,
    images: page.images,
  });
}

function createPageChunks(pages: CollectedPage[]): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let currentLength = 0;

  for (const page of pages) {
    const serialized = serializePage(page);

    if (serialized.length > MAX_PAGE_CHARACTERS) {
      throw new AppError(
        "analysis_failed",
        `한 페이지의 내용이 안전 분석 한도 ${MAX_PAGE_CHARACTERS}자를 넘는다.`,
      );
    }

    if (current.length > 0 && currentLength + serialized.length > MAX_CHUNK_CHARACTERS) {
      chunks.push(current.join("\n"));
      current = [];
      currentLength = 0;
    }

    current.push(serialized);
    currentLength += serialized.length;
  }

  if (current.length > 0) {
    chunks.push(current.join("\n"));
  }

  return chunks;
}

export async function analyzeBrand(
  sourceUrl: string,
  context: LogContext,
): Promise<BrandProfileData> {
  const collected = await collectSite(sourceUrl, context);
  const chunks = createPageChunks(collected.pages);
  const evidence: BrandEvidence[] = await Promise.all(
    chunks.map((chunk, index) =>
      parseStructuredOutput(
        brandEvidenceSchema,
        "brand_evidence",
        extractBrandEvidencePrompt,
        JSON.stringify({
          source_url: sourceUrl,
          homepage_branding: collected.branding,
          chunk: index + 1,
          total_chunks: chunks.length,
          pages: chunk,
        }),
        context,
      ),
    ),
  );

  const mergeInput = JSON.stringify({
    source_url: sourceUrl,
    homepage_branding: collected.branding,
    dynamic_catalog: collected.dynamicCatalog,
    extracted_evidence: evidence,
  });

  if (mergeInput.length > MAX_MERGE_CHARACTERS) {
    throw new AppError(
      "analysis_failed",
      `병합할 제품 정보가 안전 분석 한도 ${MAX_MERGE_CHARACTERS}자를 넘는다.`,
    );
  }

  const result = await parseStructuredOutput(
    brandAnalysisOutputSchema,
    "brand_analysis",
    mergeBrandProfilePrompt,
    mergeInput,
    context,
  );

  assertCompleteAnalysis(result);
  return normalizeBrandProfile(result.profile, sourceUrl);
}
