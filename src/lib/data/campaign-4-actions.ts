"use server";

import { after } from "next/server";
import { prepareCampaign4Images } from "@/lib/data/campaign-4-images";
import { generateCampaign4Images } from "@/lib/agents/real-usage/generate-images";
import { AppError } from "@/lib/errors";
import type { Campaign4ActionState } from "@/lib/types";

export async function requestCampaign4Images(
  _previous: Campaign4ActionState,
  formData: FormData,
): Promise<Campaign4ActionState> {
  try {
    const index = formData.get("productIndex");
    if (typeof index !== "string" || !/^\d+$/.test(index)) throw new AppError("invalid_request");
    const run = await prepareCampaign4Images({
      brandId: formData.get("brandId"),
      productIndex: Number(index),
    });
    after(() => generateCampaign4Images(run));
    return { ok: true, runId: run.runId };
  } catch (error) {
    const failure = error instanceof AppError ? error : new AppError("generation_failed");
    return { ok: false, code: failure.code, cause: failure.cause };
  }
}
