import { Skeleton } from "@/components/ui/skeleton";

export function CampaignFiveResultSkeleton() {
  return (
    <div className="mt-8 space-y-8" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-5 w-32" />
      </div>
      {[1, 2, 3, 4, 5].map((day) => (
        <div key={day} className="border-shell-border space-y-4 border-t pt-6">
          <Skeleton className="h-6 w-12" />
          <div className="grid items-start gap-4 sm:grid-cols-3">
            {Array.from({ length: day === 1 ? 1 : day < 4 ? 2 : 3 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton
                  data-pinterest={(day === 2 || day === 3) && index === 1}
                  className="aspect-campaign-feed data-[pinterest=true]:aspect-campaign-pinterest w-full rounded-xl"
                />
              </div>
            ))}
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
