import { ErrorState } from "@/components/error-state";
import { copy } from "@/lib/copy";
import type { BrandPaletteProps } from "@/lib/types";

export function BrandPalette({ palette }: BrandPaletteProps) {
  return (
    <section aria-labelledby="brand-palette-title" className="lg:border-l lg:pl-10">
      <h2 id="brand-palette-title" className="text-shell-ink text-base font-semibold">
        {copy.brandAnalysis.palette}
      </h2>
      {palette.length > 0 ? (
        <ul className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-5">
          {palette.map((color) => (
            <li key={color} className="text-center">
              <svg
                viewBox="0 0 80 80"
                role="img"
                aria-label={copy.brandAnalysis.colorLabel(color)}
                className="text-shell-border mx-auto size-16 sm:size-20"
              >
                <circle cx="40" cy="40" r="38" fill={color} stroke="currentColor" />
              </svg>
              <code className="text-shell-muted mt-2 block text-xs">{color}</code>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5">
          <ErrorState code="analysis_partial" cause={copy.brandAnalysis.paletteMissing} />
        </div>
      )}
    </section>
  );
}
