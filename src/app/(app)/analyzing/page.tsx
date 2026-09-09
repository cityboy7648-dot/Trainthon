import { AnalysisProgressRoute } from "@/components/brand-assets/analysis-progress-route";
import type { BrandProfileRouteProps } from "@/lib/types";

export const maxDuration = 300;

export default function AnalyzingPage({ searchParams }: BrandProfileRouteProps) {
  return <AnalysisProgressRoute searchParams={searchParams} />;
}
