import { latestAssetsByPosition } from "@/lib/campaign-workspace";
import { AppError, campaignErrors } from "@/lib/errors";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import {
  campaignPostMetaSchema,
  type CampaignClient,
  type CampaignFiveAssetMeta,
  type CampaignTwoAssetMeta,
  type Campaign4ImageMeta,
  type CampaignPostMeta,
} from "@/lib/types";

export async function setCampaignRunStatus(
  client: CampaignClient,
  runId: string,
  status: "processing" | "done" | "failed",
) {
  // 재시도는 실패한 실행을 다시 processing으로 올린다. 개별 asset 상태는 되돌리지 않는다.
  const from =
    status === "processing" ? ["pending", "processing", "failed"] : ["pending", "processing"];
  const { error } = await client.from("runs").update({ status }).eq("id", runId).in("status", from);
  if (error) throw new AppError("generation_failed", campaignErrors.save);
}

export async function syncCampaignRunStatus(client: CampaignClient, runId: string) {
  const { data, error } = await client
    .from("assets")
    .select("id, status, created_at, meta")
    .eq("run_id", runId)
    .eq("kind", "image");
  if (error) throw new AppError("generation_failed", campaignErrors.save);
  const latest = latestAssetsByPosition(
    (data ?? []).map((asset) => ({
      ...asset,
      meta: { position: campaignPostMetaSchema.parse(asset.meta).position },
    })),
  );
  const status = latest.some((asset) => asset.status === "pending" || asset.status === "processing")
    ? "processing"
    : latest.length > 0 && latest.every((asset) => asset.status === "done")
      ? "done"
      : "failed";
  const { error: updateError } = await client.from("runs").update({ status }).eq("id", runId);
  if (updateError) throw new AppError("generation_failed", campaignErrors.save);
}

export async function updateCampaignAsset(
  client: CampaignClient,
  assetId: string,
  values: TablesUpdate<"assets">,
) {
  const { error } = await client
    .from("assets")
    .update(values)
    .eq("id", assetId)
    .in("status", ["pending", "processing"]);
  if (error) throw new AppError("generation_failed", campaignErrors.save);
}

export async function saveCampaignImage(
  client: CampaignClient,
  runId: string,
  assetId: string,
  image: Buffer,
  meta: CampaignTwoAssetMeta | CampaignFiveAssetMeta | Campaign4ImageMeta | CampaignPostMeta,
) {
  const path = `${runId}/${assetId}.png`;
  await updateCampaignAsset(client, assetId, { storage_path: path });
  const { error } = await client.storage
    .from("assets")
    .upload(path, image, { contentType: "image/png", upsert: false });
  if (error) throw new AppError("generation_failed", campaignErrors.save);
  await updateCampaignAsset(client, assetId, {
    status: "done",
    meta: { ...meta, completed_at: new Date().toISOString() },
    storage_path: path,
  });
}
