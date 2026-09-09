"use server";

import { analyzeBrand } from "@/lib/agents/brand-analysis/analyze-brand";
import { copy } from "@/lib/copy";
import { getBrandCompletionQuestions } from "@/lib/brand-completion";
import { getSessionUser } from "@/lib/data/session";
import { isPreviewAnalysis } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { toBrandSourceUrl } from "@/lib/home";
import { createSessionReader } from "@/lib/supabase/server";
import { addTokenUsage, tokenUsageFromProfile } from "@/lib/token-usage";
import type { LogContext } from "@/lib/log";
import {
  brandAnalysisRequestSchema,
  brandProfileSchema,
  type BrandProfileData,
  type BrandProfileRequestResult,
  type TokenUsage,
} from "@/lib/types";

export async function getSavedBrandProfile(sourceUrl?: string): Promise<BrandProfileData | null> {
  const supabase = await createSessionReader();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  let query = supabase.from("brands").select("profile").eq("user_id", user.id);
  if (sourceUrl) query = query.eq("source_url", toBrandSourceUrl(sourceUrl));
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new AppError("network", copy.brandAnalysis.loadFailed);
  return data ? brandProfileSchema.parse(data.profile) : null;
}

export async function persistBrandProfile(
  input: BrandProfileData,
  openaiUsage?: TokenUsage,
): Promise<void> {
  const profile = brandProfileSchema.parse(input);
  const supabase = await createSessionReader();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    if (isPreviewAnalysis) return;
    throw new AppError("auth", copy.login.required);
  }
  const sourceUrl = toBrandSourceUrl(profile.source_url);
  const { data: existing, error: readError } = await supabase
    .from("brands")
    .select("id, profile")
    .eq("user_id", user.id)
    .eq("source_url", sourceUrl)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readError) throw new AppError("network", copy.brandAnalysis.saveFailed);
  const previousUsage = tokenUsageFromProfile(existing?.profile);
  // brands 테이블에 meta가 없어서 소유자별 사용량은 profile.usage에 둔다.
  const record = {
    user_id: user.id,
    source_url: sourceUrl,
    profile: {
      ...profile,
      source_url: sourceUrl,
      usage: openaiUsage ? addTokenUsage(previousUsage, openaiUsage) : previousUsage,
    },
  };
  const result = existing
    ? await supabase
        .from("brands")
        .update(record)
        .eq("id", existing.id)
        .eq("user_id", user.id)
        .select("id")
        .single()
    : await supabase.from("brands").insert(record).select("id").single();
  if (result.error) throw new AppError("network", copy.brandAnalysis.saveFailed);
}

export async function saveBrandProfile(
  input: BrandProfileData,
): Promise<BrandProfileRequestResult> {
  try {
    const profile = brandProfileSchema.parse(input);
    await persistBrandProfile(profile);
    return { ok: true, profile, questions: getBrandCompletionQuestions(profile) };
  } catch {
    return { ok: false, cause: copy.brandAnalysis.saveFailed };
  }
}

export async function getBrandProfile(sourceUrl: string): Promise<BrandProfileData> {
  const parsed = brandAnalysisRequestSchema.parse({ url: sourceUrl });
  const user = await getSessionUser();
  if (!user && !isPreviewAnalysis) throw new AppError("auth", copy.login.required);
  const cached = await getSavedBrandProfile(parsed.url);
  if (cached) {
    return cached;
  }

  const context: LogContext = {
    requestId: crypto.randomUUID(),
    runId: null,
    assetId: null,
  };

  const analyzed = await analyzeBrand(parsed.url, context);
  await persistBrandProfile(analyzed.profile, analyzed.usage);
  return analyzed.profile;
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
