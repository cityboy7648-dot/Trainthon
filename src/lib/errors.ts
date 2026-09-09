export const errorCodes = [
  "network",
  "auth",
  "analysis_failed",
  "generation_failed",
  "not_found",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export const errorMessages: Record<ErrorCode, { title: string; description: string }> = {
  network: {
    title: "연결에 실패했다",
    description: "네트워크 상태를 확인하고 다시 시도해라.",
  },
  auth: {
    title: "로그인이 필요하다",
    description: "세션이 만료됐거나 권한이 없다.",
  },
  analysis_failed: {
    title: "사이트 분석에 실패했다",
    description: "URL이 맞는지, 사이트가 열리는지 확인해라.",
  },
  generation_failed: {
    title: "생성에 실패했다",
    description: "잠시 뒤 다시 시도해라. 반복되면 다른 레퍼런스를 골라 봐라.",
  },
  not_found: {
    title: "찾을 수 없다",
    description: "삭제됐거나 주소가 잘못됐다.",
  },
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly cause?: string;

  constructor(code: ErrorCode, cause?: string) {
    super(errorMessages[code].title);
    this.code = code;
    this.cause = cause;
  }
}
