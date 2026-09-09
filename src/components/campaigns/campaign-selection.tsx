"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CampaignBrief } from "@/components/campaigns/campaign-brief";
import { CampaignProductPicker } from "@/components/campaigns/campaign-product-picker";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignDetails } from "@/components/campaigns/campaign-details";
import { Button } from "@/components/ui/button";
import { campaigns as catalog } from "@/definitions/campaigns";
import { copy } from "@/lib/copy";
import type { CampaignSelectionProps } from "@/lib/types";

export function CampaignSelection({ campaigns }: CampaignSelectionProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const selected = catalog.find((item) => item.key === searchParams.get("campaign"));
  const preview = campaigns.find((item) => item.key === searchParams.get("preview"));

  function updateSelection(key: "campaign" | "preview", value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "campaign") {
      params.delete("preview");
      params.delete("product");
      params.delete("run");
    }
    const query = params.toString();
    window.history.pushState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  if (selected) {
    return (
      <div data-source="server">
        <Button
          variant="ghost"
          onClick={() => updateSelection("campaign")}
          className="text-shell-muted gap-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {copy.campaigns.backToSelection}
        </Button>
        {selected.key === "one_product_three_scenes" ? (
          <CampaignProductPicker />
        ) : (
          <CampaignBrief key={selected.key} campaign={selected} />
        )}
      </div>
    );
  }
  return (
    <div data-source="server">
      <div className="grid gap-4 md:grid-cols-3">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.key}
            campaign={campaign}
            selected={false}
            onSelect={() => updateSelection("campaign", campaign.key)}
            onPreview={() => updateSelection("preview", campaign.key)}
          />
        ))}
      </div>
      <CampaignDetails
        campaign={preview}
        onClose={() => updateSelection("preview")}
        onSelect={preview ? () => updateSelection("campaign", preview.key) : undefined}
      />
    </div>
  );
}
