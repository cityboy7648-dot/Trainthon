import Link from "next/link";
import { Plus } from "lucide-react";
import { CampaignGalleryCards } from "@/components/campaigns/campaign-gallery-cards";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import type { CampaignGalleryProps, CampaignStatus } from "@/lib/types";

const statusTabs: { value: CampaignStatus; label: string }[] = [
  { value: "processing", label: copy.campaigns.statuses.processing },
  { value: "done", label: copy.campaigns.statuses.done },
  { value: "draft", label: copy.campaigns.statuses.draft },
];

export function CampaignGallery({ status, campaigns, counts }: CampaignGalleryProps) {
  return (
    <div className="font-shell max-w-campaign-content pt-campaign-top mx-auto w-full px-6 pb-20 md:px-0">
      <header className="flex items-center justify-between gap-5">
        <h1 className="text-shell-ink text-2xl leading-9 font-semibold tracking-tight">
          {copy.campaigns.galleryTitle}
        </h1>
        <Button
          render={<Link href="/campaigns/new" />}
          nativeButton={false}
          className="bg-shell-button hover:bg-shell-button-hover rounded-shell gap-2 text-white"
        >
          <Plus className="size-4" aria-hidden="true" />
          {copy.campaigns.newCampaign}
        </Button>
      </header>

      <nav
        aria-label={copy.campaigns.statusNavigation}
        className="border-shell-border mt-9 border-b"
      >
        <ul className="flex gap-7">
          {statusTabs.map((tab) => (
            <li key={tab.value}>
              <Link
                href={`/campaigns?status=${tab.value}`}
                aria-current={status === tab.value ? "page" : undefined}
                className="text-shell-muted hover:text-shell-ink aria-[current=page]:border-shell-button aria-[current=page]:text-shell-ink inline-flex h-10 items-start gap-2 border-b-2 border-transparent text-sm font-medium aria-[current=page]:font-semibold"
              >
                {tab.label}
                <span className="bg-shell-hover rounded-full px-2 py-0.5 text-xs">
                  {counts[tab.value]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-5">
        {campaigns.length > 0 ? (
          <CampaignGalleryCards campaigns={campaigns} />
        ) : (
          <EmptyState
            title={copy.campaigns.statusEmptyTitle}
            description={copy.campaigns.statusEmptyDescription}
          />
        )}
      </div>
    </div>
  );
}
