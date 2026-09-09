import { Skeleton } from "@/components/ui/skeleton";

export function CampaignWorkspaceSkeleton() {
  return (
    <div
      className="font-shell bg-shell-background mx-auto flex h-dvh min-h-0 w-full max-w-screen-2xl flex-col gap-3 overflow-hidden px-4 py-4 sm:px-6 lg:px-8 lg:py-6"
      aria-busy="true"
    >
      <Skeleton className="mb-2 h-9 w-24 shrink-0" />
      <Skeleton className="mb-3 h-10 w-72 shrink-0" />
      <div className="grid min-h-0 flex-1 grid-rows-2 gap-5 lg:grid-cols-2 lg:grid-rows-1">
        <div className="border-shell-border rounded-campaign-card bg-background min-h-0 space-y-3 overflow-hidden border p-4 sm:p-5">
          <Skeleton className="h-9 w-full shrink-0" />
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <div className="border-shell-border rounded-campaign-card bg-background @container-size min-h-0 space-y-3 overflow-hidden border p-4 sm:p-5">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="w-campaign-preview mx-auto aspect-square max-w-full" />
          <Skeleton className="w-campaign-preview mx-auto h-10 max-w-full" />
        </div>
      </div>
    </div>
  );
}
