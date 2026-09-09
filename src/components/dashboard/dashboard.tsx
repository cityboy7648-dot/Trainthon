import { DashboardBrand } from "@/components/dashboard/dashboard-brand";
import { EmptyState } from "@/components/empty-state";
import { copy } from "@/lib/copy";

export function Dashboard() {
  return (
    <div className="font-shell text-shell-ink flex flex-1 flex-col gap-6 p-6 lg:h-dvh lg:flex-row lg:gap-8 lg:p-8">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col lg:py-4">
        <h1 className="text-3xl leading-tight font-medium tracking-tight xl:text-4xl">
          {copy.dashboard.headline}
          <br />
          {copy.dashboard.headlineSecond}
        </h1>
        <section
          aria-labelledby="recent-tasks-title"
          className="border-shell-border mt-8 flex h-96 min-h-0 flex-col overflow-hidden rounded-2xl border lg:h-auto lg:flex-1"
        >
          <h2
            id="recent-tasks-title"
            className="border-shell-border shrink-0 border-b px-5 py-4 text-sm font-medium"
          >
            {copy.dashboard.recentTasks}
          </h2>
          <div className="p-5">
            <EmptyState title={copy.dashboard.historyPending} />
          </div>
        </section>
      </section>
      <aside
        aria-label={copy.dashboard.summary}
        className="bg-shell-background flex flex-col rounded-3xl p-5 lg:w-72 lg:shrink-0 xl:w-80"
      >
        <DashboardBrand />
        <section className="border-shell-border mt-5 border-t pt-5">
          <h2 className="mb-3 text-sm font-medium">{copy.dashboard.progress}</h2>
          <EmptyState title={copy.dashboard.historyPending} />
        </section>
        <section className="border-shell-border mt-5 border-t pt-5">
          <h2 className="mb-3 text-sm font-medium">{copy.dashboard.completed}</h2>
          <EmptyState title={copy.dashboard.historyPending} />
        </section>
      </aside>
    </div>
  );
}
