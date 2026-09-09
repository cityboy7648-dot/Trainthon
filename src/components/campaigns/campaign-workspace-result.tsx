import {
  getSavedCampaign,
  ownedCampaign,
  getSavedCampaign4Plan,
} from "@/lib/data/campaign-workspace";
import { campaigns } from "@/definitions/campaigns";
import { CampaignBackButton } from "./campaign-back-button";
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
    <div
      data-source="server"
      className="font-shell bg-shell-background text-shell-ink min-h-dvh p-6 sm:p-8"
    >
      <CampaignBackButton />
      <h1 className="text-2xl leading-9 font-semibold tracking-tight">{definition?.name}</h1>
      {key === "one_product_three_scenes" && <CampaignTwoResult runId={id} />}
      {key === "complete_set" && <CampaignFiveResult runId={id} />}
      {plan && <Campaign4PlanResult {...plan} />}
    </div>
  );
}
