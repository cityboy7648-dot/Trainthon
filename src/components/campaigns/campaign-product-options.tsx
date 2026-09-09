import Image from "next/image";
import { Check, ImageOff } from "lucide-react";
import { copy } from "@/lib/copy";
import type { CampaignProductOptionsProps } from "@/lib/types";

export function CampaignProductOptions({
  products,
  selectedKeys,
  disabled,
  onSelect,
  label,
  limit,
}: CampaignProductOptionsProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="mt-6 grid max-h-96 grid-cols-2 gap-4 overflow-y-auto overscroll-contain p-1 md:grid-cols-3"
    >
      {products.map(({ key, product }) => {
        const selected = selectedKeys.includes(key);
        return (
          <button
            type="button"
            key={key}
            disabled={
              disabled ||
              !product.image_url ||
              (!selected && limit !== undefined && selectedKeys.length >= limit)
            }
            aria-pressed={selected}
            onClick={() => onSelect(key)}
            data-selected={selected}
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
              {selected && (
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
        );
      })}
    </div>
  );
}
