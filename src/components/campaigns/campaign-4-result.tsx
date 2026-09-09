"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Campaign4ResultSkeleton } from "./campaign-4-result-skeleton";
import { loadCampaign4Result } from "@/lib/data/campaign-4-client";
import { copy } from "@/lib/copy";
import { campaignErrors } from "@/lib/errors";
import type { Campaign4ResultProps, Campaign4ResultData, CampaignRequestState } from "@/lib/types";

export function Campaign4Result({ runId }: Campaign4ResultProps) {
  const [state, setState] = useState<CampaignRequestState<Campaign4ResultData> | null>(null);
  const [revision, setRevision] = useState(0);
  const pathname = usePathname();
  const params = useSearchParams();
  const text = copy.campaigns.realUsage;
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      const result = await loadCampaign4Result(runId);
      if (!active) return;
      setState(result);
      if (
        result.ok &&
        result.data.assets.length > 0 &&
        ["pending", "processing"].includes(result.data.status)
      ) {
        timer = setTimeout(refresh, 4000);
      }
    }
    void refresh();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [runId, revision]);

  function startAgain() {
    const next = new URLSearchParams(params.toString());
    next.delete("run");
    window.history.replaceState(null, "", `${pathname}?${next}`);
  }

  if (!state) return <Campaign4ResultSkeleton />;
  if (!state.ok)
    return (
      <div className="mt-8">
        <ErrorState
          code={state.code}
          cause={state.cause}
          onRetry={() => setRevision((value) => value + 1)}
        />
      </div>
    );
  const result = state.data;
  if (!result.assets.length)
    return (
      <div data-source="server" className="mt-8 space-y-4">
        {result.status === "failed" ? (
          <ErrorState code="generation_failed" cause={result.cause ?? undefined} />
        ) : (
          <EmptyState title={text.legacyPlan} />
        )}
        <Button onClick={startAgain}>{text.retry}</Button>
      </div>
    );
  const completed = result.assets.filter((asset) => asset.status === "done").length;
  return (
    <section data-source="server" className="mt-8 space-y-6">
      <div aria-live="polite">
        <h2 className="text-xl font-semibold">
          {result.status === "done"
            ? text.ready
            : result.status === "failed"
              ? copy.campaignTwo.failed
              : text.generating}
        </h2>
        <p className="text-shell-muted mt-2 text-sm">{copy.campaignTwo.progress(completed, 5)}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {result.assets.map((asset) => (
          <div key={asset.id} className="space-y-3">
            <h3 className="text-sm font-medium">
              {copy.campaigns.day(asset.meta.day)} · {asset.meta.scene}
            </h3>
            <div className="aspect-campaign-feed bg-shell-background relative overflow-hidden rounded-xl">
              {asset.imageUrl ? (
                <Image
                  src={asset.imageUrl}
                  alt={asset.meta.scene}
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : asset.status === "done" ? (
                <ErrorState
                  code="network"
                  cause={campaignErrors.result}
                  onRetry={() => setRevision((value) => value + 1)}
                />
              ) : asset.status === "failed" ? (
                <ErrorState
                  code="generation_failed"
                  cause={asset.meta.error ?? undefined}
                  onRetry={startAgain}
                />
              ) : (
                <Skeleton className="size-full" />
              )}
            </div>
            <p className="text-shell-ink text-sm leading-6 whitespace-pre-wrap">
              {asset.meta.caption}
            </p>
          </div>
        ))}
      </div>
      {result.status === "failed" && (
        <Button variant="outline" onClick={startAgain}>
          {text.retry}
        </Button>
      )}
    </section>
  );
}
