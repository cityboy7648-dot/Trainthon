"use server";

import { createCampaign4Plan } from "@/lib/data/campaign-4";
import { AppError } from "@/lib/errors";
import type { Campaign4ActionState } from "@/lib/types";

export async function requestCampaign4Plan(
  _previous: Campaign4ActionState,
  formData: FormData,
): Promise<Campaign4ActionState> {
  try {
    const index = formData.get("productIndex");
    if (typeof index !== "string" || !/^\d+$/.test(index)) throw new AppError("invalid_request");
    const result = await createCampaign4Plan({
      brandId: formData.get("brandId"),
      productIndex: Number(index),
    });
    return { ok: true, runId: result.runId, product: result.product, plan: result.plan };
  } catch (error) {
    const failure = error instanceof AppError ? error : new AppError("generation_failed");
    return { ok: false, code: failure.code, cause: failure.cause };
  }
}
