import { connection } from "next/server";
import { Suspense } from "react";
import { Campaign4Setup } from "@/components/campaigns/campaign-4-setup";
import { Campaign4PlannerSkeleton } from "@/components/campaigns/campaign-4-planner-skeleton";
import { CampaignSelection } from "@/components/campaigns/campaign-selection";
import { getCampaignCandidates } from "@/lib/data/campaign-catalog";

export async function CampaignCandidates() {
  await connection();
  return (
    <CampaignSelection
      campaigns={getCampaignCandidates()}
      realUsagePlanner={
        <Suspense fallback={<Campaign4PlannerSkeleton />}>
          <Campaign4Setup />
        </Suspense>
      }
    />
  );
}
