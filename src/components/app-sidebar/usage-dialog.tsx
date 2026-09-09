"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/components/error-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy";
import { getCurrentUserUsage } from "@/lib/data/usage";
import type { UsageDialogProps, UserUsage } from "@/lib/types";

export function UsageDialog({ open, onOpenChange }: UsageDialogProps) {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [cause, setCause] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    void getCurrentUserUsage().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setUsage(result.usage);
        setCause(null);
        return;
      }
      setUsage(null);
      setCause(result.cause ?? copy.sidebar.usageLoadFailed);
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setUsage(null);
          setCause(null);
        }
        onOpenChange(next);
      }}
      modal
    >
      <DialogContent
        overlayClassName="bg-shell-ink/60"
        className="font-shell bg-background border-shell-border rounded-shell gap-5 border p-6 ring-0"
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle className="font-shell text-shell-ink text-shell-brand font-semibold tracking-tight">
            {copy.sidebar.usage}
          </DialogTitle>
          <DialogDescription className="text-shell-muted text-shell-nav">
            {copy.sidebar.usageDescription}
          </DialogDescription>
        </DialogHeader>
        {cause ? (
          <ErrorState code="network" cause={cause} />
        ) : usage ? (
          <dl data-source="server" className="grid gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-shell-muted text-shell-nav">{copy.sidebar.usageBrands}</dt>
              <dd className="text-shell-ink text-shell-nav font-semibold">
                {copy.sidebar.usageTimes(usage.brandCount)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-shell-muted text-shell-nav">{copy.sidebar.usageInputTokens}</dt>
              <dd className="text-shell-ink text-shell-nav font-semibold">
                {copy.sidebar.usageTokens(usage.inputTokens)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-shell-muted text-shell-nav">{copy.sidebar.usageOutputTokens}</dt>
              <dd className="text-shell-ink text-shell-nav font-semibold">
                {copy.sidebar.usageTokens(usage.outputTokens)}
              </dd>
            </div>
          </dl>
        ) : (
          <div className="grid gap-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
