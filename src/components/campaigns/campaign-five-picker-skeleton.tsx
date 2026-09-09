import { Skeleton } from "@/components/ui/skeleton";

export function CampaignFivePickerSkeleton() {
  return (
    <div className="mt-8 border-t pt-8" aria-busy="true">
      {[0, 1].map((section) => (
        <div key={section} className="mb-8 space-y-5">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-5 w-72" />
          <div className="grid max-h-96 grid-cols-2 gap-4 overflow-hidden p-1 md:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
