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
          <dd className="text-shell-muted mt-2 text-sm">
            {font_feel ?? copy.brandAnalysis.unavailable}
          </dd>
        </div>
        <div className="sm:border-l sm:pl-6">
          <dt className="text-shell-ink text-xs font-semibold">{copy.brandAnalysis.voice}</dt>
          <dd className="text-shell-muted mt-2 text-sm">
            {voice ?? copy.brandAnalysis.unavailable}
          </dd>
        </div>
        <div className="xl:border-l xl:pl-6">
          <dt className="text-shell-ink text-xs font-semibold">
            {copy.brandAnalysis.moodKeywords}
          </dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {mood_keywords.length > 0
              ? mood_keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="bg-shell-hover text-shell-ink rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {keyword}
                  </span>
                ))
              : copy.brandAnalysis.unavailable}
          </dd>
        </div>
        <div className="sm:border-l sm:pl-6">
          <dt className="text-shell-ink text-xs font-semibold">
            {copy.brandAnalysis.targetAudience}
          </dt>
          <dd className="text-shell-muted mt-2 text-sm leading-5">
            {target_audience ?? copy.brandAnalysis.unavailable}
          </dd>
        </div>
      </dl>
    </section>
  );
}
