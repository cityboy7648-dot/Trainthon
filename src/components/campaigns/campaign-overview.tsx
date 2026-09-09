import { CampaignCreation } from "@/components/campaigns/campaign-creation";
import { CampaignGallery } from "@/components/campaigns/campaign-gallery";
import { getCampaignOverview } from "@/lib/campaigns";
import type { CampaignOverviewProps } from "@/lib/types";
import { mockCreatedCampaigns } from "@/mock/campaigns"; // MOCK

export async function CampaignOverview({ searchParams }: CampaignOverviewProps) {
  const { status } = await searchParams;
  const overview = getCampaignOverview(mockCreatedCampaigns, status);

  if (overview.mode === "create") {
    return (
      <div data-source="mock">
        <CampaignCreation />
      </div>
    );
  }

  return (
    <div data-source="mock">
      <CampaignGallery
        status={overview.status}
        campaigns={overview.campaigns}
        counts={overview.counts}
      />
    </div>
  );
}
