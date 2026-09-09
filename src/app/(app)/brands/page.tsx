import { BrandProfileRoute } from "@/components/brand-assets/brand-profile-route";
import type { BrandProfileRouteProps } from "@/lib/types";

export default function BrandsPage({ searchParams }: BrandProfileRouteProps) {
  return <BrandProfileRoute searchParams={searchParams} />;
}
