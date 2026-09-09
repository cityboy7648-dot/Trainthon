import { ErrorState } from "@/components/error-state";
import { copy } from "@/lib/copy";
import type { BrandMoodProps } from "@/lib/types";

export function BrandMood({ font_feel, voice, mood_keywords, target_audience }: BrandMoodProps) {
  return (
    <section aria-labelledby="brand-mood-title" className="border-b py-7">
      <h2 id="brand-mood-title" className="text-shell-ink text-base font-semibold">
        {copy.brandAnalysis.mood}
      </h2>
      <dl className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-shell-ink text-xs font-semibold">{copy.brandAnalysis.fontFeel}</dt>
          <dd className="mt-2">
            {font_feel ? (
              <p className="text-shell-muted text-sm">{font_feel}</p>
            ) : (
              <ErrorState code="analysis_partial" cause={copy.brandAnalysis.fontFeelMissing} />
            )}
          </dd>
        </div>
        <div className="sm:border-l sm:pl-6">
          <dt className="text-shell-ink text-xs font-semibold">{copy.brandAnalysis.voice}</dt>
          <dd className="mt-2">
            {voice ? (
              <p className="text-shell-muted text-sm">{voice}</p>
            ) : (
              <ErrorState code="analysis_partial" cause={copy.brandAnalysis.voiceMissing} />
            )}
          </dd>
        </div>
        <div className="xl:border-l xl:pl-6">
          <dt className="text-shell-ink text-xs font-semibold">
            {copy.brandAnalysis.moodKeywords}
          </dt>
          <dd className="mt-2">
            {mood_keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mood_keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="bg-shell-hover text-shell-ink rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <ErrorState code="analysis_partial" cause={copy.brandAnalysis.moodKeywordsMissing} />
            )}
          </dd>
        </div>
        <div className="sm:border-l sm:pl-6">
          <dt className="text-shell-ink text-xs font-semibold">
            {copy.brandAnalysis.targetAudience}
          </dt>
          <dd className="mt-2">
            {target_audience ? (
              <p className="text-shell-muted text-sm leading-5">{target_audience}</p>
            ) : (
              <ErrorState code="analysis_partial" cause={copy.brandAnalysis.audienceMissing} />
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
