import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { copy } from "@/lib/copy";

export default function CampaignsPage() {
  return (
    <>
      <PageHeader title={copy.campaigns.title} />
      <div className="p-6" data-source="mock">
        <EmptyState
          title={copy.campaigns.emptyTitle}
          description={copy.campaigns.emptyDescription}
        />
      </div>
    </>
  );
}
