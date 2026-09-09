"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CampaignBrief } from "@/components/campaigns/campaign-brief";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignCreationHeader } from "@/components/campaigns/campaign-creation-header";
import { CampaignDetails } from "@/components/campaigns/campaign-details";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { mockCampaigns } from "@/mock/campaigns"; // MOCK

export function CampaignSelection() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [transitioningKey, setTransitioningKey] = useState<string>();
  const selected = mockCampaigns.find((campaign) => campaign.key === searchParams.get("campaign"));
  const preview = mockCampaigns.find((campaign) => campaign.key === searchParams.get("preview"));

  function updateSelection(key: "campaign" | "preview", value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    window.history.pushState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  function selectCampaign(key: string) {
    function commitSelection() {
      const params = new URLSearchParams(searchParams.toString());
      params.set("campaign", key);
      params.delete("preview");
      window.history.pushState(null, "", `${pathname}?${params.toString()}`);
    }

    if (typeof document.startViewTransition !== "function") {
      commitSelection();
      return;
    }

    setTransitioningKey(key);
    window.requestAnimationFrame(() => {
      const transition = document.startViewTransition(async () => {
        commitSelection();
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      });

      void transition.finished.then(
        () => setTransitioningKey(undefined),
        () => setTransitioningKey(undefined),
      );
    });
  }

  if (selected) {
    return (
      <div data-source="mock" className="pb-8">
        <Button
          variant="ghost"
          onClick={() => updateSelection("campaign")}
          className="text-shell-muted mb-5 -ml-2 gap-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {copy.campaigns.backToSelection}
        </Button>

        <section className="rounded-campaign-card relative h-80 overflow-hidden sm:h-96">
          <Image
            src={selected.image}
            alt={copy.campaigns.imageAlt(selected.name)}
            fill
            priority
            sizes="(max-width: 767px) 100vw, 752px"
            className="campaign-hero-image object-cover"
          />
          <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <p className="text-xs font-semibold tracking-wide text-white/75 uppercase">
              {copy.campaigns.selectedCampaign}
            </p>
            <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              {selected.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">{selected.goal}</p>
          </div>
        </section>

        <CampaignBrief key={selected.key} campaign={selected} />
      </div>
    );
  }

  return (
    <div data-source="mock">
      <CampaignCreationHeader />
      <div aria-label={copy.campaigns.selectionLabel} className="grid gap-4 md:grid-cols-3">
        {mockCampaigns.map((campaign) => (
          <CampaignCard
            key={campaign.key}
            campaign={campaign}
            selected={false}
            transitioning={transitioningKey === campaign.key}
            onSelect={() => selectCampaign(campaign.key)}
            onPreview={() => updateSelection("preview", campaign.key)}
          />
        ))}
      </div>
      <CampaignDetails
        campaign={preview}
        onClose={() => updateSelection("preview")}
        onSelect={preview ? () => selectCampaign(preview.key) : undefined}
      />
    </div>
  );
}
