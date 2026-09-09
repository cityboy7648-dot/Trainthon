import type { UrlSubmission } from "@/lib/types";

const TRACKING_PARAM = /^(utm_|srsltid$|gclid$|fbclid$|_ga$)/i;

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
    if (!url.hostname) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
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
