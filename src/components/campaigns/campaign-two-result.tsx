"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { usePathname, useSearchParams } from "next/navigation";
import { CampaignTwoResultSkeleton } from "./campaign-two-result-skeleton";
import { loadCampaignTwoResult } from "@/lib/data/campaign-two-client";
import { copy } from "@/lib/copy";
import type {
  CampaignTwoResultProps,
  CampaignRequestState,
  CampaignTwoResult as Result,
} from "@/lib/types";

export function CampaignTwoResult({ runId }: CampaignTwoResultProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [state, setState] = useState<CampaignRequestState<Result> | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      const result = await loadCampaignTwoResult(runId);
      if (!active) return;
      setState(result);
      if (result.ok && ["pending", "processing"].includes(result.data.status)) {
        timer = setTimeout(refresh, 4000);
      }
    }
    void refresh();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [runId, revision]);
  if (!state) return <CampaignTwoResultSkeleton />;
  if (!state.ok)
    return (
      <ErrorState
        code={state.code}
        cause={state.cause}
        onRetry={() => setRevision((value) => value + 1)}
      />
    );
  const result = state.data;
  const completed = result.assets.filter((asset) => asset.status === "done").length;
  return (
    <section data-source="server" className="mt-8 space-y-6">
      <div aria-live="polite">
        <h2 className="text-xl font-semibold">
          {result.status === "done"
            ? copy.campaignTwo.complete
            : result.status === "failed"
              ? copy.campaignTwo.failed
              : copy.campaignTwo.generating}
        </h2>
        <p className="text-shell-muted mt-2 text-sm">
          {copy.campaignTwo.progress(completed, result.assets.length)}
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {result.assets.map((asset) => (
          <div key={asset.id} className="space-y-3">
            <p className="text-shell-muted text-sm">
              {copy.campaignTwo.position(asset.meta.day, asset.meta.format)}
            </p>
            <div
              data-story={asset.meta.format === "story"}
              className="aspect-campaign-feed data-[story=true]:aspect-campaign-story relative overflow-hidden rounded-xl"
            >
              {asset.image_url ? (
                <Image
                  src={asset.image_url}
                  alt={copy.campaignTwo.imageAlt(asset.meta.product.name)}
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : asset.status === "failed" ? (
                <ErrorState code="generation_failed" cause={asset.meta.error ?? undefined} />
              ) : (
                <Skeleton className="h-full w-full" />
              )}
            </div>
            {asset.meta.caption && (
              <p className="text-shell-ink text-sm leading-6 whitespace-pre-wrap">
                {asset.meta.caption}
              </p>
            )}
          </div>
        ))}
      </div>
      {result.status === "failed" && (
        <Button
          variant="outline"
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            next.delete("run");
            window.history.replaceState(null, "", `${pathname}?${next}`);
          }}
        >
          {copy.campaignTwo.retry}
        </Button>
      )}
    </section>
  );
}
