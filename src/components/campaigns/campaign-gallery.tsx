import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listSavedCampaigns } from "@/lib/data/campaign-workspace";
import { copy } from "@/lib/copy";
import { AppError, campaignErrors } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { isCampaignPreview } from "@/lib/env";

export async function CampaignGallery() {
  let campaigns;
  try {
    if (isCampaignPreview) {
      const { previewCampaign } = await import("@/mock/campaign-workspace"); // MOCK
      campaigns = [
        {
          ...previewCampaign,
          createdAt: previewCampaign.startDate,
          image: previewCampaign.posts[0].image_url,
        },
      ];
    } else campaigns = await listSavedCampaigns();
  } catch (error) {
    return (
      <div className="p-8">
        <ErrorState
          code={error instanceof AppError ? error.code : "network"}
          cause={error instanceof AppError ? error.cause : campaignErrors.result}
        />
      </div>
    );
  }
  return (
    <div
      data-source={isCampaignPreview ? "mock" : "server"}
      className="mx-auto max-w-screen-xl px-6 py-12 lg:px-8"
    >
      <header className="mb-10 flex items-center justify-between gap-4">
        <h1 className="text-shell-ink text-3xl font-semibold">{copy.campaigns.title}</h1>
        <Button render={<Link href="/campaigns/new" />} nativeButton={false}>
          <Plus className="size-4" />
          {copy.campaigns.newCampaign}
        </Button>
      </header>
      {campaigns.length === 0 ? (
        <EmptyState title={copy.campaignWorkspace.emptyCampaigns} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="border-shell-border rounded-campaign-card hover:border-shell-ink overflow-hidden border"
            >
              <div className="bg-shell-background aspect-campaign-image relative">
                {campaign.image && (
                  <Image
                    src={campaign.image}
                    alt={campaign.name}
                    fill
                    sizes="(max-width:767px) 90vw, 440px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-shell-ink text-lg font-semibold">{campaign.name}</h2>
                  <span className="bg-shell-background text-shell-muted rounded-full px-3 py-1 text-xs">
                    {
                      copy.campaignWorkspace.status[
                        campaign.status as keyof typeof copy.campaignWorkspace.status
                      ]
                    }
                  </span>
                </div>
                <p className="text-shell-icon mt-2 text-sm">{campaign.brand}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
