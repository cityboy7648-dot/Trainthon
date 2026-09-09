"use server";

import { after } from "next/server";
import { finishCampaign3Images } from "./campaign-3-images";

import { AppError } from "@/lib/errors";
import {
  getCampaign3Result,
  startCampaign3Run,
  generateCampaign3Asset,
  retryCampaign3Asset,
} from "./campaign-3-images";
import type { Campaign3ActionResult, Campaign3Result } from "@/lib/types";

async function resultOf<T>(operation: () => Promise<T>): Promise<Campaign3ActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    const failure = error instanceof AppError ? error : new AppError("generation_failed");
    return { ok: false, code: failure.code, cause: failure.cause };
  }
}
export async function startDropWeek(input: unknown) {
  return resultOf(async () => {
    const result = await startCampaign3Run(input);
    after(() => finishCampaign3Images(result.runId));
    return result;
  });
}
export async function readDropWeek(runId: string): Promise<Campaign3ActionResult<Campaign3Result>> {
  return resultOf(() => getCampaign3Result(runId));
}
export async function generateDropWeekAsset(runId: string, assetId: string) {
  return resultOf(() => generateCampaign3Asset(runId, assetId));
}
export async function retryDropWeekAsset(runId: string, assetId: string) {
  return resultOf(() => retryCampaign3Asset(runId, assetId));
}
