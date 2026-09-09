import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy";

export function Campaign4ResultSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label={copy.campaigns.realUsage.generating}
      className="mt-8 space-y-6"
    >
      <Skeleton className="h-6 w-64" />
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="aspect-campaign-feed w-full rounded-xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  );
}
