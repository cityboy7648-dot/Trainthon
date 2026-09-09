import { Suspense } from "react";
import { CampaignSelection } from "@/components/campaigns/campaign-selection";
import { CampaignSelectionSkeleton } from "@/components/campaigns/campaign-selection-skeleton";
import { copy } from "@/lib/copy";

export function CampaignCreation() {
  return (
    <div className="font-shell max-w-campaign-content pt-campaign-top mx-auto w-full px-6 pb-28 md:px-0">
      <header className="mb-campaign-heading-gap">
        <h1 className="text-shell-ink text-2xl leading-9 font-semibold tracking-tight">
          {copy.campaigns.heading}
        </h1>
        <p className="text-campaign-muted text-2xl leading-9 font-semibold tracking-tight">
          {copy.campaigns.description}
        </p>
      </header>
      <Suspense fallback={<CampaignSelectionSkeleton />}>
        <CampaignSelection />
      </Suspense>
    </div>
  );
}
