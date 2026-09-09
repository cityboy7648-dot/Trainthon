"use client";

import { requestCampaign } from "@/lib/data/campaign-two-client";
import { campaign4ResultSchema } from "@/lib/types";

export function loadCampaign4Result(runId: string) {
  return requestCampaign(
    `/api/campaigns/4/runs/${encodeURIComponent(runId)}`,
    campaign4ResultSchema,
  );
}
