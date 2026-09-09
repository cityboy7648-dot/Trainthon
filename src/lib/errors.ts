export const errorCodes = [
  "network",
  "auth",
  "sign_up_failed",
  "invalid_url",
  "analysis_failed",
  "analysis_partial",
  "generation_failed",
  "not_found",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export const errorMessages: Record<ErrorCode, { title: string; description: string }> = {
  network: {
    title: "연결하지 못했어요",
    description: "네트워크 상태를 확인하고 다시 시도해 주세요.",
  },
  auth: {
    title: "로그인하지 못했어요",
    description: "이메일과 비밀번호가 맞는지 확인해 주세요.",
  },
  sign_up_failed: {
    title: "회원가입하지 못했어요",
    description: "입력한 내용을 확인해 주세요.",
  },
  invalid_url: {
    title: "사이트 주소가 아니에요",
    description: "https://example.com 처럼 보이는 주소를 입력해 주세요.",
  },
  analysis_failed: {
    title: "사이트를 분석하지 못했어요",
    description: "URL이 맞는지, 사이트가 열리는지 확인해 주세요.",
  },
  analysis_partial: {
    title: "이 항목을 확인하지 못했어요",
    description: "사이트에서 해당 정보를 찾지 못했어요.",
  },
  generation_failed: {
    title: "생성하지 못했어요",
    description: "잠시 뒤 다시 시도해 주세요. 반복되면 다른 레퍼런스를 골라 주세요.",
  },
  not_found: {
    title: "찾을 수 없어요",
    description: "삭제됐거나 주소가 잘못됐어요.",
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

export const campaignErrors = {
  login: "캠페인을 만들려면 로그인해 주세요.",
  brand: "저장된 브랜드를 찾지 못했어요.",
  products: "상품 목록을 불러오지 못했어요.",
  staleProduct: "상품 정보가 바뀌었어요. 목록을 새로 불러온 뒤 다시 선택해 주세요.",
  productImage: "상품 이미지가 없어 같은 상품을 유지하며 생성할 수 없어요.",
  create: "캠페인을 시작하지 못했어요.",
  rateLimited: "최근에 캠페인을 시작했어요. 1분 뒤 다시 시도해 주세요.",
  result: "캠페인 결과를 불러오지 못했어요.",
  save: "캠페인 결과를 저장하지 못했어요.",
  plan: "AI가 캠페인 구성을 완료하지 못했어요.",
  image: "AI가 이미지를 생성하지 못했어요.",
  timeout: "생성 제한 시간을 초과했어요. 새 캠페인으로 다시 시도해 주세요.",
  request: "요청 형식이 올바르지 않아요.",
  origin: "현재 사이트에서 다시 시도해 주세요.",
};
