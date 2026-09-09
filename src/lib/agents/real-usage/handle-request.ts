import { createCampaign4Plan } from "@/lib/data/campaign-4";
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
      input = await request.json();
    } catch {
      throw new AppError("invalid_request");
    }
    return Response.json(await createCampaign4Plan(input), { status: 201 });
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
