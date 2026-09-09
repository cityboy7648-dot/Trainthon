"use client";

import { z } from "zod";
import { campaignErrors, errorCodes } from "@/lib/errors";
import {
  campaignProductsSchema,
  type CampaignRequestState,
  type CampaignProducts,
  type CampaignTwoRequest,
} from "@/lib/types";

export async function requestCampaign<T>(
  url: string,
  schema: z.ZodType<T>,
  options?: RequestInit,
): Promise<CampaignRequestState<T>> {
  try {
    const response = await fetch(url, { ...options, cache: "no-store" });
    const value: unknown = await response.json();
    if (!response.ok) {
      const parsed = z
        .object({ error: z.object({ code: z.enum(errorCodes), cause: z.string().optional() }) })
        .safeParse(value);
      return {
        ok: false,
        ...(parsed.success
          ? parsed.data.error
          : { code: "generation_failed" as const, cause: campaignErrors.result }),
      };
    }
    return { ok: true, data: schema.parse(value) };
  } catch {
    return { ok: false, code: "network", cause: campaignErrors.result };
  }
}

export function loadCampaignProducts(
  sourceUrl?: string,
): Promise<CampaignRequestState<CampaignProducts>> {
  const query = sourceUrl ? `?source_url=${encodeURIComponent(sourceUrl)}` : "";
  return requestCampaign(`/api/campaigns/2/products${query}`, campaignProductsSchema);
}

export function submitCampaignTwo(input: CampaignTwoRequest) {
  return requestCampaign("/api/campaigns/2/runs", z.object({ run_id: z.uuid() }), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
