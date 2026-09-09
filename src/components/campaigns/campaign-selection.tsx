"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignDetails } from "@/components/campaigns/campaign-details";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { mockCampaigns } from "@/mock/campaigns"; // MOCK

export function CampaignSelection() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const selected = mockCampaigns.find((campaign) => campaign.key === searchParams.get("campaign"));
  const preview = mockCampaigns.find((campaign) => campaign.key === searchParams.get("preview"));

  function updateSelection(key: "campaign" | "preview", value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    window.history.pushState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div data-source="mock">
      <div aria-label={copy.campaigns.selectionLabel} className="grid gap-4 md:grid-cols-3">
        {mockCampaigns.map((campaign) => (
          <CampaignCard
            key={campaign.key}
            campaign={campaign}
            selected={selected?.key === campaign.key}
            onSelect={() => updateSelection("campaign", campaign.key)}
            onPreview={() => updateSelection("preview", campaign.key)}
          />
        ))}
      </div>
      {selected && (
        <div className="fixed right-6 bottom-6 z-20 sm:right-10 sm:bottom-8">
          <Button className="bg-shell-button hover:bg-shell-button-hover rounded-shell h-11 gap-3 px-6 text-white">
            {copy.campaigns.continue}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      )}
      <CampaignDetails campaign={preview} onClose={() => updateSelection("preview")} />
    </div>
  );
}
