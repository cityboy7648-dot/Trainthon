import { CampaignCreation } from "@/components/campaigns/campaign-creation";
import { CampaignGallery } from "@/components/campaigns/campaign-gallery";
import { getCampaignOverview } from "@/lib/campaigns";
import type { CampaignOverviewProps } from "@/lib/types";

export async function CampaignOverview({ searchParams }: CampaignOverviewProps) {
  const { status } = await searchParams;
  const overview = getCampaignOverview([], status);

  if (overview.mode === "create") {
    return <CampaignCreation />;
  }

  return (
    <div>
      <CampaignGallery
        status={overview.status}
        campaigns={overview.campaigns}
        counts={overview.counts}
      />
    </div>
  );
}
