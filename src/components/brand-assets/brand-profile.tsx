import Link from "next/link";
import { ArrowRight, LinkIcon } from "lucide-react";
import { BrandMood } from "@/components/brand-assets/brand-mood";
import { BrandPalette } from "@/components/brand-assets/brand-palette";
import { BrandSummary } from "@/components/brand-assets/brand-summary";
import { ProductCatalog } from "@/components/brand-assets/product-catalog";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import type { BrandProfileProps } from "@/lib/types";

export function BrandProfile({ profile, onChange }: BrandProfileProps) {
  return (
    <div data-source="server" className="font-shell mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <a
            href={profile.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-shell-muted hover:text-shell-ink inline-flex items-center gap-2 text-xs"
          >
            <LinkIcon className="size-3.5" aria-hidden="true" />
            {profile.source_url}
          </a>
          <h1 className="text-shell-ink mt-3 text-3xl font-semibold tracking-tight">
            {copy.brandAnalysis.title}
          </h1>
          <p className="text-shell-muted mt-2 text-sm">{copy.brandAnalysis.description}</p>
        </div>
        <Button
          render={<Link href="/campaigns/new" />}
          nativeButton={false}
          className="bg-shell-button hover:bg-shell-button-hover rounded-shell gap-2 text-white"
        >
          {copy.brandAnalysis.selectCampaign}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </header>

      <div className="mt-9 grid gap-8 border-b pb-8 lg:grid-cols-2 lg:gap-10">
        <BrandSummary profile={profile} onChange={onChange} />
        <BrandPalette palette={profile.palette} />
      </div>

      <BrandMood profile={profile} onChange={onChange} />
      <ProductCatalog profile={profile} />
    </div>
  );
}
