"use client";

import { startTransition, useActionState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Campaign4PlannerSkeleton } from "@/components/campaigns/campaign-4-planner-skeleton";
import { requestCampaign4Images } from "@/lib/data/campaign-4-actions";
import { Campaign4Result } from "@/components/campaigns/campaign-4-result";
import { copy } from "@/lib/copy";
import type { Campaign4PlannerProps } from "@/lib/types";

export function Campaign4Planner({ brands }: Campaign4PlannerProps) {
  const [result, action, pending] = useActionState(requestCampaign4Images, null);
  const params = useSearchParams();
  const pathname = usePathname();
  const selectedBrand = params.get("brandId");
  const selectedIndex = params.get("productIndex");
  const brand = brands.find((item) => item.brandId === selectedBrand);
  const product = brand?.products.find((item) => String(item.index) === selectedIndex);
  const text = copy.campaigns.realUsage;
  const runId = params.get("run");

  useEffect(() => {
    if (!result?.ok) return;
    const next = new URLSearchParams(window.location.search);
    next.set("run", result.runId);
    window.history.pushState(null, "", `${pathname}?${next}`);
  }, [result, pathname]);

  function selectProduct(brandId: string, index: number) {
    const next = new URLSearchParams(params.toString());
    next.set("brandId", brandId);
    next.set("productIndex", String(index));
    window.history.replaceState(null, "", `${pathname}?${next.toString()}`);
  }

  if (runId) return <Campaign4Result key={runId} runId={runId} />;

  if (!brands.some((item) => item.products.length > 0)) {
    return (
      <section data-source="server" className="mt-8">
        <EmptyState
          title={text.emptyTitle}
          description={text.emptyDescription}
          action={
            <Link href="/brands" className="underline">
              {text.brandLink}
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section data-source="server" className="mt-10 border-t pt-8">
      <h2 className="text-shell-ink text-xl font-semibold">{text.title}</h2>
      <p className="text-shell-muted mt-2 text-sm leading-6">{text.description}</p>
      <form action={action} className="mt-6 space-y-5">
        <input type="hidden" name="brandId" value={brand?.brandId ?? ""} />
        <input type="hidden" name="productIndex" value={product?.index ?? ""} />
        <fieldset disabled={pending} className="max-h-80 space-y-5 overflow-y-auto">
          <legend className="sr-only">{text.title}</legend>
          {brands
            .filter((item) => item.products.length > 0)
            .map((item) => (
              <div key={item.brandId}>
                <h3 className="text-shell-ink mb-2 text-sm font-semibold">{item.brandName}</h3>
                <div className="divide-shell-border divide-y">
                  {item.products.map((entry) => (
                    <label
                      key={entry.index}
                      className="hover:bg-shell-hover flex cursor-pointer items-start gap-3 px-2 py-3"
                    >
                      <input
                        type="radio"
                        name="productSelection"
                        className="mt-1"
                        checked={
                          item.brandId === selectedBrand && String(entry.index) === selectedIndex
                        }
                        onChange={() => selectProduct(item.brandId, entry.index)}
                      />
                      <span>
                        <span className="text-shell-ink block text-sm font-medium">
                          {entry.name}
                        </span>
                        {entry.description && (
                          <span className="text-shell-muted mt-1 block text-xs leading-5">
                            {entry.description}
                          </span>
                        )}
                        {entry.price && (
                          <span className="text-shell-muted mt-1 block text-xs">{entry.price}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </fieldset>
        <Button
          type="submit"
          disabled={!product || pending}
          className="bg-shell-button hover:bg-shell-button-hover h-11 text-white"
        >
          {pending ? text.pending : text.submit}
        </Button>
      </form>
      <div aria-live="polite" className="mt-6">
        {pending && (
          <>
            <p className="text-shell-muted text-sm">{text.pending}</p>
            <Campaign4PlannerSkeleton />
          </>
        )}
        {!pending && result && !result.ok && (
          <ErrorState
            code={result.code}
            cause={result.cause}
            onRetry={
              product && brand
                ? () => {
                    const data = new FormData();
                    data.set("brandId", brand.brandId);
                    data.set("productIndex", String(product.index));
                    startTransition(() => action(data));
                  }
                : undefined
            }
          />
        )}
      </div>
    </section>
  );
}
