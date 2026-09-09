"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { saveAnalyzedBrandProfile, readAnalyzedBrandProfile } from "@/lib/brand-profile-session";
import { copy } from "@/lib/copy";
import { requestBrandProfile } from "@/lib/data/brand-profile";
import { isPreviewAnalysis } from "@/lib/env";
import { AppError } from "@/lib/errors";
import type { AnalysisProgressProps, BrandProfileData } from "@/lib/types";
import { getMockBrandProfile } from "@/mock/brand-profile"; // MOCK

const pendingByUrl = new Map<string, Promise<BrandProfileData>>();
const PROGRESS_PACE_MS = isPreviewAnalysis ? 25_000 : 400;
const COMPLETE_PAUSE_MS = 400;

function loadBrandProfile(url: string): Promise<BrandProfileData> {
  const pending = pendingByUrl.get(url);
  if (pending) {
    return pending;
  }

  const next = (async () => {
    if (!isPreviewAnalysis) {
      return getMockBrandProfile(url);
    }

    const result = await requestBrandProfile(url);
    if (!result.ok) {
      throw new AppError("analysis_failed", result.cause);
    }
    return result.profile;
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
  const [cause, setCause] = useState<string>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (readAnalyzedBrandProfile(url)) {
      router.replace(`/brands?url=${encodeURIComponent(url)}`);
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      setProgress(waitingProgress(Date.now() - startedAt));
    }, 200);

    loadBrandProfile(url)
      .then((profile) => {
        if (cancelled) return;
        window.clearInterval(tick);
        saveAnalyzedBrandProfile(url, profile);
        setProgress(100);
        window.setTimeout(() => {
          if (!cancelled) {
            router.replace(`/brands?url=${encodeURIComponent(url)}`);
          }
        }, COMPLETE_PAUSE_MS);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        window.clearInterval(tick);
        setFailed(true);
        setCause(error instanceof AppError ? error.cause : undefined);
      });

    return () => {
      cancelled = true;
      window.clearInterval(tick);
    };
  }, [attempt, router, url]);

  return (
    <div
      data-source={isPreviewAnalysis ? "server" : "mock"}
      className="font-shell mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-8"
    >
      <p className="text-shell-muted truncate text-xs">{url}</p>
      <h1 className="text-shell-ink mt-3 text-3xl font-semibold tracking-tight">
        {copy.brandAnalysis.loadingTitle}
      </h1>
      <p className="text-shell-muted mt-2 text-sm">{copy.brandAnalysis.loadingDescription}</p>
      {failed ? (
        <div className="mt-8">
          <ErrorState
            code="analysis_failed"
            cause={cause}
            onRetry={() => {
              setFailed(false);
              setCause(undefined);
              setProgress(4);
              setAttempt((current) => current + 1);
            }}
          />
        </div>
      ) : (
        <>
          <progress
            value={progress}
            max={100}
            aria-label={copy.brandAnalysis.progress}
            className="analysis-progress bg-shell-active mt-8 h-2 w-full"
          />
          <p className="text-shell-ink mt-3 text-sm font-semibold tabular-nums">
            {copy.brandAnalysis.percent(progress)}
          </p>
        </>
      )}
    </div>
  );
}
