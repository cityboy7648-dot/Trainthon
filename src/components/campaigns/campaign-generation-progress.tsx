"use client";

import { useEffect, useState } from "react";
import { campaignProgress } from "@/lib/campaign-workspace";
import { copy } from "@/lib/copy";
import type { SavedCampaign } from "@/lib/types";

export function CampaignGenerationProgress({ campaign }: { campaign: SavedCampaign }) {
  const progress = campaignProgress(campaign.posts);
  const [wasActive] = useState(progress.active);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (progress.active || progress.percent !== 100 || !wasActive) return;
    // 완료 안내만 잠시 유지한다. 진행률은 서버 상태로 계산한다.
    const timer = setTimeout(() => setDismissed(true), 1500);
    return () => clearTimeout(timer);
  }, [progress.active, progress.percent, wasActive]);
  if (dismissed || (!progress.active && !progress.failed && !wasActive)) return null;
  const c = copy.campaignWorkspace;
  return (
    <section
      className="bg-shell-background rounded-shell mb-5 shrink-0 px-4 py-3"
      aria-live="polite"
    >
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">
          {progress.percent === 100
            ? c.generated
            : !progress.active && progress.failed
              ? c.status.failed
              : c.generating}
        </span>
        <span className="text-shell-muted">
          {c.generationCount(progress.done, progress.total)} · {progress.percent}%
        </span>
      </div>
      <progress
        className="campaign-generation-progress block h-1.5 w-full overflow-hidden rounded-full"
        value={progress.done}
        max={progress.total || 1}
        aria-label={c.generating}
      />
      {progress.failed > 0 && (
        <p className="text-destructive mt-2 text-xs">{c.generationFailures(progress.failed)}</p>
      )}
    </section>
  );
}
