import { after } from "next/server";
import { z } from "zod";
import { generateCampaignFive } from "@/lib/agents/complete-set/generate";
import { createCampaignFiveRun, getCampaignFiveResult } from "@/lib/data/campaign-five";
import { AppError, campaignErrors } from "@/lib/errors";
import { campaignFiveRequestSchema } from "@/lib/types";

function failure(error: unknown) {
  const known =
    error instanceof AppError ? error : new AppError("generation_failed", campaignErrors.request);
  return Response.json(
    { error: { code: known.code, cause: known.cause } },
    {
      status: known.code === "auth" ? 401 : known.code === "not_found" ? 404 : 422,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function startCampaignFive(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return Response.json(
        { error: { code: "auth", cause: campaignErrors.origin } },
        { status: 403 },
      );
    }
    const text = await request.text();
    if (text.length > 4096) throw new AppError("generation_failed", campaignErrors.request);
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      throw new AppError("generation_failed", campaignErrors.request);
    }
    const parsed = campaignFiveRequestSchema.safeParse(value);
    if (!parsed.success) throw new AppError("generation_failed", campaignErrors.request);
    const run = await createCampaignFiveRun(parsed.data);
    after(() => generateCampaignFive(run, crypto.randomUUID()));
    return Response.json(
      { run_id: run.runId },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}

export async function campaignFiveResult(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await context.params;
    if (!z.uuid().safeParse(runId).success) throw new AppError("not_found", campaignErrors.result);
    return Response.json(await getCampaignFiveResult(runId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
