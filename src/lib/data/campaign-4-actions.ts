"use server";

import { after } from "next/server";
import { startCampaign4Run } from "@/lib/data/campaign-4";
import { generateCampaign4 } from "@/lib/agents/real-usage/generate-images";
import { AppError } from "@/lib/errors";
import { redirect } from "next/navigation";
import type { Campaign4ActionState } from "@/lib/types";

export async function requestCampaign4Images(
  _previous: Campaign4ActionState,
  formData: FormData,
): Promise<Campaign4ActionState> {
  let runId: string;
  try {
    const index = formData.get("productIndex");
    if (typeof index !== "string" || !/^\d+$/.test(index)) throw new AppError("invalid_request");
    const started = await startCampaign4Run({
      brandId: formData.get("brandId"),
      productIndex: Number(index),
    });
    after(() => generateCampaign4(started));
    runId = started.runId;
  } catch (error) {
    const failure = error instanceof AppError ? error : new AppError("generation_failed");
    return { ok: false, code: failure.code, cause: failure.cause };
  }
  redirect(`/campaigns/${runId}`);
}
