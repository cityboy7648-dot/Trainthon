import { DashboardBrand } from "@/components/dashboard/dashboard-brand";
import { copy } from "@/lib/copy";

const statuses = [
  { value: "done", color: "text-shell-button", dot: "bg-shell-button" },
  { value: "processing", color: "text-shell-icon", dot: "bg-shell-icon" },
  { value: "draft", color: "text-shell-active", dot: "bg-shell-active" },
] as const;

export function Dashboard() {
  const total = 0;
  const counts = statuses.map((status) => ({
    ...status,
    count: 0,
  }));
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
          <div className="text-shell-muted flex min-h-0 flex-1 items-center justify-center px-5 text-sm">
            {copy.dashboard.emptyRecentTasks}
          </div>
        </section>
      </section>
      <aside
        aria-label={copy.dashboard.summary}
        className="bg-shell-background flex flex-col rounded-3xl p-5 lg:w-72 lg:shrink-0 xl:w-80"
      >
        <DashboardBrand />
        <section className="border-shell-border mt-5 border-t pt-5">
          <h2 className="text-sm font-medium">{copy.dashboard.progress}</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative size-28 shrink-0">
              <svg
                viewBox="0 0 120 120"
                className="size-full -rotate-90"
                role="img"
                aria-label={counts
                  .map((item) => `${copy.campaigns.statuses[item.value]} ${item.count}`)
                  .join(", ")}
              >
                {counts.map((item, index) => (
                  <circle
                    key={item.value}
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    pathLength="100"
                    strokeDasharray={`${total ? (item.count / total) * 100 : 0} ${total ? 100 - (item.count / total) * 100 : 100}`}
                    strokeDashoffset={
                      -counts
                        .slice(0, index)
                        .reduce(
                          (sum, previous) => sum + (total ? (previous.count / total) * 100 : 0),
                          0,
                        )
                    }
                    className={item.color}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <strong className="text-2xl font-semibold">{total}</strong>
                <span className="text-shell-muted text-xs">{copy.nav.campaigns}</span>
              </div>
            </div>
            <dl className="flex-1 space-y-3 text-xs">
              {counts.map((item) => (
                <div key={item.value} className="flex items-center justify-between gap-2">
                  <dt className="text-shell-muted flex items-center gap-2">
                    <span className={`size-2 rounded-full ${item.dot}`} />
                    {copy.campaigns.statuses[item.value]}
                  </dt>
                  <dd className="font-medium">{item.count}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <section className="border-shell-border mt-5 border-t pt-5">
          <h2 className="mb-3 text-sm font-medium">{copy.dashboard.completed}</h2>
          <p className="text-shell-muted text-xs">{copy.dashboard.emptyCompleted}</p>
        </section>
      </aside>
    </div>
  );
}
