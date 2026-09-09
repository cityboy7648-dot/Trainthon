import { redirect } from "next/navigation";
import { AnalysisProgress } from "@/components/brand-assets/analysis-progress";
import type { BrandProfileRouteProps } from "@/lib/types";

export async function AnalysisProgressRoute({ searchParams }: BrandProfileRouteProps) {
  const { url } = await searchParams;
  if (!url) {
    redirect("/brands");
  }

  return <AnalysisProgress url={url} />;
}
