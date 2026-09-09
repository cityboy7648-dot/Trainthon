import Image from "next/image";
import { ImageOff } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { copy } from "@/lib/copy";
import { campaignErrors } from "@/lib/errors";
import type { DashboardData } from "@/lib/types";

export function DashboardRecentTasks({ recentTasks }: Pick<DashboardData, "recentTasks">) {
  if (!recentTasks.length) return <EmptyState title={copy.dashboard.emptyRecentTasks} />;
  return (
    <ul data-source="server" className="divide-shell-border divide-y">
      {recentTasks.map((task) => (
        <li key={task.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
          {task.imageUrl ? (
            <a
              href={task.imageUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={copy.dashboard.viewImage(task.title)}
              className="bg-shell-background relative size-20 shrink-0 overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <Image
                src={task.imageUrl}
                alt={task.title}
                fill
                unoptimized
                sizes="80px"
                className="object-contain"
              />
            </a>
          ) : (
            <div className="bg-shell-background text-shell-muted flex size-20 shrink-0 items-center justify-center rounded-xl">
              <ImageOff className="size-5" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium">{task.title}</p>
            <p className="text-shell-muted mt-1 text-xs">{task.campaignName}</p>
            {!task.imageUrl && (
              <div className="mt-2">
                <ErrorState code="network" cause={campaignErrors.dashboardImage} />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
