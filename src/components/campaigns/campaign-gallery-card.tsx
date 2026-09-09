import Image from "next/image";
import Link from "next/link";
import { Camera, Globe } from "lucide-react";
import { copy } from "@/lib/copy";
import type { SavedCampaignCard } from "@/lib/types";

export function CampaignGalleryCard({ campaign }: { campaign: SavedCampaignCard }) {
  const text = copy.campaignGallery;
  const Icon = campaign.channels.includes("Instagram") ? Camera : Globe;
  const done = campaign.status === "done";
  const percent = campaign.total ? Math.floor((campaign.completed / campaign.total) * 100) : 0;
  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="border-campaign-border rounded-campaign-card hover:border-shell-ink focus-visible:ring-shell-ink bg-background block min-w-0 border p-4 focus-visible:ring-2"
    >
      <div className="mb-4 flex min-h-10 items-center gap-2">
        <span className="bg-shell-active text-shell-muted grid size-7 shrink-0 place-items-center rounded-lg">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <h3 className="text-shell-ink line-clamp-2 min-w-0 flex-1 text-sm font-semibold">
          {campaign.name}
        </h3>
        <span className="bg-shell-active text-shell-muted flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs">
          <span className="size-1.5 rounded-full bg-current" />
          {done ? text.done : text.active}
        </span>
      </div>
      <div className="bg-shell-background aspect-campaign-image relative overflow-hidden rounded-xl">
        {campaign.image ? (
          <Image
            src={campaign.image}
            alt={campaign.name}
            fill
            sizes="(max-width: 767px) 90vw, 360px"
            className="object-cover"
          />
        ) : (
          <span className="text-shell-muted absolute inset-0 grid place-items-center text-xs">
            {text.preparing}
          </span>
        )}
      </div>
      <p className="text-shell-muted mt-3 truncate text-xs">{campaign.brand}</p>
      <div className="text-shell-muted mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>
          {campaign.total ? text.images(campaign.total) : text.preparing} ·{" "}
          {campaign.endDate ? text.endDate(campaign.endDate) : text.unknownDate}
        </span>
        <span className="text-shell-ink font-medium">
          {text.progress(campaign.completed, campaign.total)}
        </span>
      </div>
      <progress
        className="campaign-generation-progress mt-3 block h-2 w-full overflow-hidden rounded-full"
        value={percent}
        max={100}
        aria-label={`${campaign.name} ${text.progress(campaign.completed, campaign.total)}`}
      />
      {(campaign.failed > 0 || campaign.status === "failed") && (
        <p className="text-destructive mt-2 text-xs">{text.failed}</p>
      )}
    </Link>
  );
}
