import Image from "next/image";
import { LinkIcon } from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { copy } from "@/lib/copy";
import type { BrandSummaryProps } from "@/lib/types";

export function BrandSummary({ name, industry, tagline, logoUrl, sourceUrl }: BrandSummaryProps) {
  return (
    <section aria-labelledby="brand-summary-title">
      <h2 id="brand-summary-title" className="text-shell-ink text-base font-semibold">
        {copy.brandAnalysis.basicInfo}
      </h2>
      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
        {logoUrl ? (
          <div className="bg-shell-background border-shell-border flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border">
            <Image
              src={logoUrl}
              alt={copy.brandAnalysis.logoAlt(name)}
              width={112}
              height={112}
              unoptimized={logoUrl.startsWith("http")}
            />
          </div>
        ) : (
          <div className="min-w-0 sm:max-w-xs">
            <ErrorState code="analysis_partial" cause={copy.brandAnalysis.logoMissing} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-shell-ink text-2xl font-semibold tracking-tight">{name}</h3>
          {industry ? (
            <p className="text-shell-ink mt-1 text-sm font-medium">{industry}</p>
          ) : (
            <div className="mt-2">
              <ErrorState code="analysis_partial" cause={copy.brandAnalysis.industryMissing} />
            </div>
          )}
          {tagline ? (
            <p className="text-shell-muted mt-2 text-sm leading-6">{tagline}</p>
          ) : (
            <div className="mt-2">
              <ErrorState code="analysis_partial" cause={copy.brandAnalysis.taglineMissing} />
            </div>
          )}
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
