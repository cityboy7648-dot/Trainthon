import { Skeleton } from "@/components/ui/skeleton";

export function CampaignProductPickerSkeleton() {
  return (
    <div className="mt-8 space-y-5" aria-busy="true">
      <Skeleton className="h-7 w-64" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
