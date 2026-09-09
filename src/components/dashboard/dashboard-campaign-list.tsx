import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { copy } from "@/lib/copy";
import type { DashboardCampaignListProps } from "@/lib/types";

export function DashboardCampaignList({ campaigns, completed }: DashboardCampaignListProps) {
  const visible = campaigns.filter(
    (campaign) =>
      (campaign.completedTasks === campaign.totalTasks && campaign.totalTasks > 0) === completed,
  );
  if (!visible.length)
    return (
      <EmptyState
        title={completed ? copy.dashboard.emptyCompleted : copy.dashboard.emptyProgress}
      />
    );
  return (
    <ul data-source="server" className="max-h-64 space-y-5 overflow-y-auto">
      {visible.map((campaign) => (
        <li key={campaign.id} className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            {completed && (
              <CircleCheck className="text-shell-muted size-4 shrink-0" aria-hidden="true" />
            )}
            {campaign.href ? (
              <Link href={campaign.href} className="hover:underline">
                {campaign.name}
              </Link>
            ) : (
              <span>{campaign.name}</span>
            )}
          </div>
          <p className="text-shell-muted text-xs">
            {copy.dashboard.taskProgress(campaign.completedTasks, campaign.totalTasks)}
          </p>
          {!completed && (
            <>
              <progress
                value={campaign.completedTasks}
                max={campaign.totalTasks}
                aria-label={copy.dashboard.taskProgress(
                  campaign.completedTasks,
                  campaign.totalTasks,
                )}
                className="accent-shell-ink h-2 w-full"
              />
              {campaign.failed && <ErrorState code="generation_failed" />}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
