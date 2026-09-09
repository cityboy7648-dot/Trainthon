import { CampaignCreationHeader } from "@/components/campaigns/campaign-creation-header";
import { CampaignSelection } from "@/components/campaigns/campaign-selection";
import { connection } from "next/server";
import { campaigns } from "@/definitions/campaigns";
import { randomInt } from "node:crypto";

export async function CampaignCreation() {
  await connection();
  const candidates = [...campaigns];
  for (let index = candidates.length - 1; index > 0; index--) {
    const target = randomInt(index + 1);
    [candidates[index], candidates[target]] = [candidates[target], candidates[index]];
  }
  return (
    <div className="font-shell max-w-campaign-content pt-campaign-top mx-auto w-full px-6 pb-28 md:px-0">
      <CampaignCreationHeader />
      <CampaignSelection campaigns={candidates.slice(0, 3)} />
    </div>
  );
}
