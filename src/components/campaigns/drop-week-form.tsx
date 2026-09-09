"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { startDropWeek } from "@/lib/data/campaign-3-actions";
import { copy } from "@/lib/copy";
import type { Campaign3FormProps } from "@/lib/types";
import type { ErrorCode } from "@/lib/errors";

export function DropWeekForm({ brands }: Campaign3FormProps) {
  const router = useRouter();
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [error, setError] = useState<{ code: ErrorCode; cause?: string }>();
  const [pending, startTransition] = useTransition();
  const brand = brands.find((item) => item.id === brandId);
  const text = copy.campaigns.dropWeek;
  return (
    <form
      data-source="server"
      className="space-y-6"
      action={(form) => {
        setError(undefined);
        startTransition(async () => {
          try {
            const result = await startDropWeek({
              brandId,
              productIndex: Number(form.get("productIndex")),
              launchDate: form.get("launchDate"),
            });
            if (!result.ok) setError(result);
            else router.push(`/campaigns/3?runId=${result.data.runId}`);
          } catch {
            setError({ code: "network" });
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="drop-brand">{text.brand}</Label>
        <select
          id="drop-brand"
          value={brandId}
          onChange={(event) => setBrandId(event.target.value)}
          disabled={pending}
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
        >
          {brands.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="drop-product">{text.product}</Label>
        <select
          key={brandId}
          id="drop-product"
          name="productIndex"
          required
          defaultValue=""
          disabled={pending}
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
        >
          <option value="" disabled>
            {text.choose}
          </option>
          {brand?.products.map((product, index) =>
            product.image_url && /^(https:\/\/|data:image\/)/.test(product.image_url) ? (
              <option key={index} value={index}>
                {product.name}
              </option>
            ) : null,
          )}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="drop-date">{text.launchDate}</Label>
        <Input id="drop-date" name="launchDate" type="date" required disabled={pending} />
      </div>
      {error && <ErrorState {...error} />}
      {pending && (
        <div role="status" className="space-y-3">
          <p className="text-sm">{text.planning}</p>
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      <Button type="submit" disabled={pending || !brandId}>
        {text.start}
      </Button>
    </form>
  );
}
