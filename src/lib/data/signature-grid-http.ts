import { after } from "next/server";
import { z } from "zod";
import { createSavedCampaign } from "@/lib/data/campaign-workspace";
import { getSignatureGridResult } from "@/lib/data/signature-grid";
import { generateSignatureGrid } from "@/lib/agents/signature-grid/generate";
import { AppError, campaignErrors } from "@/lib/errors";
import { signatureGridRequestSchema } from "@/lib/types";

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

export async function startCampaignOne(request: Request) {
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
    const parsed = signatureGridRequestSchema.safeParse(JSON.parse(text));
    if (!parsed.success) throw new AppError("generation_failed", campaignErrors.request);
    const runId = await createSavedCampaign({
      requestId: crypto.randomUUID(),
      key: "signature_grid",
      brandId: parsed.data.brand_id,
    });
    after(() => generateSignatureGrid(runId));
    return Response.json(
      { run_id: runId, campaign_key: "signature_grid", status: "pending" },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}

export async function campaignOneResult(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await context.params;
    if (!z.uuid().safeParse(runId).success) throw new AppError("not_found", campaignErrors.result);
    return Response.json(await getSignatureGridResult(runId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
