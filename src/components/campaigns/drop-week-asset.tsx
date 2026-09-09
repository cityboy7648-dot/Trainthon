"use client";
import Image from "next/image";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy";
import type { Campaign3AssetProps } from "@/lib/types";

export function DropWeekAsset({ asset, onRetry }: Campaign3AssetProps) {
  const text = copy.campaigns.dropWeek;
  return (
    <article data-source="server" className="space-y-3">
      <p className="text-shell-muted text-sm">
        {asset.meta.date} · {asset.meta.format === "feed" ? text.feed : text.story}
      </p>
      <div
        className={
          asset.meta.format === "feed"
            ? "relative aspect-4/5 overflow-hidden rounded-lg"
            : "relative aspect-9/16 overflow-hidden rounded-lg"
        }
      >
        {asset.status === "done" && asset.imageUrl ? (
          <Image
            src={asset.imageUrl}
            alt={`${asset.meta.product.name} ${asset.meta.date}`}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-contain"
          />
        ) : (
          <Skeleton className="absolute inset-0 size-full" />
        )}
      </div>
      {asset.status === "failed" ? (
        <ErrorState
          code="generation_failed"
          cause={asset.meta.error ?? undefined}
          onRetry={onRetry}
        />
      ) : asset.status !== "done" ? (
        <p role="status" className="text-shell-muted text-sm">
          {asset.status === "pending" ? text.queued : text.generating}
        </p>
      ) : null}
      {asset.imageUrl && (
        <a className="text-sm underline" href={asset.imageUrl} target="_blank" rel="noreferrer">
          {text.download}
        </a>
      )}
      {asset.meta.caption && (
        <p className="text-sm leading-6 whitespace-pre-wrap">{asset.meta.caption}</p>
      )}
    </article>
  );
}
