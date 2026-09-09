"use client";

import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { errorMessages, type ErrorCode } from "@/lib/errors";

type ErrorStateProps = {
  code: ErrorCode;
  cause?: string;
  onRetry?: () => void;
};

export function ErrorState({ code, cause, onRetry }: ErrorStateProps) {
  const message = errorMessages[code];
  return (
    <div
      role="alert"
      className="font-shell border-shell-border bg-shell-background rounded-shell flex flex-col gap-1 border px-3.5 py-3"
    >
      <p className="text-destructive text-shell-nav font-semibold">{message.title}</p>
      <p className="text-shell-muted text-shell-nav">{message.description}</p>
      {cause && <p className="text-shell-icon text-shell-caption">{cause}</p>}
      {onRetry && (
        <Button
          onClick={onRetry}
          className="border-shell-border text-shell-ink hover:bg-shell-hover h-shell-control rounded-shell mt-2 self-start border bg-transparent px-3 text-xs font-medium shadow-none"
        >
          {copy.common.retry}
        </Button>
      )}
    </div>
  );
}
