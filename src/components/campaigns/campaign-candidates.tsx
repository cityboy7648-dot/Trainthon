import { connection } from "next/server";
import { CampaignSelection } from "@/components/campaigns/campaign-selection";
import { getCampaignCandidates } from "@/lib/data/campaign-catalog";

export async function CampaignCandidates() {
  await connection();
  return <CampaignSelection campaigns={getCampaignCandidates()} />;
}
