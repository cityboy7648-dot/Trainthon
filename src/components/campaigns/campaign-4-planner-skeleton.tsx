import { Skeleton } from "@/components/ui/skeleton";

export function Campaign4PlannerSkeleton() {
  return (
    <div className="mt-8 space-y-4" aria-busy="true">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-11 w-40" />
    </div>
  );
}
