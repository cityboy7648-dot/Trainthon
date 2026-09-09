import { notFound } from "next/navigation";
import { BrandCompletionPreview } from "@/components/brand-assets/brand-completion-preview";
import { isProduction } from "@/lib/env";

export default function BrandCompletionPreviewPage() {
  if (isProduction) notFound();
  return <BrandCompletionPreview />;
}
