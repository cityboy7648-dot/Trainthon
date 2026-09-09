import { z } from "zod";
import { getCampaign4Result } from "@/lib/data/campaign-4-images";
import { AppError, campaignErrors } from "@/lib/errors";

export async function campaign4Result(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await context.params;
    if (!z.uuid().safeParse(runId).success) throw new AppError("not_found", campaignErrors.result);
    return Response.json(await getCampaign4Result(runId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const failure =
      error instanceof AppError ? error : new AppError("generation_failed", campaignErrors.result);
    return Response.json(
      { error: { code: failure.code, cause: failure.cause } },
      {
        status: failure.code === "auth" ? 401 : failure.code === "not_found" ? 404 : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
