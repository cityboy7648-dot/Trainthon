import type { ErrorCode } from "./errors";

export function showErrorNotice(code: ErrorCode, cause?: string) {
  window.dispatchEvent(new CustomEvent("error-notice", { detail: { code, cause } }));
}
