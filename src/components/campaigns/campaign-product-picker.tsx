"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { CampaignProductPickerSkeleton } from "./campaign-product-picker-skeleton";
import { CampaignTwoResult } from "./campaign-two-result";
import { CampaignFiveResult } from "./campaign-five-result";
import { CampaignProductOptions } from "./campaign-product-options";
import { CampaignFivePickerSkeleton } from "./campaign-five-picker-skeleton";
import { submitCampaignFive } from "@/lib/data/campaign-five-client";
import { selectPrimaryProduct, toggleCompanionProduct } from "@/lib/campaign-five-selection";
import { loadCampaignProducts, submitCampaignTwo } from "@/lib/data/campaign-two-client";
import { readActiveBrandUrl } from "@/lib/brand-profile-session";
import { copy } from "@/lib/copy";
import type {
  CampaignProducts,
  CampaignRequestState,
  CampaignProductPickerProps,
} from "@/lib/types";

export function CampaignProductPicker({ campaignNumber }: CampaignProductPickerProps) {
  const params = useSearchParams();
  const pathname = usePathname();
  const [state, setState] = useState<CampaignRequestState<CampaignProducts> | null>(null);
  const [submission, setSubmission] = useState<CampaignRequestState<{ run_id: string }> | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const locked = useRef(false);
  const selectedKey = params.get("product");
  const runId = params.get("run");
  const products = state?.ok ? state.data : null;
  const selected = products?.products.find((item) => item.key === selectedKey);
  const companionKeys = (params.get("companions") ?? "").split(",").filter(Boolean);
  const companionProducts = products?.products.filter((item) => item.key !== selectedKey) ?? [];
  const companionsValid =
    companionKeys.length >= 1 &&
    companionKeys.length <= 10 &&
    new Set(companionKeys).size === companionKeys.length &&
    companionKeys.every((key) =>
      companionProducts.some((item) => item.key === key && item.product.image_url),
    );
  const isSet = campaignNumber === 5;

  useEffect(() => {
    let active = true;
    loadCampaignProducts(readActiveBrandUrl() ?? undefined).then((result) => {
      if (active) setState(result);
    });
    return () => {
      active = false;
    };
  }, [revision]);

  function select(key: string) {
    const next = selectPrimaryProduct(new URLSearchParams(params.toString()), key);
    setSubmission(null);
    window.history.replaceState(null, "", `${pathname}?${next}`);
  }

  async function generate() {
    if (!products || !selected?.product.image_url || locked.current || (isSet && !companionsValid))
      return;
    locked.current = true;
    setPending(true);
    const input = {
      brand_id: products.brand_id,
      product_key: selected.key,
    };
    const result = isSet
      ? await submitCampaignFive({ ...input, companion_product_keys: companionKeys })
      : await submitCampaignTwo(input);
    setSubmission(result);
    setPending(false);
    locked.current = false;
    if (result.ok) {
      const next = new URLSearchParams(params.toString());
      next.set("run", result.data.run_id);
      window.history.pushState(null, "", `${pathname}?${next}`);
    }
  }

  if (runId)
    return isSet ? (
      <CampaignFiveResult key={runId} runId={runId} />
    ) : (
      <CampaignTwoResult key={runId} runId={runId} />
    );
  if (!state) return isSet ? <CampaignFivePickerSkeleton /> : <CampaignProductPickerSkeleton />;
  if (!state.ok)
    return (
      <div className="mt-8 space-y-4">
        <ErrorState
          code={state.code}
          cause={state.cause}
          onRetry={() => {
            setState(null);
            setRevision((value) => value + 1);
          }}
        />
        {state.code === "auth" && (
          <>
            <Button onClick={() => setAuthOpen(true)}>{copy.login.title}</Button>
            <AuthDialog
              open={authOpen}
              onOpenChange={(open) => {
                setAuthOpen(open);
                if (!open) {
                  setState(null);
                  setRevision((value) => value + 1);
                }
              }}
            />
          </>
        )}
      </div>
    );
  if (!products?.products.length)
    return (
      <EmptyState
        title={copy.campaignTwo.missingTitle}
        description={copy.campaignTwo.missingDescription}
        action={<Link href="/brands">{copy.campaignTwo.brandLink}</Link>}
      />
    );
  if (isSet && products.products.filter((item) => item.product.image_url).length < 2)
    return (
      <EmptyState
        title={copy.campaignFive.insufficientTitle}
        description={copy.campaignFive.insufficientDescription}
        action={<Link href="/brands">{copy.campaignTwo.brandLink}</Link>}
      />
    );

  return (
    <section
      data-source="server"
      className="mt-8 border-t pt-8"
      aria-labelledby="campaign-product-question"
    >
      <h2 id="campaign-product-question" className="text-shell-ink text-xl font-semibold">
        {isSet ? copy.campaignFive.question : copy.campaignTwo.question}
      </h2>
      <p className="text-shell-muted mt-2 text-sm">
        {isSet ? copy.campaignFive.description : copy.campaignTwo.description}
      </p>
      <CampaignProductOptions
        products={products.products}
        selectedKeys={selectedKey ? [selectedKey] : []}
        disabled={pending}
        onSelect={select}
        label={copy.campaignTwo.productList}
      />
      {isSet && (
        <div className="mt-8 border-t pt-8">
          <h3 className="text-shell-ink text-xl font-semibold">
            {copy.campaignFive.companionQuestion}
          </h3>
          <p className="text-shell-muted mt-2 text-sm">{copy.campaignFive.companionDescription}</p>
          <p className="text-shell-muted mt-2 text-xs" aria-live="polite">
            {copy.campaignFive.companionCount(companionKeys.length)}
          </p>
          <CampaignProductOptions
            products={companionProducts}
            selectedKeys={companionKeys}
            disabled={pending || !selected?.product.image_url}
            limit={10}
            label={copy.campaignFive.companionList}
            onSelect={(key) => {
              const next = toggleCompanionProduct(new URLSearchParams(params.toString()), key);
              setSubmission(null);
              window.history.replaceState(null, "", `${pathname}?${next}`);
            }}
          />
        </div>
      )}
      <Button
        onClick={generate}
        disabled={!selected?.product.image_url || pending || (isSet && !companionsValid)}
        className="bg-shell-button hover:bg-shell-button-hover mt-6 h-11 w-full text-white"
      >
        {pending
          ? copy.campaignTwo.submitting
          : isSet
            ? copy.campaignFive.generate
            : copy.campaignTwo.generate}
      </Button>
      {submission && !submission.ok && (
        <div className="mt-4">
          <ErrorState
            code={submission.code}
            cause={submission.cause}
            onRetry={() => {
              setState(null);
              setRevision((value) => value + 1);
            }}
          />
        </div>
      )}
    </section>
  );
}
