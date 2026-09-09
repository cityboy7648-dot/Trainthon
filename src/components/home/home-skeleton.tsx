import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="font-shell flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-3xl flex-col gap-3">
        <Skeleton className="mx-auto mb-3 h-10 w-96" />
        <Skeleton className="rounded-shell h-32" />
      </div>
    </div>
  );
}
