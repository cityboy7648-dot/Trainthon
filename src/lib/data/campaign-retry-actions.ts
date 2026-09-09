"use server";

import { after } from "next/server";
import { z } from "zod";
import { executeCampaignRetry, prepareCampaignRetry } from "@/lib/data/campaign-retry";
import { AppError } from "@/lib/errors";
import type { CampaignRequestState } from "@/lib/types";

function failure(error: unknown): CampaignRequestState<null> {
  return error instanceof AppError
    ? { ok: false, code: error.code, cause: error.cause }
    : { ok: false, code: "network" };
}

async function queueRetry(runId: string, assetId?: string): Promise<CampaignRequestState<null>> {
  try {
    z.uuid().parse(runId);
    if (assetId) z.uuid().parse(assetId);
    const job = await prepareCampaignRetry(runId, assetId);
    after(() => executeCampaignRetry(job));
    return { ok: true, data: null };
  } catch (error) {
    return failure(error);
  }
}

export async function retryFailedCampaign(runId: string) {
  return queueRetry(runId);
}

export async function retryFailedCampaignAsset(runId: string, assetId: string) {
  return queueRetry(runId, assetId);
}
