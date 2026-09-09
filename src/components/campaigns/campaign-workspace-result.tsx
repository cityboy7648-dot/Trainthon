import {
  getSavedCampaign,
  ownedCampaign,
  getSavedCampaign4Plan,
} from "@/lib/data/campaign-workspace";
import Link from "next/link";
import { campaigns } from "@/definitions/campaigns";
import { copy } from "@/lib/copy";
import { CampaignTwoResult } from "./campaign-two-result";
import { CampaignFiveResult } from "./campaign-five-result";
import { Campaign4PlanResult } from "./campaign-4-plan-result";
import { CampaignWorkspaceLive } from "./campaign-workspace-live";
import { ErrorState } from "@/components/error-state";
import { AppError, campaignErrors } from "@/lib/errors";
import { isCampaignPreview } from "@/lib/env";

export async function CampaignWorkspaceResult({ id }: { id: string }) {
  if (isCampaignPreview && id === "preview-signature-grid") {
    const { CampaignWorkspacePreview } = await import("./campaign-workspace-preview");
    return <CampaignWorkspacePreview />;
  }
  let campaign;
  let key;
  let plan;
  try {
    const { run } = await ownedCampaign(id);
    key = run.campaign_key;
    if (key === "real_usage") plan = await getSavedCampaign4Plan(id);
    else if (!["one_product_three_scenes", "complete_set"].includes(key))
      campaign = await getSavedCampaign(id);
  } catch (error) {
    return (
      <div className="p-8">
        <ErrorState
          code={error instanceof AppError ? error.code : "network"}
          cause={error instanceof AppError ? error.cause : campaignErrors.result}
        />
      </div>
    );
  }
  if (campaign) return <CampaignWorkspaceLive campaign={campaign} />;
  const definition = campaigns.find((item) => item.key === key);
  return (
    <div data-source="server" className="p-6 sm:p-8">
      <Link href="/campaigns/new" className="text-shell-muted text-sm underline">
        {copy.campaigns.backToSelection}
      </Link>
      <h1 className="text-shell-ink mt-5 text-2xl font-semibold">{definition?.name}</h1>
      {key === "one_product_three_scenes" && <CampaignTwoResult runId={id} />}
      {key === "complete_set" && <CampaignFiveResult runId={id} />}
      {plan && <Campaign4PlanResult {...plan} />}
    </div>
  );
}
