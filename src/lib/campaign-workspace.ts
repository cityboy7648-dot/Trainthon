import { z } from "zod";
import { CAMPAIGN_STALE_MS } from "@/lib/campaign-timeouts";
import { AppError, campaignErrors } from "@/lib/errors";
import type { CampaignPost, CampaignPostMeta, CampaignPreviewMode } from "@/lib/types";

export function campaignGenerationTimedOut(
  runCreatedAt: string,
  assets: { status: string; created_at?: string }[],
) {
  const active = assets.filter(
    (asset) => asset.status === "pending" || asset.status === "processing",
  );
  if (!active.length) return false;
  const startedAt = active
    .map((asset) => asset.created_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  return Date.now() - Date.parse(startedAt ?? runCreatedAt) > CAMPAIGN_STALE_MS;
}

export function latestAssetsByPosition<
  T extends { id: string; created_at?: string; meta: { position?: number | null } },
>(assets: T[]): T[] {
  const ordered = [...assets].sort(
    (a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "") || a.id.localeCompare(b.id),
  );
  return [...new Map(ordered.map((asset) => [asset.meta.position ?? asset.id, asset])).values()];
}

export function campaignProgress(posts: Pick<CampaignPost, "status">[]) {
  const total = posts.length;
  const done = posts.filter((post) => post.status === "done").length;
  const failed = posts.filter((post) => post.status === "failed").length;
  return {
    total,
    done,
    failed,
    active: posts.some((post) => post.status === "pending" || post.status === "processing"),
    percent: total ? Math.floor((done / total) * 100) : 0,
  };
}

export function campaignDate(start: string, day: number): string {
  z.iso.date().parse(start);
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + day - 1);
  return date.toISOString().slice(0, 10);
}

export function signatureSlots(start: string): CampaignPostMeta[] {
  return Array.from({ length: 9 }, (_, index) => ({
    day: index + 1,
    position: 9 - index,
    format: "feed",
    caption: null,
    ...(index === 0 ? { start_date: campaignDate(start, 1) } : {}),
  }));
}

export const generatedCampaignKeys = [
  "signature_grid",
  "one_product_three_scenes",
  "complete_set",
] as const;

export function isGeneratedCampaign(key: string) {
  return (generatedCampaignKeys as readonly string[]).includes(key);
}

export function previewModes(key: string): CampaignPreviewMode[] {
  if (key === "complete_set") return ["feed", "pinterest", "carousel"];
  return key === "signature_grid" ? ["feed", "grid"] : ["feed", "story", "carousel"];
}

export function validateCampaignImage(bytes: Uint8Array, mime: string): "png" | "jpg" {
  if (!bytes.length || bytes.length > 5 * 1024 * 1024)
    throw new AppError("generation_failed", campaignErrors.upload);
  if (mime === "image/png" && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v))
    return "png";
  if (mime === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "jpg";
  throw new AppError("generation_failed", campaignErrors.upload);
}
