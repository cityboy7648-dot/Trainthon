import type { CampaignOverviewState, CampaignStatus, CreatedCampaignPreview } from "@/lib/types";

const campaignStatuses: CampaignStatus[] = ["processing", "done", "draft"];

export function getCampaignOverview(
  campaigns: readonly CreatedCampaignPreview[],
  requestedStatus: string | undefined,
): CampaignOverviewState {
  if (campaigns.length === 0) {
    return { mode: "create" };
  }

  const status = campaignStatuses.includes(requestedStatus as CampaignStatus)
    ? (requestedStatus as CampaignStatus)
    : "processing";

  return {
    mode: "gallery",
    status,
    campaigns: campaigns.filter((campaign) => campaign.status === status),
    counts: {
      processing: campaigns.filter((campaign) => campaign.status === "processing").length,
      done: campaigns.filter((campaign) => campaign.status === "done").length,
      draft: campaigns.filter((campaign) => campaign.status === "draft").length,
    },
  };
}
