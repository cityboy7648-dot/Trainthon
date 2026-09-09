import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { copy } from "@/lib/copy";

export default function BrandsPage() {
  return (
    <>
      <PageHeader title={copy.brands.title} />
      <div className="p-6" data-source="mock">
        <EmptyState title={copy.brands.emptyTitle} description={copy.brands.emptyDescription} />
      </div>
    </>
  );
}
