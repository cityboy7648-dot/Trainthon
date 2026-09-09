"use client";
import { useEffect, useState } from "react";
import { DropWeekAsset } from "./drop-week-asset";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import {
  generateDropWeekAsset,
  readDropWeek,
  retryDropWeekAsset,
} from "@/lib/data/campaign-3-actions";
import { copy } from "@/lib/copy";
import type { Campaign3ResultsProps } from "@/lib/types";
import type { ErrorCode } from "@/lib/errors";

export function DropWeekResults({ initial }: Campaign3ResultsProps) {
  const [result, setResult] = useState(initial);
  const [error, setError] = useState<{ code: ErrorCode; cause?: string }>();
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function work() {
      try {
        while (!cancelled) {
          const latest = await readDropWeek(initial.runId);
          if (cancelled) return;
          if (!latest.ok) {
            setError(latest);
            return;
          }
          setResult(latest.data);
          const pending = latest.data.assets
            .filter((asset) => asset.status === "pending")
            .slice(0, 2);
          if (pending.length) {
            const generated = await Promise.all(
              pending.map((asset) => generateDropWeekAsset(initial.runId, asset.id)),
            );
            const failure = generated.find((item) => !item.ok);
            if (failure && !failure.ok) {
              setError(failure);
              return;
            }
          } else if (latest.data.assets.some((asset) => asset.status === "processing")) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } else return;
        }
      } catch {
        if (!cancelled) setError({ code: "network" });
      }
    }
    void work();
    return () => {
      cancelled = true;
    };
  }, [initial.runId, refresh]);
  const text = copy.campaigns.dropWeek;
  return (
    <section data-source="server" className="space-y-6">
      <p aria-live="polite" className="text-sm">
        {text.count(
          result.assets.filter((asset) => asset.status === "done").length,
          result.assets.length,
        )}
      </p>
      {error && (
        <ErrorState
          {...error}
          onRetry={() => {
            setError(undefined);
            setRefresh((value) => value + 1);
          }}
        />
      )}
      {!result.assets.length && (
        <EmptyState title={text.noAssets} description={text.noAssetsDescription} />
      )}
      <div className="grid items-start gap-8 sm:grid-cols-2">
        {result.assets.map((asset) => (
          <DropWeekAsset
            key={asset.id}
            asset={asset}
            onRetry={() => {
              void retryDropWeekAsset(result.runId, asset.id)
                .then((retry) => {
                  if (!retry.ok) setError(retry);
                  else setRefresh((value) => value + 1);
                })
                .catch(() => setError({ code: "network" }));
            }}
          />
        ))}
      </div>
    </section>
  );
}
