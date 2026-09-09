"use server";

import { analyzeBrand } from "@/lib/agents/brand-analysis/analyze-brand";
import { copy } from "@/lib/copy";
import { AppError } from "@/lib/errors";
import type { LogContext } from "@/lib/log";
import {
  brandAnalysisRequestSchema,
  type BrandProfileData,
  type BrandProfileRequestResult,
} from "@/lib/types";

const TRACKING_PARAM = /^(utm_|srsltid$|gclid$|fbclid$|_ga$)/i;
// 데모 서버 프로세스 안에서만 같은 URL 재수집을 막는다.
const profilesByUrl = new Map<string, BrandProfileData>();
const inflightByUrl = new Map<string, Promise<BrandProfileData>>();

function analysisCacheKey(url: string): string {
  const parsed = new URL(url);
  for (const key of [...parsed.searchParams.keys()]) {
    if (TRACKING_PARAM.test(key)) {
      parsed.searchParams.delete(key);
    }
  }
  parsed.hash = "";
  return parsed.toString();
}

export async function getBrandProfile(sourceUrl: string): Promise<BrandProfileData> {
  const key = analysisCacheKey(sourceUrl);
  const cached = profilesByUrl.get(key);
  if (cached) {
    return cached;
  }

  const inflight = inflightByUrl.get(key);
  if (inflight) {
    return inflight;
  }

  const context: LogContext = {
    requestId: crypto.randomUUID(),
    runId: null,
    assetId: null,
  };

  const pending = analyzeBrand(sourceUrl, context).then((profile) => {
    profilesByUrl.set(key, profile);
    return profile;
  });

  inflightByUrl.set(key, pending);

  try {
    return await pending;
  } finally {
    inflightByUrl.delete(key);
  }
}

export async function requestBrandProfile(sourceUrl: string): Promise<BrandProfileRequestResult> {
  const parsed = brandAnalysisRequestSchema.safeParse({ url: sourceUrl });
  if (!parsed.success) {
    return { ok: false, cause: copy.brandAnalysis.invalidUrl };
  }

  try {
    return { ok: true, profile: await getBrandProfile(parsed.data.url) };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, cause: error.cause };
    }

    return { ok: false, cause: copy.brandAnalysis.unexpected };
  }
}
