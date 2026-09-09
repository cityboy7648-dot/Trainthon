import { CampaignCreationHeader } from "@/components/campaigns/campaign-creation-header";
import { CampaignSelection } from "@/components/campaigns/campaign-selection";

export function CampaignCreation() {
  return (
    <div className="font-shell max-w-campaign-content pt-campaign-top mx-auto w-full px-6 pb-28 md:px-0">
      <CampaignCreationHeader />
      <CampaignSelection />
    </div>
  );
}
