import { Skeleton } from "@/components/ui/skeleton";

export function CampaignSelectionSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-campaign-card overflow-hidden border">
          <Skeleton className="aspect-campaign-image w-full rounded-none" />
          <div className="px-3.5 pt-1 pb-4">
            <Skeleton className="mt-1 h-5 w-3/4" />
            <Skeleton className="mt-2 h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
