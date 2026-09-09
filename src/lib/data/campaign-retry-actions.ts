"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { executeCampaignRetry, prepareCampaignRetry } from "@/lib/data/campaign-retry";
import { AppError } from "@/lib/errors";
import type { CampaignRequestState } from "@/lib/types";

function failure(error: unknown): CampaignRequestState<null> {
  return error instanceof AppError
    ? { ok: false, code: error.code, cause: error.cause }
    : { ok: false, code: "network" };
}

export async function retryFailedCampaign(runId: string): Promise<CampaignRequestState<null>> {
  try {
    z.uuid().parse(runId);
    const job = await prepareCampaignRetry(runId);
    after(() => executeCampaignRetry(job));
    revalidatePath(`/campaigns/${runId}`);
    revalidatePath("/campaigns");
    return { ok: true, data: null };
  } catch (error) {
    return failure(error);
  }
}
