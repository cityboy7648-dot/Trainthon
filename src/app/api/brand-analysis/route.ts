import { copy } from "@/lib/copy";
import { getBrandProfile } from "@/lib/data/brand-profile";
import { getSessionUser } from "@/lib/data/session";
import { isPreviewAnalysis } from "@/lib/env";
import { AppError, type ErrorCode } from "@/lib/errors";
import { log, type LogContext } from "@/lib/log";
import { brandAnalysisRequestSchema } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_REQUEST_CHARACTERS = 4_096;

function errorResponse(status: number, cause: string, code: ErrorCode = "analysis_failed") {
  return Response.json(
    {
      error: {
        code,
        cause,
      },
    },
    { status },
  );
}

export async function POST(request: Request) {
  const context: LogContext = {
    requestId: crypto.randomUUID(),
    runId: null,
    assetId: null,
  };

  const user = await getSessionUser();
  if (!user && !isPreviewAnalysis) {
    return errorResponse(401, copy.login.required, "auth");
  }

  const body = await request.text();

  if (body.length > MAX_REQUEST_CHARACTERS) {
    return errorResponse(400, "요청 본문이 너무 크다.");
  }

  let input: unknown;

  try {
    input = JSON.parse(body);
  } catch {
    return errorResponse(400, "JSON 요청 본문이 올바르지 않다.");
  }

  const parsed = brandAnalysisRequestSchema.safeParse(input);

  if (!parsed.success) {
    return errorResponse(400, "유효한 HTTP(S) 사이트 URL을 입력해라.");
  }

  try {
    const profile = await getBrandProfile(parsed.data.url);
    return Response.json({ profile });
  } catch (error) {
    if (error instanceof AppError) {
      log.error("brand_analysis.failed", context, {
        code: error.code,
        cause: error.cause,
      });
      return errorResponse(422, error.cause ?? "사이트 분석에 실패했다.");
    }

    log.error("brand_analysis.failed", context, {
      code: "analysis_failed",
      cause: "unexpected",
    });
    return errorResponse(500, "사이트 분석 중 예상하지 못한 오류가 발생했다.");
  }
}
