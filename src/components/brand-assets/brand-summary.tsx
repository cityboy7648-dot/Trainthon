import Image from "next/image";
import { ImageOff, LinkIcon } from "lucide-react";
import { copy } from "@/lib/copy";
import type { BrandSummaryProps } from "@/lib/types";

export function BrandSummary({ name, industry, tagline, logoUrl, sourceUrl }: BrandSummaryProps) {
  return (
    <section aria-labelledby="brand-summary-title">
      <h2 id="brand-summary-title" className="text-shell-ink text-base font-semibold">
        {copy.brandAnalysis.basicInfo}
      </h2>
      <div className="mt-5 flex items-center gap-6">
        <div className="bg-shell-background border-shell-border flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={copy.brandAnalysis.logoAlt(name)}
              width={112}
              height={112}
              unoptimized={logoUrl.startsWith("http")}
            />
          ) : (
            <ImageOff
              className="text-shell-icon size-6"
              aria-label={copy.brandAnalysis.unavailable}
            />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-shell-ink text-2xl font-semibold tracking-tight">{name}</h3>
          <p className="text-shell-ink mt-1 text-sm font-medium">
            {industry ?? copy.brandAnalysis.unavailable}
          </p>
          <p className="text-shell-muted mt-2 text-sm leading-6">
            {tagline ?? copy.brandAnalysis.unavailable}
          </p>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-shell-muted hover:text-shell-ink mt-3 inline-flex max-w-full items-center gap-2 text-sm underline-offset-4 hover:underline"
          >
            <LinkIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{sourceUrl}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
