import { EmptyState } from "@/components/empty-state";
import { copy } from "@/lib/copy";

export function CampaignSelection() {
  return (
    <EmptyState
      title={copy.campaigns.recommendationsEmptyTitle}
      description={copy.campaigns.recommendationsEmptyDescription}
    />
  );
}
