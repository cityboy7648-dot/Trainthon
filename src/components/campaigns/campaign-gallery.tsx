import { listSavedCampaigns } from "@/lib/data/campaign-workspace";
import { toCampaignGalleryCard } from "@/lib/campaign-gallery";
import { AppError, campaignErrors } from "@/lib/errors";
import { ErrorState } from "@/components/error-state";
import { CampaignGalleryView } from "./campaign-gallery-view";
import { isCampaignPreview } from "@/lib/env";

export async function CampaignGallery() {
  let campaigns;
  try {
    if (isCampaignPreview) {
      const { previewCampaign } = await import("@/mock/campaign-workspace"); // MOCK
      campaigns = [
        toCampaignGalleryCard({
          id: previewCampaign.id,
          campaign_key: previewCampaign.key,
          status: previewCampaign.status,
          created_at: previewCampaign.startDate,
          brands: { profile: { name: previewCampaign.brand } },
          assets: previewCampaign.posts.map((post) => ({
            kind: "image",
            status: post.status,
            meta: { ...post.meta, start_date: previewCampaign.startDate },
          })),
        }),
      ];
    } else campaigns = await listSavedCampaigns();
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
  return <CampaignGalleryView campaigns={campaigns} preview={isCampaignPreview} />;
}
