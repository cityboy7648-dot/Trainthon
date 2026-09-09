import Image from "next/image";
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy";
import type { CampaignPostPreviewProps } from "@/lib/types";

export function CampaignPostPreview({ campaign, post, mode }: CampaignPostPreviewProps) {
  const c = copy.campaignWorkspace;
  if (mode !== "grid" && !post) return <EmptyState title={c.emptyFormat} />;
  return (
    <div
      aria-label={c.previewLabel}
      className="border-shell-border rounded-shell overflow-hidden border"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="bg-shell-active grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold">
          {campaign.brand.slice(0, 1)}
        </span>
        <span className="truncate text-sm font-semibold">{campaign.brand}</span>
        <MoreHorizontal className="ml-auto size-5" aria-hidden="true" />
      </div>
      {mode === "grid" ? (
        <div className="grid grid-cols-3 gap-1">
          {[...campaign.posts]
            .sort((a, b) => a.meta.position - b.meta.position)
            .map((item) => (
              <div key={item.id} className="bg-shell-background relative aspect-square">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.meta.title ?? c.post(item.meta.day)}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                ) : item.status === "pending" || item.status === "processing" ? (
                  <Skeleton className="absolute inset-0 size-full" />
                ) : (
                  <span className="text-shell-icon absolute inset-0 grid place-items-center text-xs">
                    {c.post(item.meta.day)}
                  </span>
                )}
              </div>
            ))}
        </div>
      ) : (
        <>
          <div
            className={`bg-shell-background relative ${mode === "story" ? "aspect-campaign-story" : campaign.key === "signature_grid" ? "aspect-square" : "aspect-campaign-feed"}`}
          >
            {post?.image_url ? (
              <Image
                src={post.image_url}
                alt={post.meta.title ?? c.post(post.meta.day)}
                fill
                priority
                sizes="(max-width: 767px) 60vw, 368px"
                className="object-cover"
              />
            ) : post?.status === "pending" || post?.status === "processing" ? (
              <Skeleton className="absolute inset-0 size-full" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                {post?.status === "failed" ? (
                  <ErrorState code="generation_failed" cause={post.meta.error ?? undefined} />
                ) : (
                  <EmptyState title={c.emptyImage} />
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3 px-3 pt-2" aria-hidden="true">
            <Heart className="size-5" />
            <MessageCircle className="size-5" />
            <Send className="size-5" />
            <Bookmark className="ml-auto size-5" />
          </div>
          {post?.status === "pending" || post?.status === "processing" ? (
            <Skeleton className="mx-3 my-3 h-4 w-3/4" />
          ) : (
            <p className="mx-3 my-2 max-h-16 overflow-y-auto overscroll-contain text-xs leading-5 whitespace-pre-wrap">
              <span className="mr-2 font-semibold">{campaign.brand}</span>
              {post?.meta.caption || <span className="text-shell-icon">{c.emptyCaption}</span>}
            </p>
          )}
        </>
      )}
    </div>
  );
}
