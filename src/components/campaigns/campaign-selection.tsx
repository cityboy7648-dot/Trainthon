"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignCreationHeader } from "@/components/campaigns/campaign-creation-header";
import { CampaignDetails } from "@/components/campaigns/campaign-details";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import type { CampaignSelectionProps } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";

export function CampaignSelection({ campaigns }: CampaignSelectionProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [transitioningKey, setTransitioningKey] = useState<string>();
  const selected = campaigns.find((campaign) => campaign.key === searchParams.get("campaign"));
  const picked = campaigns.find((campaign) => campaign.key === searchParams.get("picked"));
  const preview = campaigns.find((campaign) => campaign.key === searchParams.get("preview"));

  function updateSelection(key: "campaign" | "preview" | "picked", value?: string) {
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
      <div data-source="server" className="pb-8">
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
      </div>
    );
  }

  return (
    <div data-source="server">
      <CampaignCreationHeader />
      {campaigns.length === 0 && <EmptyState title={copy.campaigns.catalogEmpty} />}
      <div aria-label={copy.campaigns.selectionLabel} className="grid gap-4 md:grid-cols-3">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.key}
            campaign={campaign}
            source="server"
            selected={picked?.key === campaign.key}
            transitioning={transitioningKey === campaign.key}
            onSelect={() => updateSelection("picked", campaign.key)}
            onPreview={() => updateSelection("preview", campaign.key)}
          />
        ))}
      </div>
      {picked && (
        <div className="fixed right-6 bottom-6 z-20 sm:right-10 sm:bottom-8">
          <Button
            onClick={() => selectCampaign(picked.key)}
            disabled={Boolean(transitioningKey)}
            className="bg-shell-button hover:bg-shell-button-hover rounded-shell h-11 gap-3 px-6 text-white"
          >
            {copy.campaigns.selectAction}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      )}
      <CampaignDetails
        campaign={preview}
        source="server"
        onClose={() => updateSelection("preview")}
      />
    </div>
  );
}
