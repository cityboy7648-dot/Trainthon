import { Suspense } from "react";
import { CampaignGallery } from "./campaign-gallery";
import { CampaignGallerySkeleton } from "./campaign-gallery-skeleton";

export function CampaignOverview() {
  return (
    <Suspense fallback={<CampaignGallerySkeleton />}>
      <CampaignGallery />
    </Suspense>
  );
}
