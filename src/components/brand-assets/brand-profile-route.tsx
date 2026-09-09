import { BrandProfileResult } from "@/components/brand-assets/brand-profile-result";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { copy } from "@/lib/copy";
import { isPreviewAnalysis } from "@/lib/env";
import type { BrandProfileRouteProps } from "@/lib/types";

export async function BrandProfileRoute({ searchParams }: BrandProfileRouteProps) {
  const { url } = await searchParams;
  const dataSource = isPreviewAnalysis ? "server" : "mock";

  if (!url) {
    return (
      <div data-source={dataSource}>
        <PageHeader title={copy.brands.title} />
        <div className="p-6">
          <EmptyState title={copy.brands.emptyTitle} description={copy.brands.emptyDescription} />
        </div>
      </div>
    );
  }

  return <BrandProfileResult url={url} />;
}
