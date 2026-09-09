import { after } from "next/server";
import { z } from "zod";
import {
  createCampaignTwoRun,
  getCampaignProducts,
  getCampaignTwoResult,
} from "@/lib/data/campaign-two";
import { generateCampaignTwo } from "@/lib/agents/one-product-three-scenes/generate";
import { AppError, campaignErrors } from "@/lib/errors";
import { campaignTwoRequestSchema } from "@/lib/types";
import { toBrandSourceUrl } from "@/lib/home";

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

export async function campaignTwoProducts(request: Request) {
  try {
    const source = new URL(request.url).searchParams.get("source_url");
    if (source && !z.url().safeParse(source).success)
      throw new AppError("generation_failed", campaignErrors.request);
    return Response.json(await getCampaignProducts(source ? toBrandSourceUrl(source) : undefined), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function startCampaignTwo(request: Request) {
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
    const parsed = campaignTwoRequestSchema.safeParse(JSON.parse(text));
    if (!parsed.success) throw new AppError("generation_failed", campaignErrors.request);
    const run = await createCampaignTwoRun(parsed.data);
    after(() => generateCampaignTwo(run, crypto.randomUUID()));
    return Response.json(
      { run_id: run.runId },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}

export async function campaignTwoResult(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await context.params;
    if (!z.uuid().safeParse(runId).success) throw new AppError("not_found", campaignErrors.result);
    return Response.json(await getCampaignTwoResult(runId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
