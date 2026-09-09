"use client";

import { z } from "zod";
import { requestCampaign } from "@/lib/data/campaign-two-client";
import {
  campaignFiveResultSchema,
  type CampaignFiveRequest,
  type CampaignFiveResult,
  type CampaignRequestState,
} from "@/lib/types";

export function submitCampaignFive(input: CampaignFiveRequest) {
  return requestCampaign("/api/campaigns/5/runs", z.object({ run_id: z.uuid() }), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function loadCampaignFiveResult(
  runId: string,
): Promise<CampaignRequestState<CampaignFiveResult>> {
  return requestCampaign(
    `/api/campaigns/5/runs/${encodeURIComponent(runId)}`,
    campaignFiveResultSchema,
  );
}
