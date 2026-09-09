"use client";

import { useEffect, useState, useTransition } from "react";
import { CampaignWorkspace } from "./campaign-workspace";
import { refreshSavedCampaign } from "@/lib/data/campaign-workspace-actions";
import { campaignProgress } from "@/lib/campaign-workspace";
import { showErrorNotice } from "@/lib/error-notice";
import type { SavedCampaign } from "@/lib/types";

export function CampaignWorkspaceLive({ campaign: initial }: { campaign: SavedCampaign }) {
  const [snapshot, setSnapshot] = useState({ initial, campaign: initial });
  const [, startRetry] = useTransition();
  if (snapshot.initial !== initial) setSnapshot({ initial, campaign: initial });
  const campaign = snapshot.initial === initial ? snapshot.campaign : initial;
  const active = campaignProgress(campaign.posts).active;
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let notified = false;
    async function refresh() {
      try {
        const result = await refreshSavedCampaign(initial.id);
        if (cancelled) return;
        if (result.ok) {
          setSnapshot({ initial, campaign: result.data });
          notified = false;
          if (!campaignProgress(result.data.posts).active) return;
        } else if (!notified) {
          showErrorNotice(result.code, result.cause);
          notified = true;
        }
      } catch {
        if (!cancelled && !notified) {
          showErrorNotice("network");
          notified = true;
        }
      }
      if (!cancelled) timer = setTimeout(refresh, 4000);
    }
    timer = setTimeout(refresh, 4000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [initial, active]);
  return (
    <CampaignWorkspace
      campaign={campaign}
      onRetryAsset={(assetId) => {
        startRetry(async () => {
          const { retryFailedCampaignAsset } = await import("@/lib/data/campaign-retry-actions");
          const result = await retryFailedCampaignAsset(initial.id, assetId);
          if (!result.ok) {
            showErrorNotice(result.code, result.cause);
            return;
          }
          const latest = await refreshSavedCampaign(initial.id);
          if (latest.ok) setSnapshot({ initial, campaign: latest.data });
          else showErrorNotice(latest.code, latest.cause);
        });
      }}
    />
  );
}
