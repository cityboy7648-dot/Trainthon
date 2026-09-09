"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { homeErrorFromSearch } from "@/lib/home";
import type { ErrorNoticeData } from "@/lib/types";

export function ErrorNotice() {
  const [notice, setNotice] = useState<ErrorNoticeData>();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const show = (detail: ErrorNoticeData) => {
      clearTimeout(timeout);
      setNotice(detail);
      timeout = setTimeout(() => setNotice(undefined), 7000);
    };
    const onError = (event: Event) => show((event as CustomEvent<ErrorNoticeData>).detail);
    window.addEventListener("error-notice", onError);

    const url = new URL(window.location.href);
    const legacy = homeErrorFromSearch(
      url.searchParams.get("error") ?? undefined,
      url.searchParams.get("cause") ?? undefined,
    );
    const frame = requestAnimationFrame(() => {
      if (legacy) show(legacy);
      if (url.searchParams.has("error") || url.searchParams.has("cause")) {
        url.searchParams.delete("error");
        url.searchParams.delete("cause");
        window.history.replaceState(
          window.history.state,
          "",
          `${url.pathname}${url.search}${url.hash}`,
        );
      }
    });

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
      window.removeEventListener("error-notice", onError);
    };
  }, []);

  if (!notice) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-lg shadow-lg">
      <ErrorState code={notice.code} cause={notice.cause} />
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-1 right-1"
        aria-label={copy.common.dismissError}
        onClick={() => setNotice(undefined)}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
