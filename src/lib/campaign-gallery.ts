import { z } from "zod";
import { campaigns } from "@/definitions/campaigns";
import { campaignDate, latestAssetsByPosition } from "@/lib/campaign-workspace";
import type { CampaignGalleryRun, SavedCampaignCard } from "@/lib/types";

export function toCampaignGalleryCard(run: CampaignGalleryRun): SavedCampaignCard {
  const definition = campaigns.find((item) => item.key === run.campaign_key);
  const profile = z.object({ name: z.string() }).parse(run.brands.profile);
  const images = latestAssetsByPosition(
    run.assets
      .filter((asset) => asset.kind === "image")
      .map((asset, index) => ({
        id: asset.id ?? String(index),
        created_at: asset.created_at,
        status: asset.status,
        meta:
          asset.meta && typeof asset.meta === "object" && !Array.isArray(asset.meta)
            ? asset.meta
            : {},
      })),
  );
  const start = images
    .map((asset) => z.object({ start_date: z.iso.date() }).safeParse(asset.meta))
    .find((value) => value.success)?.data?.start_date;
  return {
    id: run.id,
    key: run.campaign_key,
    name: definition?.name ?? run.campaign_key,
    brand: profile.name,
    status: run.status,
    createdAt: run.created_at,
    image: definition?.image ?? null,
    channels: [...new Set(definition?.schedule.flatMap((day) => day.channel.split(" · ")) ?? [])],
    endDate: definition
      ? campaignDate(start ?? run.created_at.slice(0, 10), definition.duration_days)
      : null,
    total: images.length,
    completed: images.filter((asset) => asset.status === "done").length,
    failed: images.filter((asset) => asset.status === "failed").length,
  };
}

export function filterCampaignGallery(campaigns: SavedCampaignCard[], params: URLSearchParams) {
  const done = params.get("status") === "done";
  const query = (params.get("q") ?? "").trim().toLocaleLowerCase();
  const channel = params.get("channel");
  const from = params.get("from");
  const to = params.get("to");
  return campaigns
    .filter(
      (campaign) =>
        (campaign.status === "done") === done &&
        (!channel || campaign.channels.includes(channel)) &&
        [campaign.name, campaign.brand, ...campaign.channels]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query) &&
        (!from || Boolean(campaign.endDate && campaign.endDate >= from)) &&
        (!to || Boolean(campaign.endDate && campaign.endDate <= to)) &&
        !(from && to && from > to),
    )
    .sort((a, b) =>
      params.get("sort") === "name"
        ? a.name.localeCompare(b.name, "ko")
        : params.get("sort") === "deadline"
          ? (a.endDate ?? "9999").localeCompare(b.endDate ?? "9999")
          : b.createdAt.localeCompare(a.createdAt),
    );
}
