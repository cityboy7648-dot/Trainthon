"use client";

import { useRef, useTransition } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { selectSavedCampaign } from "@/lib/data/campaign-workspace-actions";
import { readActiveBrandUrl } from "@/lib/brand-profile-session";
import { showErrorNotice } from "@/lib/error-notice";
import { ArrowRight } from "lucide-react";
import { pickCampaign } from "@/lib/campaign-selection";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignProductPicker } from "@/components/campaigns/campaign-product-picker";
import { campaigns as catalog } from "@/definitions/campaigns";
import { CampaignCreationHeader } from "@/components/campaigns/campaign-creation-header";
import { CampaignDetails } from "@/components/campaigns/campaign-details";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import type { CampaignSelectionProps } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";

export function CampaignSelection({
  campaigns,
  previewMode,
  realUsagePlanner,
}: CampaignSelectionProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const requestId = useRef<string | null>(null);
  const selected = catalog.find((campaign) => campaign.key === searchParams.get("campaign"));
  const visibleCampaigns =
    selected && !campaigns.some((item) => item.key === selected.key)
      ? [...campaigns.slice(0, 2), selected]
      : campaigns;
  const picked =
    visibleCampaigns.find((campaign) => campaign.key === searchParams.get("picked")) ?? selected;
  const preview = visibleCampaigns.find((campaign) => campaign.key === searchParams.get("preview"));

  function updateSelection(key: "preview" | "picked", value?: string) {
    const params =
      key === "picked" && value
        ? pickCampaign(new URLSearchParams(searchParams.toString()), value)
        : new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
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
    if (selected?.key !== key) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("campaign", key);
      params.delete("preview");
      params.delete("product");
      params.delete("companions");
      params.delete("run");
      params.delete("brandId");
      params.delete("productIndex");
      window.history.pushState(null, "", `${pathname}?${params.toString()}`);
    }
  }

  return (
    <div data-source="server">
      <CampaignCreationHeader />
      {visibleCampaigns.length === 0 && <EmptyState title={copy.campaigns.catalogEmpty} />}
      <div aria-label={copy.campaigns.selectionLabel} className="grid gap-4 md:grid-cols-3">
        {visibleCampaigns.map((campaign) => (
          <CampaignCard
            key={campaign.key}
            campaign={campaign}
            selected={picked?.key === campaign.key}
            onSelect={() => updateSelection("picked", campaign.key)}
            onPreview={() => updateSelection("preview", campaign.key)}
          />
        ))}
      </div>
      {visibleCampaigns.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Button
            onClick={() => picked && selectCampaign(picked.key)}
            disabled={!picked || saving}
            aria-expanded={Boolean(selected)}
            aria-controls="campaign-product-selection"
            className="bg-shell-button hover:bg-shell-button-hover rounded-shell h-11 gap-3 justify-self-end px-6 text-white md:col-start-3"
          >
            {saving ? copy.campaigns.saving : copy.campaigns.selectAction}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      )}
      <div id="campaign-product-selection" key={selected?.key}>
        {selected?.key === "one_product_three_scenes" && (
          <CampaignProductPicker campaignNumber={2} />
        )}
        {selected?.key === "complete_set" && <CampaignProductPicker campaignNumber={5} />}
        {selected?.key === "real_usage" && realUsagePlanner}
      </div>
      <CampaignDetails campaign={preview} onClose={() => updateSelection("preview")} />
    </div>
  );
}
