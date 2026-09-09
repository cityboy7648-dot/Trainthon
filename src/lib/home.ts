import type { UrlSubmission } from "@/lib/types";

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
