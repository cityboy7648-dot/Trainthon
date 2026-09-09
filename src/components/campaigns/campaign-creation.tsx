import { Suspense } from "react";
import { CampaignCreationHeader } from "@/components/campaigns/campaign-creation-header";
import { CampaignCandidates } from "@/components/campaigns/campaign-candidates";
import { CampaignSelectionSkeleton } from "@/components/campaigns/campaign-selection-skeleton";

export function CampaignCreation() {
  return (
    <div className="font-shell max-w-campaign-content pt-campaign-top mx-auto w-full px-6 pb-28 md:px-0">
      <Suspense
        fallback={
          <>
            <CampaignCreationHeader />
            <CampaignSelectionSkeleton />
          </>
        }
      >
        <CampaignCandidates />
      </Suspense>
    </div>
  );
}
