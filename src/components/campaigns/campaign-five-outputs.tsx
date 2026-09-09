import Image from "next/image";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import type { CampaignFiveOutputsProps } from "@/lib/types";

export function CampaignFiveOutputs({ result, onRetry }: CampaignFiveOutputsProps) {
  const completed = result.assets.filter((asset) => asset.status === "done").length;
  const generating = result.status === "pending" || result.status === "processing";
  return (
    <section data-source="server" className="mt-8 space-y-8">
      <div aria-live="polite">
        <h2 className="text-shell-ink text-xl font-semibold">
          {result.status === "done"
            ? copy.campaignTwo.complete
            : result.status === "failed"
              ? copy.campaignTwo.failed
              : copy.campaignFive.generating}
        </h2>
        <p className="text-shell-muted mt-2 text-sm">
          {copy.campaignTwo.progress(completed, result.assets.length)}
        </p>
      </div>
      {[1, 2, 3, 4, 5].map((day) => {
        const assets = result.assets.filter((asset) => asset.meta.day === day);
        const caption = assets.find((asset) => asset.meta.caption)?.meta.caption;
        return (
          <section
            key={day}
            aria-label={copy.campaignFive.day(day)}
            className="border-shell-border space-y-4 border-t pt-6"
          >
            <h3 className="text-shell-ink text-lg font-semibold">{copy.campaignFive.day(day)}</h3>
            <div className="grid items-start gap-4 sm:grid-cols-3">
              {assets.map((asset) => (
                <div key={asset.id} className="space-y-2">
                  <p className="text-shell-muted text-xs">
                    {copy.campaignFive.format(asset.meta.format)}
                  </p>
                  <div
                    data-pinterest={asset.meta.format === "pinterest"}
                    className="aspect-campaign-feed data-[pinterest=true]:aspect-campaign-pinterest bg-shell-background relative overflow-hidden rounded-xl"
                  >
                    {asset.status === "done" && asset.image_url ? (
                      <Image
                        src={asset.image_url}
                        alt={copy.campaignTwo.imageAlt(asset.meta.primary_product.name)}
                        fill
                        unoptimized
                        sizes="(max-width: 639px) 100vw, 240px"
                        className="object-contain"
                      />
                    ) : asset.status === "failed" || asset.status === "done" ? (
                      <ErrorState
                        code="generation_failed"
                        cause={asset.meta.error ?? undefined}
                        onRetry={onRetry}
                      />
                    ) : (
                      <Skeleton className="h-full w-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 className="text-shell-ink text-sm font-medium">{copy.campaignFive.caption}</h4>
              <p className="text-shell-muted mt-2 text-sm leading-6 whitespace-pre-wrap">
                {caption ??
                  (generating
                    ? copy.campaignFive.captionPending
                    : copy.campaignFive.captionUnavailable)}
              </p>
            </div>
          </section>
        );
      })}
      <section
        className="border-shell-border border-t pt-6"
        aria-label={copy.campaignFive.productLinks}
      >
        <h3 className="text-shell-ink text-lg font-semibold">{copy.campaignFive.productLinks}</h3>
        {result.product_links.length ? (
          <ul className="mt-4 space-y-3">
            {result.product_links.map((product) => (
              <li key={product.key} className="text-sm">
                {product.url ? (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-shell-ink underline underline-offset-4"
                  >
                    {product.name}
                  </a>
                ) : (
                  <>
                    <span className="text-shell-ink">{product.name}</span>
                    <p className="text-shell-muted mt-1 text-xs">
                      {copy.campaignFive.productLinkUnavailable}
                    </p>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-shell-muted mt-3 text-sm">
            {generating ? copy.campaignFive.linksPending : copy.campaignFive.productLinkUnavailable}
          </p>
        )}
      </section>
      {result.status === "failed" && (
        <Button variant="outline" onClick={onRetry}>
          {copy.campaignTwo.retry}
        </Button>
      )}
    </section>
  );
}
