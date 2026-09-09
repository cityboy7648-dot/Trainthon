import { Skeleton } from "@/components/ui/skeleton";
export function CampaignGallerySkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl space-y-10 px-8 py-12" aria-busy="true">
      <Skeleton className="h-10 w-52" />
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-80 w-full" />
        ))}
      </div>
    </div>
  );
}
