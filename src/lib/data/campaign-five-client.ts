"use client";

import { z } from "zod";
import { requestCampaign } from "@/lib/data/campaign-two-client";
import type { CampaignFiveRequest } from "@/lib/types";

export function submitCampaignFive(input: CampaignFiveRequest) {
  return requestCampaign("/api/campaigns/5/runs", z.object({ run_id: z.uuid() }), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
