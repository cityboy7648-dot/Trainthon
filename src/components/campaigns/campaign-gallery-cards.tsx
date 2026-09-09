"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignDetails } from "@/components/campaigns/campaign-details";
import type { CampaignGalleryCardsProps } from "@/lib/types";

export function CampaignGalleryCards({ campaigns }: CampaignGalleryCardsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");
  const preview = campaigns.find((item) => item.id === previewId)?.campaign;

  function updatePreview(id?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("preview", id);
    else params.delete("preview");
    const query = params.toString();
    window.history.pushState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {campaigns.map((item) => (
          <CampaignCard
            key={item.id}
            campaign={item.campaign}
            selected={false}
            onSelect={() => updatePreview(item.id)}
            onPreview={() => updatePreview(item.id)}
          />
        ))}
      </div>
      <CampaignDetails campaign={preview} onClose={() => updatePreview()} />
    </div>
  );
}
