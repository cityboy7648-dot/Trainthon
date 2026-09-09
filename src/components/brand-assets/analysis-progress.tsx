"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readAnalyzedBrandProfile, saveAnalyzedBrandProfile } from "@/lib/brand-profile-session";
import { copy } from "@/lib/copy";
import { requestBrandProfile } from "@/lib/data/brand-profile";
import { AppError } from "@/lib/errors";
import { toBrandSourceUrl } from "@/lib/home";
import { showErrorNotice } from "@/lib/error-notice";
import {
  brandProfileSchema,
  type AnalysisProgressProps,
  type BrandProfileData,
  type BrandCompletionQuestion,
} from "@/lib/types";

const pendingByUrl = new Map<
  string,
  Promise<{ profile: BrandProfileData; questions: BrandCompletionQuestion[] }>
>();
const PROGRESS_PACE_MS = 25_000;
const COMPLETE_PAUSE_MS = 400;

function loadBrandProfile(
  url: string,
): Promise<{ profile: BrandProfileData; questions: BrandCompletionQuestion[] }> {
  const pending = pendingByUrl.get(url);
  if (pending) {
    return pending;
  }

  const next = (async () => {
    const result = await requestBrandProfile(url);
    if (!result.ok) {
      throw new AppError("analysis_failed", result.cause);
    }
    return result;
  })();

  pendingByUrl.set(url, next);
  return next.catch((error: unknown) => {
    pendingByUrl.delete(url);
    throw error;
  });
}

function waitingProgress(elapsedMs: number): number {
  return Math.max(4, Math.min(90, Math.floor(90 * (1 - Math.exp(-elapsedMs / PROGRESS_PACE_MS)))));
}

export function AnalysisProgress({ url }: AnalysisProgressProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    const brandUrl = toBrandSourceUrl(url);
    const draftKey = `brand-profile:draft:${brandUrl}`;
    const draft = sessionStorage.getItem(draftKey);
    if (draft) {
      try {
        const profile = brandProfileSchema.parse(JSON.parse(draft));
        saveAnalyzedBrandProfile(brandUrl, profile);
        sessionStorage.removeItem(draftKey);
        router.replace(`/brands?url=${encodeURIComponent(brandUrl)}`);
        return;
      } catch {
        sessionStorage.removeItem(draftKey);
      }
    }
    const cached = readAnalyzedBrandProfile(brandUrl) ?? readAnalyzedBrandProfile(url);
    if (cached) {
      saveAnalyzedBrandProfile(brandUrl, { ...cached, source_url: brandUrl });
      router.replace(`/brands?url=${encodeURIComponent(brandUrl)}`);
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      setProgress(waitingProgress(Date.now() - startedAt));
    }, 200);

    loadBrandProfile(url)
      .then(({ profile }) => {
        if (cancelled) return;
        window.clearInterval(tick);
        saveAnalyzedBrandProfile(profile.source_url, profile);
        setProgress(100);
        window.setTimeout(() => {
          if (!cancelled) {
            router.replace(`/brands?url=${encodeURIComponent(profile.source_url)}`);
          }
        }, COMPLETE_PAUSE_MS);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        window.clearInterval(tick);
        const cause = error instanceof AppError ? error.cause : undefined;
        showErrorNotice("analysis_failed", cause);
        router.replace("/");
      });

    return () => {
      cancelled = true;
      window.clearInterval(tick);
    };
  }, [router, url]);

  return (
    <div
      data-source="server"
      className="font-shell mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-8"
    >
      <p className="text-shell-muted truncate text-xs">{url}</p>
      <h1 className="text-shell-ink mt-3 text-3xl font-semibold tracking-tight">
        {copy.brandAnalysis.loadingTitle}
      </h1>
      <p className="text-shell-muted mt-2 text-sm">{copy.brandAnalysis.loadingDescription}</p>
      <progress
        value={progress}
        max={100}
        aria-label={copy.brandAnalysis.progress}
        className="analysis-progress bg-shell-active mt-8 h-2 w-full"
      />
      <p className="text-shell-ink mt-3 text-sm font-semibold tabular-nums">
        {copy.brandAnalysis.percent(progress)}
      </p>
    </div>
  );
}
