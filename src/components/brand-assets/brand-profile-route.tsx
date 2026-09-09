import { BrandProfile } from "@/components/brand-assets/brand-profile";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { copy } from "@/lib/copy";
import type { BrandProfileRouteProps } from "@/lib/types";
import { getMockBrandProfile } from "@/mock/brand-profile"; // MOCK

export async function BrandProfileRoute({ searchParams }: BrandProfileRouteProps) {
  const { url } = await searchParams;

  if (!url) {
    return (
      <div data-source="mock">
        <PageHeader title={copy.brands.title} />
        <div className="p-6">
          <EmptyState title={copy.brands.emptyTitle} description={copy.brands.emptyDescription} />
        </div>
      </div>
    );
  }

  const profile = await getMockBrandProfile(url);

  return <BrandProfile profile={profile} />;
}
