import { errorCodes, type ErrorCode } from "./errors.ts";
import type { UrlSubmission } from "./types.ts";

const TRACKING_PARAM = /^(utm_|srsltid$|gclid$|fbclid$|_ga$)/i;

export function shouldRedirectPreviewHome(isProduction: boolean, isPreview: boolean): boolean {
  return !isProduction && isPreview;
}

function toHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/\//, "")}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    if (!isSiteHost(url.hostname)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function isSiteHost(hostname: string): boolean {
  const host = hostname.replace(/\.$/, "").toLowerCase();
  if (host === "localhost") {
    return true;
  }
  return host.includes(".") && !host.startsWith(".") && !host.includes("..");
}

function isErrorCode(value: string): value is ErrorCode {
  return errorCodes.some((code) => code === value);
}

export function homeErrorFromSearch(
  error?: string,
  cause?: string,
): { code: ErrorCode; cause?: string } | undefined {
  if (!error || !isErrorCode(error)) {
    return undefined;
  }
  return { code: error, cause: cause || undefined };
}

// 분석은 원문 URL로 하고, 브랜드로 보이는 주소에서만 광고·검색 추적을 뺀다.
export function toBrandSourceUrl(value: string): string {
  try {
    const parsed = new URL(value);
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAM.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return value;
  }
}

export function resolveUrlSubmission(value: string, authenticated: boolean): UrlSubmission {
  if (!authenticated) {
    return { kind: "authenticate" };
  }

  const url = toHttpUrl(value);
  if (!url) {
    return { kind: "invalid" };
  }

  return {
    kind: "navigate",
    href: `/analyzing?url=${encodeURIComponent(url)}`,
  };
}
