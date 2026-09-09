import { DashboardBrand } from "@/components/dashboard/dashboard-brand";
import { DashboardRecentTasks } from "@/components/dashboard/dashboard-recent-tasks";
import { DashboardCampaignList } from "@/components/dashboard/dashboard-campaign-list";
import { DashboardRefresh } from "@/components/dashboard/dashboard-refresh";
import { ErrorState } from "@/components/error-state";
import { getDashboardData } from "@/lib/data/dashboard";
import { copy } from "@/lib/copy";

export async function Dashboard() {
  const state = await getDashboardData();
  return (
    <div
      data-source="server"
      className="font-shell text-shell-ink flex flex-1 flex-col gap-6 p-6 lg:h-dvh lg:flex-row lg:gap-8 lg:p-8"
    >
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
          <div className="border-shell-border flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
            <h2 id="recent-tasks-title" className="text-sm font-medium">
              {copy.dashboard.recentTasks}
            </h2>
            <DashboardRefresh />
          </div>
          <div className="min-h-0 overflow-y-auto p-5">
            {state.ok ? (
              <DashboardRecentTasks recentTasks={state.data.recentTasks} />
            ) : (
              <ErrorState code={state.code} cause={state.cause} />
            )}
          </div>
        </section>
      </section>
      <aside
        aria-label={copy.dashboard.summary}
        className="bg-shell-background flex flex-col rounded-3xl p-5 lg:w-72 lg:shrink-0 xl:w-80"
      >
        <DashboardBrand />
        <p className="text-shell-muted mt-4 text-center text-xs">
          {copy.dashboard.completionBasis}
        </p>
        <section className="border-shell-border mt-5 border-t pt-5">
          <h2 className="mb-3 text-sm font-medium">{copy.dashboard.progress}</h2>
          {state.ok ? (
            <DashboardCampaignList campaigns={state.data.campaigns} completed={false} />
          ) : (
            <ErrorState code={state.code} cause={state.cause} />
          )}
        </section>
        <section className="border-shell-border mt-5 border-t pt-5">
          <h2 className="mb-3 text-sm font-medium">{copy.dashboard.completed}</h2>
          {state.ok ? (
            <DashboardCampaignList campaigns={state.data.campaigns} completed />
          ) : (
            <ErrorState code={state.code} cause={state.cause} />
          )}
        </section>
      </aside>
    </div>
  );
}
