"use server";

import { analyzeBrand } from "@/lib/agents/brand-analysis/analyze-brand";
import { copy } from "@/lib/copy";
import { getBrandCompletionQuestions } from "@/lib/brand-completion";
import { getSessionUser } from "@/lib/data/session";
import { isPreviewAnalysis } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { toBrandSourceUrl } from "@/lib/home";
import type { LogContext } from "@/lib/log";
import {
  brandAnalysisRequestSchema,
  type BrandProfileData,
  type BrandProfileRequestResult,
} from "@/lib/types";

// 데모 서버 프로세스 안에서만 같은 URL 재수집을 막는다.
const profilesByUrl = new Map<string, BrandProfileData>();
const inflightByUrl = new Map<string, Promise<BrandProfileData>>();

export async function getBrandProfile(sourceUrl: string): Promise<BrandProfileData> {
  const key = toBrandSourceUrl(sourceUrl);
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
  const user = await getSessionUser();
  if (!user && !isPreviewAnalysis) {
    return { ok: false, cause: copy.login.required };
  }

  const parsed = brandAnalysisRequestSchema.safeParse({ url: sourceUrl });
  if (!parsed.success) {
    return { ok: false, cause: copy.brandAnalysis.invalidUrl };
  }

  try {
    const profile = await getBrandProfile(parsed.data.url);
    return { ok: true, profile, questions: getBrandCompletionQuestions(profile) };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, cause: error.cause };
    }

    return { ok: false, cause: copy.brandAnalysis.unexpected };
  }
}
