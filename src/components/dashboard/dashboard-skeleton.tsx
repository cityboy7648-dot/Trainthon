import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy";

export function DashboardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label={copy.dashboard.refreshing}
      className="font-shell text-shell-ink flex h-dvh min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6 lg:flex-row lg:gap-8 lg:p-8"
    >
      <section className="flex min-h-0 min-w-0 flex-1 flex-col lg:py-4">
        <h1 className="shrink-0 text-3xl leading-tight font-medium tracking-tight xl:text-4xl">
          {copy.dashboard.headline}
          <br />
          {copy.dashboard.headlineSecond}
        </h1>
        <section className="border-shell-border mt-8 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border">
          <h2 className="border-shell-border shrink-0 border-b px-5 py-4 text-sm font-medium">
            {copy.dashboard.recentTasks}
          </h2>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
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
      <aside className="bg-shell-background flex max-h-96 min-h-0 shrink-0 flex-col overflow-y-auto rounded-3xl p-5 lg:h-full lg:max-h-none lg:w-72 xl:w-80">
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
