import { getSavedCampaign } from "@/lib/data/campaign-workspace";
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
  try {
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
  return <CampaignWorkspaceLive campaign={campaign} />;
}
