"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { selectSavedCampaign } from "@/lib/data/campaign-workspace-actions";
import { readActiveBrandUrl } from "@/lib/brand-profile-session";
import { showErrorNotice } from "@/lib/error-notice";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignProductPicker } from "@/components/campaigns/campaign-product-picker";
import { campaigns as catalog } from "@/definitions/campaigns";
import { CampaignCreationHeader } from "@/components/campaigns/campaign-creation-header";
import { CampaignDetails } from "@/components/campaigns/campaign-details";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import type { CampaignSelectionProps } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";

export function CampaignSelection({ campaigns, previewMode }: CampaignSelectionProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const requestId = useRef<string | null>(null);
  const [transitioningKey, setTransitioningKey] = useState<string>();
  const selected = catalog.find((campaign) => campaign.key === searchParams.get("campaign"));
  const picked = campaigns.find((campaign) => campaign.key === searchParams.get("picked"));
  const preview = campaigns.find((campaign) => campaign.key === searchParams.get("preview"));

  function updateSelection(key: "campaign" | "preview" | "picked", value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "campaign") {
      params.delete("product");
      params.delete("run");
    }
    const query = params.toString();
    window.history.pushState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  function selectCampaign(key: string) {
    if (key === "signature_grid") {
      if (previewMode) {
        router.push("/campaigns/preview-signature-grid");
        return;
      }
      if (saving) return;
      requestId.current ??= crypto.randomUUID();
      startSaving(async () => {
        try {
          const result = await selectSavedCampaign({
            key,
            requestId: requestId.current,
            sourceUrl: readActiveBrandUrl() ?? undefined,
          });
          if (!result.ok) {
            showErrorNotice(result.code, result.cause);
            return;
          }
          router.push(`/campaigns/${result.data}`);
        } catch {
          showErrorNotice("network");
        }
      });
      return;
    }
    function commitSelection() {
      const params = new URLSearchParams(searchParams.toString());
      params.set("campaign", key);
      params.delete("preview");
      params.delete("product");
      params.delete("run");
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
          {selected.image && (
            <Image
              src={selected.image}
              alt={copy.campaigns.imageAlt(selected.name)}
              fill
              priority
              sizes="(max-width: 767px) 100vw, 752px"
              className="campaign-hero-image object-cover"
            />
          )}
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
        {selected.key === "one_product_three_scenes" && <CampaignProductPicker />}
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
            disabled={Boolean(transitioningKey) || saving}
            className="bg-shell-button hover:bg-shell-button-hover rounded-shell h-11 gap-3 px-6 text-white"
          >
            {saving ? copy.campaigns.saving : copy.campaigns.selectAction}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      )}
      <CampaignDetails campaign={preview} onClose={() => updateSelection("preview")} />
    </div>
  );
}
