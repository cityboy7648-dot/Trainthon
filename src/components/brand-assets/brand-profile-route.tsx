import { BrandProfileResult } from "@/components/brand-assets/brand-profile-result";
import { ActiveBrandProfile } from "@/components/brand-assets/active-brand-profile";
import type { BrandProfileRouteProps } from "@/lib/types";

export async function BrandProfileRoute({ searchParams }: BrandProfileRouteProps) {
  const { url } = await searchParams;

  if (!url) {
    return <ActiveBrandProfile />;
  }

  return <BrandProfileResult url={url} />;
}
