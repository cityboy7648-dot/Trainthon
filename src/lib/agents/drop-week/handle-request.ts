import { after } from "next/server";
import { startCampaign3Run, finishCampaign3Images } from "@/lib/data/campaign-3-images";
import { AppError, errorMessages } from "@/lib/errors";

export async function handleCampaign3Request(request: Request) {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return Response.json({ code: "auth", cause: errorMessages.auth.description }, { status: 403 });
  }
  try {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      throw new AppError("invalid_request");
    }
    const result = await startCampaign3Run(input);
    after(() => finishCampaign3Images(result.runId));
    return Response.json(result, { status: 201 });
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
