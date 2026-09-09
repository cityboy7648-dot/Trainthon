"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { loadCampaignFiveResult } from "@/lib/data/campaign-five-client";
import { CampaignFiveOutputs } from "./campaign-five-outputs";
import { CampaignFiveResultSkeleton } from "./campaign-five-result-skeleton";
import type {
  CampaignFiveResultProps,
  CampaignFiveResult as Result,
  CampaignRequestState,
} from "@/lib/types";

export function CampaignFiveResult({ runId }: CampaignFiveResultProps) {
  const router = useRouter();
  const [state, setState] = useState<CampaignRequestState<Result> | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      const result = await loadCampaignFiveResult(runId);
      if (!active) return;
      setState(result);
      if (result.ok && ["pending", "processing"].includes(result.data.status))
        timer = setTimeout(refresh, 4000);
    }
    void refresh();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [runId, revision]);
  if (!state) return <CampaignFiveResultSkeleton />;
  if (!state.ok)
    return (
      <ErrorState
        code={state.code}
        cause={state.cause}
        onRetry={() => setRevision((value) => value + 1)}
      />
    );
  return (
    <CampaignFiveOutputs
      result={state.data}
      onRetry={() => {
        router.push("/campaigns/new?campaign=complete_set");
      }}
    />
  );
}
