import { CampaignOverview } from "@/components/campaigns/campaign-overview";
import type { CampaignOverviewProps } from "@/lib/types";

export default function CampaignsPage({ searchParams }: CampaignOverviewProps) {
  return <CampaignOverview searchParams={searchParams} />;
}
