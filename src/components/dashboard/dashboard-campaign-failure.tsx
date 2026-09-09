"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import type { DashboardCampaignFailureProps } from "@/lib/types";
import type { ErrorCode } from "@/lib/errors";

const GENERATABLE = new Set(["real_usage", "one_product_three_scenes", "complete_set"]);

export function DashboardCampaignFailure({
  runId,
  campaignKey,
  href,
}: DashboardCampaignFailureProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failure, setFailure] = useState<{ code: ErrorCode; cause?: string }>();

  return (
    <ErrorState
      code={failure?.code ?? "generation_failed"}
      cause={failure?.cause}
      onRetry={() => {
        if (pending) return;
        startTransition(async () => {
          if (GENERATABLE.has(campaignKey)) {
            const { retryFailedCampaign } = await import("@/lib/data/campaign-retry-actions");
            const result = await retryFailedCampaign(runId);
            if (!result.ok) {
              setFailure(result);
              return;
            }
          }
          setFailure(undefined);
          if (href) router.push(href);
          else router.refresh();
        });
      }}
    />
  );
}
