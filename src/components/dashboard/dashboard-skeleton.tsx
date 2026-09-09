import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy";

export function DashboardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label={copy.dashboard.refreshing}
      className="font-shell text-shell-ink flex flex-1 flex-col gap-6 p-6 lg:h-dvh lg:flex-row lg:gap-8 lg:p-8"
    >
      <section className="flex min-h-0 min-w-0 flex-1 flex-col lg:py-4">
        <h1 className="text-3xl leading-tight font-medium tracking-tight xl:text-4xl">
          {copy.dashboard.headline}
          <br />
          {copy.dashboard.headlineSecond}
        </h1>
        <section className="border-shell-border mt-8 flex h-96 min-h-0 flex-col overflow-hidden rounded-2xl border lg:h-auto lg:flex-1">
          <h2 className="border-shell-border border-b px-5 py-4 text-sm font-medium">
            {copy.dashboard.recentTasks}
          </h2>
          <div className="space-y-6 overflow-hidden p-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="size-20 shrink-0 rounded-xl" />
                <div className="w-full space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
      <aside className="bg-shell-background rounded-3xl p-5 lg:w-72 lg:shrink-0 xl:w-80">
        <Skeleton className="mx-auto mt-8 size-14 rounded-xl" />
        <Skeleton className="mx-auto mt-3 h-4 w-24" />
        {[copy.dashboard.progress, copy.dashboard.completed].map((title) => (
          <section key={title} className="border-shell-border mt-5 space-y-3 border-t pt-5">
            <h2 className="text-sm font-medium">{title}</h2>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2 w-full" />
          </section>
        ))}
      </aside>
    </div>
  );
}
