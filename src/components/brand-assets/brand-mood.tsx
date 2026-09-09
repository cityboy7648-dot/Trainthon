import { EditableBrandValue } from "@/components/brand-assets/editable-brand-value";
import { BrandMoodKeyword } from "@/components/brand-assets/brand-mood-keyword";
import { getBrandEditQuestion } from "@/lib/brand-completion";
import { copy } from "@/lib/copy";
import type { BrandMoodProps } from "@/lib/types";

export function BrandMood({ profile, onChange }: BrandMoodProps) {
  const { font_feel, voice, mood_keywords, target_audience } = profile;
  return (
    <section aria-labelledby="brand-mood-title" className="border-b py-7">
      <h2 id="brand-mood-title" className="text-shell-ink text-base font-semibold">
        {copy.brandAnalysis.mood}
      </h2>
      <dl className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-shell-ink text-xs font-semibold">{copy.brandAnalysis.fontFeel}</dt>
          <dd className="mt-2">
            <EditableBrandValue
              profile={profile}
              question={getBrandEditQuestion(profile, "font_feel")!}
              value={font_feel}
              cause={copy.brandAnalysis.fontFeelMissing}
              onChange={onChange}
              className="text-shell-muted text-sm"
            />
          </dd>
        </div>
        <div className="sm:border-l sm:pl-6">
          <dt className="text-shell-ink text-xs font-semibold">{copy.brandAnalysis.voice}</dt>
          <dd className="mt-2">
            <EditableBrandValue
              profile={profile}
              question={getBrandEditQuestion(profile, "voice")!}
              value={voice}
              cause={copy.brandAnalysis.voiceMissing}
              onChange={onChange}
              className="text-shell-muted text-sm"
            />
          </dd>
        </div>
        <div className="xl:border-l xl:pl-6">
          <dt className="text-shell-ink text-xs font-semibold">
            {copy.brandAnalysis.moodKeywords}
          </dt>
          <dd className="mt-2">
            {mood_keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mood_keywords.map((keyword, index) => (
                  <BrandMoodKeyword
                    key={`${keyword}-${index}`}
                    profile={profile}
                    index={index}
                    onChange={onChange}
                  />
                ))}
              </div>
            ) : (
              <EditableBrandValue
                profile={profile}
                question={getBrandEditQuestion(profile, "mood_keywords")!}
                value={null}
                cause={copy.brandAnalysis.moodKeywordsMissing}
                onChange={onChange}
              />
            )}
          </dd>
        </div>
        <div className="sm:border-l sm:pl-6">
          <dt className="text-shell-ink text-xs font-semibold">
            {copy.brandAnalysis.targetAudience}
          </dt>
          <dd className="mt-2">
            <EditableBrandValue
              profile={profile}
              question={getBrandEditQuestion(profile, "target_audience")!}
              value={target_audience}
              cause={copy.brandAnalysis.audienceMissing}
              onChange={onChange}
              className="text-shell-muted text-sm leading-5"
            />
          </dd>
        </div>
      </dl>
    </section>
  );
}
