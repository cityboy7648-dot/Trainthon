import { Skeleton } from "@/components/ui/skeleton";

export function RecentListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <Skeleton className="h-6 w-14" />
      </div>
      <ul className="flex flex-col">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="flex h-9 items-center gap-3 px-2">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </li>
        ))}
      </ul>
    </div>
  );
}
