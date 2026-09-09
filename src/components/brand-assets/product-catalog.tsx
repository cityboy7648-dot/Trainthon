import Image from "next/image";
import { ImageOff } from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { copy } from "@/lib/copy";
import type { ProductCatalogProps } from "@/lib/types";

export function ProductCatalog({ products }: ProductCatalogProps) {
  return (
    <section aria-labelledby="product-catalog-title" className="py-7">
      <div className="flex items-baseline gap-2">
        <h2 id="product-catalog-title" className="text-shell-ink text-base font-semibold">
          {copy.brandAnalysis.products}
        </h2>
        <span className="text-shell-muted text-xs">
          {copy.brandAnalysis.productCount(products.length)}
        </span>
      </div>
      {products.length === 0 ? (
        <div className="mt-5">
          <ErrorState code="analysis_partial" cause={copy.brandAnalysis.productsMissing} />
        </div>
      ) : (
        <ul className="mt-5 grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <li key={product.name}>
              <div className="bg-shell-background border-shell-border rounded-shell relative aspect-video overflow-hidden border">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={copy.brandAnalysis.productImageAlt(product.name)}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    unoptimized={product.image_url.startsWith("http")}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ImageOff
                      className="text-shell-icon size-6"
                      aria-label={copy.brandAnalysis.unavailable}
                    />
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-shell-ink text-sm font-semibold">{product.name}</h3>
                  <p className="text-shell-muted mt-1 line-clamp-2 text-xs leading-5">
                    {product.description ?? copy.brandAnalysis.unavailable}
                  </p>
                </div>
                <p className="text-shell-ink shrink-0 text-sm font-semibold">
                  {product.price ?? copy.brandAnalysis.unavailable}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
