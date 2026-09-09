import { AppError } from "@/lib/errors";
import type { LogContext } from "@/lib/log";
import { collectSite } from "@/lib/providers/firecrawl";
import { parseStructuredOutput } from "@/lib/providers/openai";
import { addTokenUsage, emptyTokenUsage } from "@/lib/token-usage";
import {
  brandAnalysisOutputSchema,
  brandEvidenceSchema,
  type BrandEvidence,
  type BrandProfileData,
  type CollectedPage,
  type TokenUsage,
} from "@/lib/types";
import { assertCompleteAnalysis, normalizeBrandProfile } from "./normalize-brand-profile";
import { extractBrandEvidencePrompt, mergeBrandProfilePrompt } from "./prompt";

const MAX_CHUNK_CHARACTERS = 240_000;
const MAX_PAGE_CHARACTERS = 180_000;
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

function compactPage(page: CollectedPage): CollectedPage {
  const compact: CollectedPage = {
    ...page,
    links: page.links.slice(0, 80),
    images: page.images.slice(0, 80),
  };
  const serialized = serializePage(compact);

  if (serialized.length <= MAX_PAGE_CHARACTERS) {
    return compact;
  }

  const overflow = serialized.length - MAX_PAGE_CHARACTERS;
  const keep = Math.max(20_000, compact.markdown.length - overflow - 1_000);

  return {
    ...compact,
    markdown: compact.markdown.slice(-keep),
  };
}

function createPageChunks(pages: CollectedPage[]): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let currentLength = 0;

  for (const page of pages) {
    const serialized = serializePage(compactPage(page));

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
): Promise<{ profile: BrandProfileData; usage: TokenUsage }> {
  const collected = await collectSite(sourceUrl, context);
  const chunks = createPageChunks(collected.pages);
  const evidence: BrandEvidence[] = [];
  let usage = emptyTokenUsage();

  for (const [index, chunk] of chunks.entries()) {
    const extracted = await parseStructuredOutput(
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
    );
    evidence.push(extracted.output);
    usage = addTokenUsage(usage, extracted.usage);
  }

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
  usage = addTokenUsage(usage, result.usage);

  assertCompleteAnalysis(result.output);
  return {
    profile: normalizeBrandProfile(
      { ...result.output.profile, name: result.output.profile.name ?? "" },
      sourceUrl,
    ),
    usage,
  };
}
