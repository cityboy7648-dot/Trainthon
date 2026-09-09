import { EditableBrandLogo } from "@/components/brand-assets/editable-brand-logo";
import { EditableBrandValue } from "@/components/brand-assets/editable-brand-value";
import { getBrandEditQuestion } from "@/lib/brand-completion";
import { copy } from "@/lib/copy";
import type { BrandSummaryProps } from "@/lib/types";

export function BrandSummary({ profile, onChange }: BrandSummaryProps) {
  return (
    <section aria-labelledby="brand-summary-title">
      <h2 id="brand-summary-title" className="text-shell-ink text-base font-semibold">
        {copy.brandAnalysis.basicInfo}
      </h2>
      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
        <EditableBrandLogo profile={profile} onChange={onChange} />
        <div className="min-w-0">
          <EditableBrandValue
            profile={profile}
            question={getBrandEditQuestion(profile, "name")!}
            value={profile.name || null}
            cause={copy.brandAnalysis.nameMissing}
            onChange={onChange}
            className="text-shell-ink text-2xl font-semibold tracking-tight"
          />
          <div className="mt-1">
            <EditableBrandValue
              profile={profile}
              question={getBrandEditQuestion(profile, "industry")!}
              value={profile.industry}
              cause={copy.brandAnalysis.industryMissing}
              onChange={onChange}
              className="text-shell-ink text-sm font-medium"
            />
          </div>
          <div className="mt-2">
            <EditableBrandValue
              profile={profile}
              question={getBrandEditQuestion(profile, "tagline")!}
              value={profile.tagline}
              cause={copy.brandAnalysis.taglineMissing}
              onChange={onChange}
              className="text-shell-muted text-sm leading-6"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
