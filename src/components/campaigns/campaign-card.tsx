import Image from "next/image";
import { Check } from "lucide-react";
import { copy } from "@/lib/copy";
import type { CampaignCardProps } from "@/lib/types";

export function CampaignCard({ campaign, selected, onSelect, onPreview }: CampaignCardProps) {
  return (
    <article
      data-source="mock"
      data-selected={selected}
      className="rounded-campaign-card border-campaign-border bg-background data-[selected=true]:border-shell-ink data-[selected=true]:ring-shell-ink relative overflow-hidden border data-[selected=true]:ring-1"
    >
      <button
        type="button"
        aria-label={copy.campaigns.preview(campaign.name)}
        aria-haspopup="dialog"
        onClick={onPreview}
        className="aspect-campaign-image focus-visible:ring-shell-ink relative block w-full cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
      >
        <Image
          src={campaign.image}
          alt={copy.campaigns.imageAlt(campaign.name)}
          fill
          sizes="(max-width: 767px) 90vw, 240px"
          className="object-cover"
        />
      </button>
      <button
        type="button"
        aria-label={copy.campaigns.select(campaign.name)}
        aria-pressed={selected}
        onClick={onSelect}
        className="focus-visible:ring-shell-ink block w-full cursor-pointer px-3.5 pt-1 pb-4 text-left focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
      >
        <h2 className="text-shell-ink text-sm leading-6 font-semibold">{campaign.name}</h2>
        <p className="text-shell-muted mt-0.5 min-h-10 text-xs leading-5">{campaign.goal}</p>
      </button>
      {selected && (
        <span className="bg-shell-button pointer-events-none absolute top-3 right-3 grid size-6 place-items-center rounded-full text-white">
          <Check className="size-3.5" aria-hidden="true" />
        </span>
      )}
    </article>
  );
}
