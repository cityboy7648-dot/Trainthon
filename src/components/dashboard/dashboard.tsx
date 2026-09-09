import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Check, Layers } from "lucide-react";
import { DashboardBrand } from "@/components/dashboard/dashboard-brand";
import { copy } from "@/lib/copy";
import { mockCreatedCampaigns, mockRecentTasks } from "@/mock/campaigns"; // MOCK

const statuses = [
  { value: "done", color: "text-shell-button", dot: "bg-shell-button" },
  { value: "processing", color: "text-shell-icon", dot: "bg-shell-icon" },
  { value: "draft", color: "text-shell-active", dot: "bg-shell-active" },
] as const;

export function Dashboard() {
  const completed = mockCreatedCampaigns.filter((item) => item.status === "done");
  const total = mockCreatedCampaigns.length;
  const counts = statuses.map((status) => ({
    ...status,
    count: mockCreatedCampaigns.filter((item) => item.status === status.value).length,
  }));
  return (
    <div
      data-source="mock"
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
          <h2
            id="recent-tasks-title"
            className="border-shell-border shrink-0 border-b px-5 py-4 text-sm font-medium"
          >
            {copy.dashboard.recentTasks}
          </h2>
          <ul className="divide-shell-border min-h-0 flex-1 divide-y overflow-y-auto">
            {mockRecentTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href="/campaigns?status=done"
                  className="hover:bg-shell-hover flex min-w-0 items-center gap-4 px-5 py-4"
                >
                  <Image
                    src={task.campaignImage}
                    alt={copy.campaigns.imageAlt(task.campaignName)}
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium">{task.purpose}</h3>
                    <p className="text-shell-muted mt-1 truncate text-xs">{task.campaignName}</p>
                  </div>
                  <div className="text-shell-muted hidden shrink-0 text-right text-xs xl:block">
                    <p>{task.format}</p>
                    <p className="mt-1">{task.channel}</p>
                  </div>
                  <Check
                    className="text-shell-muted size-4 shrink-0"
                    aria-label={copy.campaigns.statuses.done}
                  />
                </Link>
              </li>
            ))}
          </ul>
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
          <div className="grid gap-2">
            {completed.map(({ id, campaign }) => (
              <Link
                key={id}
                href="/campaigns?status=done"
                className="bg-background hover:bg-shell-active flex items-center gap-3 rounded-xl p-3"
              >
                <span className="bg-shell-hover flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <Layers className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xs font-medium">{campaign.name}</h3>
                  <p className="text-shell-muted mt-1 truncate text-xs">
                    {campaign.channels.join(" · ")}
                  </p>
                </div>
                <ArrowUpRight className="text-shell-muted size-3.5 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
