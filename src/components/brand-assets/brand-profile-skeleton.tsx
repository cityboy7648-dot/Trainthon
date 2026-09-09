import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy";
import { isPreviewAnalysis } from "@/lib/env";

const PRODUCT_SKELETON_COUNT = 12;

export function BrandProfileSkeleton() {
  return (
    <div
      data-source={isPreviewAnalysis ? "server" : "mock"}
      className="font-shell mx-auto w-full max-w-7xl px-6 py-8 lg:px-10"
    >
      <header className="flex items-start justify-between gap-5">
        <div>
          <Skeleton className="h-4 w-44" />
          <Skeleton className="mt-4 h-9 w-72" />
          <div className="mt-3">
            <p className="text-shell-ink text-sm font-medium">{copy.brandAnalysis.loadingTitle}</p>
            <p className="text-shell-muted mt-1 text-xs">{copy.brandAnalysis.loadingDescription}</p>
          </div>
        </div>
        <Skeleton className="rounded-shell h-9 w-32" />
      </header>

      <div className="mt-9 grid gap-8 border-b pb-8 lg:grid-cols-2 lg:gap-10">
        <section>
          <Skeleton className="h-5 w-20" />
          <div className="mt-5 flex items-center gap-6">
            <Skeleton className="size-28 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="mt-3 h-4 w-24" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-3 h-4 w-48" />
            </div>
          </div>
        </section>
        <section className="lg:border-l lg:pl-10">
          <Skeleton className="h-5 w-24" />
          <div className="mt-5 grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index}>
                <Skeleton className="mx-auto size-16 rounded-full sm:size-20" />
                <Skeleton className="mx-auto mt-2 h-3 w-12" />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="border-b py-7">
        <Skeleton className="h-5 w-28" />
        <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-4 w-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="py-7">
        <Skeleton className="h-5 w-40" />
        <div className="mt-5 grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: PRODUCT_SKELETON_COUNT }, (_, index) => (
            <div key={index}>
              <Skeleton className="rounded-shell aspect-video" />
              <Skeleton className="mt-3 h-4 w-28" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
