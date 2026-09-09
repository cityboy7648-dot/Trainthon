"use server";

import { createCampaign4Plan } from "@/lib/data/campaign-4";
import { AppError } from "@/lib/errors";
import { redirect } from "next/navigation";
import type { Campaign4ActionState } from "@/lib/types";

export async function requestCampaign4Plan(
  _previous: Campaign4ActionState,
  formData: FormData,
): Promise<Campaign4ActionState> {
  let runId: string;
  try {
    const index = formData.get("productIndex");
    if (typeof index !== "string" || !/^\d+$/.test(index)) throw new AppError("invalid_request");
    const result = await createCampaign4Plan({
      brandId: formData.get("brandId"),
      productIndex: Number(index),
    });
    runId = result.runId;
  } catch (error) {
    const failure = error instanceof AppError ? error : new AppError("generation_failed");
    return { ok: false, code: failure.code, cause: failure.cause };
  }
  redirect(`/campaigns/${runId}`);
}
