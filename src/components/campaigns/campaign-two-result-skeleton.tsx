import { Skeleton } from "@/components/ui/skeleton";

export function CampaignTwoResultSkeleton() {
  return (
    <div className="mt-8 space-y-6" aria-busy="true">
      <Skeleton className="h-7 w-64" />
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton
              data-story={[2, 4, 6].includes(index)}
              className="aspect-campaign-feed data-[story=true]:aspect-campaign-story w-full rounded-xl"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
