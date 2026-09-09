import {
  getSavedCampaign,
  ownedCampaign,
  getSavedCampaign4Plan,
} from "@/lib/data/campaign-workspace";
import { campaigns } from "@/definitions/campaigns";
import { CampaignBackButton } from "./campaign-back-button";
import { Campaign4PlanResult } from "./campaign-4-plan-result";
import { Campaign4Result } from "./campaign-4-result";
import { getCampaign4Result } from "@/lib/data/campaign-4-images";
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
    if (key === "real_usage") {
      const result = await getCampaign4Result(id);
      if (!result.assets.length && result.status === "pending")
        plan = await getSavedCampaign4Plan(id);
    } else campaign = await getSavedCampaign(id);
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
      {plan && <Campaign4PlanResult {...plan} />}
      {key === "real_usage" && !plan && <Campaign4Result runId={id} />}
    </div>
  );
}
