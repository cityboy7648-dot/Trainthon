import { Skeleton } from "@/components/ui/skeleton";
export function CampaignGallerySkeleton() {
  return (
    <div className="mx-auto w-full max-w-screen-xl space-y-8 px-6 py-10 lg:px-8" aria-busy="true">
      <div className="flex justify-between gap-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="flex gap-6 border-b pb-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-7 w-28" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-campaign-border rounded-campaign-card border p-4">
            <Skeleton className="mb-4 h-10 w-full" />
            <Skeleton className="aspect-campaign-image w-full rounded-xl" />
            <Skeleton className="mt-3 h-4 w-24" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-3 h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
