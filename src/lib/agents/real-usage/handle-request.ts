import { after } from "next/server";
import { prepareCampaign4Images } from "@/lib/data/campaign-4-images";
import { generateCampaign4Images } from "./generate-images";
import { AppError, errorMessages } from "@/lib/errors";

export async function handleCampaign4Request(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return Response.json(
        { code: "auth", cause: errorMessages.auth.description },
        { status: 403 },
      );
    }
    let input: unknown;
    try {
      const body = await request.text();
      if (body.length > 4096) throw new AppError("invalid_request");
      input = JSON.parse(body);
    } catch {
      throw new AppError("invalid_request");
    }
    const run = await prepareCampaign4Images(input);
    after(() => generateCampaign4Images(run));
    return Response.json(
      { runId: run.runId, stage: "generating" },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const failure = error instanceof AppError ? error : new AppError("generation_failed");
    const status =
      failure.code === "auth"
        ? 401
        : failure.code === "not_found"
          ? 404
          : failure.code === "invalid_request"
            ? 400
            : 500;
    return Response.json(
      { code: failure.code, cause: failure.cause ?? errorMessages[failure.code].description },
      { status },
    );
  }
}
