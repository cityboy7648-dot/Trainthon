import { RecentListSkeleton } from "@/components/home/recent-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pt-16 pb-28">
      <div className="flex w-full max-w-3xl flex-col gap-3">
        <Skeleton className="mx-auto mb-3 h-10 w-96" />
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
        <div className="mt-12">
          <RecentListSkeleton />
        </div>
      </div>
    </div>
  );
}
