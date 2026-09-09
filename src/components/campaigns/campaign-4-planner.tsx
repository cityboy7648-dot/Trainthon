"use client";

import { startTransition, useActionState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Campaign4PlannerSkeleton } from "@/components/campaigns/campaign-4-planner-skeleton";
import { CampaignProductOptions } from "@/components/campaigns/campaign-product-options";
import { requestCampaign4Plan } from "@/lib/data/campaign-4-actions";
import { copy } from "@/lib/copy";
import type { Campaign4PlannerProps } from "@/lib/types";

export function Campaign4Planner({ brands }: Campaign4PlannerProps) {
  const [result, action, pending] = useActionState(requestCampaign4Plan, null);
  const params = useSearchParams();
  const pathname = usePathname();
  const selectedBrand = params.get("brandId");
  const selectedIndex = params.get("productIndex");
  const brand = brands.find((item) => item.brandId === selectedBrand);
  const product = brand?.products.find((item) => String(item.index) === selectedIndex);
  const text = copy.campaigns.realUsage;

  function selectProduct(brandId: string, index: number) {
    const next = new URLSearchParams(params.toString());
    next.set("brandId", brandId);
    next.set("productIndex", String(index));
    window.history.replaceState(null, "", `${pathname}?${next.toString()}`);
  }

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
                <CampaignProductOptions
                  products={item.products.map((entry) => ({
                    key: String(entry.index),
                    product: entry,
                  }))}
                  selectedKeys={
                    item.brandId === selectedBrand && selectedIndex ? [selectedIndex] : []
                  }
                  disabled={pending}
                  onSelect={(key) => selectProduct(item.brandId, Number(key))}
                  label={item.brandName}
                />
              </div>
            ))}
        </fieldset>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!product || pending}
            className="bg-shell-button hover:bg-shell-button-hover h-11 text-white"
          >
            {pending ? text.pending : copy.campaigns.generateAction}
          </Button>
        </div>
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
