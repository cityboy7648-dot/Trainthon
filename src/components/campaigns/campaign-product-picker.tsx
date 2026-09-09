"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { CampaignProductPickerSkeleton } from "./campaign-product-picker-skeleton";
import { CampaignTwoResult } from "./campaign-two-result";
import { loadCampaignProducts, submitCampaignTwo } from "@/lib/data/campaign-two-client";
import { readActiveBrandUrl } from "@/lib/brand-profile-session";
import { copy } from "@/lib/copy";
import type { CampaignProducts, CampaignRequestState } from "@/lib/types";

export function CampaignProductPicker() {
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
    const next = new URLSearchParams(params.toString());
    next.set("product", key);
    next.delete("run");
    setSubmission(null);
    window.history.replaceState(null, "", `${pathname}?${next}`);
  }

  async function generate() {
    if (!products || !selected || locked.current) return;
    locked.current = true;
    setPending(true);
    const result = await submitCampaignTwo({
      brand_id: products.brand_id,
      product_key: selected.key,
    });
    setSubmission(result);
    setPending(false);
    locked.current = false;
    if (result.ok) {
      const next = new URLSearchParams(params.toString());
      next.set("run", result.data.run_id);
      window.history.pushState(null, "", `${pathname}?${next}`);
    }
  }

  if (runId) return <CampaignTwoResult key={runId} runId={runId} />;
  if (!state) return <CampaignProductPickerSkeleton />;
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

  return (
    <section
      data-source="server"
      className="mt-8 border-t pt-8"
      aria-labelledby="campaign-product-question"
    >
      <h2 id="campaign-product-question" className="text-shell-ink text-xl font-semibold">
        {copy.campaignTwo.question}
      </h2>
      <p className="text-shell-muted mt-2 text-sm">{copy.campaignTwo.description}</p>
      <div
        role="group"
        aria-label={copy.campaignTwo.productList}
        className="mt-6 grid max-h-96 grid-cols-2 gap-4 overflow-y-auto overscroll-contain p-1 md:grid-cols-3"
      >
        {products.products.map(({ key, product }) => (
          <button
            type="button"
            key={key}
            disabled={pending || !product.image_url}
            aria-pressed={key === selectedKey}
            onClick={() => select(key)}
            data-selected={key === selectedKey}
            className="border-shell-border rounded-shell focus-visible:ring-shell-ink data-[selected=true]:border-shell-ink data-[selected=true]:ring-shell-ink relative overflow-hidden border text-left focus-visible:ring-2 disabled:opacity-50 data-[selected=true]:ring-2"
          >
            <div className="bg-shell-background relative aspect-square">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  unoptimized
                  sizes="(max-width: 767px) 50vw, 240px"
                  className="object-contain"
                />
              ) : (
                <ImageOff
                  className="text-shell-muted absolute inset-0 m-auto size-8"
                  aria-label={copy.campaignTwo.imageMissing}
                />
              )}
              {key === selectedKey && (
                <span className="bg-shell-button absolute top-2 right-2 rounded-full p-1 text-white">
                  <Check className="size-4" aria-label={copy.campaignTwo.selected} />
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-shell-ink line-clamp-2 text-sm font-medium">{product.name}</p>
              <p className="text-shell-muted mt-1 text-xs">
                {product.price ?? copy.brandAnalysis.unavailable}
              </p>
              {!product.image_url && (
                <p className="text-shell-muted mt-1 text-xs">{copy.campaignTwo.imageMissing}</p>
              )}
            </div>
          </button>
        ))}
      </div>
      <Button
        onClick={generate}
        disabled={!selected?.product.image_url || pending}
        className="bg-shell-button hover:bg-shell-button-hover mt-6 h-11 w-full text-white"
      >
        {pending ? copy.campaignTwo.submitting : copy.campaignTwo.generate}
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
