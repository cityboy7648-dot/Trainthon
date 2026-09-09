import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { copy } from "@/lib/copy";

export default function AssetsPage() {
  return (
    <>
      <PageHeader title={copy.assets.title} />
      <div className="p-6" data-source="mock">
        <EmptyState title={copy.assets.emptyTitle} description={copy.assets.emptyDescription} />
      </div>
    </>
  );
}
