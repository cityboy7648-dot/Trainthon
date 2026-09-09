import { AppError, campaignErrors } from "@/lib/errors";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import type { CampaignClient, CampaignFiveAssetMeta, CampaignTwoAssetMeta } from "@/lib/types";

export async function setCampaignRunStatus(
  client: CampaignClient,
  runId: string,
  status: "processing" | "done" | "failed",
) {
  const { error } = await client
    .from("runs")
    .update({ status })
    .eq("id", runId)
    .in("status", ["pending", "processing"]);
  if (error) throw new AppError("generation_failed", campaignErrors.save);
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
  meta: CampaignTwoAssetMeta | CampaignFiveAssetMeta,
) {
  const path = `${runId}/${assetId}.png`;
  await updateCampaignAsset(client, assetId, { storage_path: path });
  const { error } = await client.storage
    .from("assets")
    .upload(path, image, { contentType: "image/png", upsert: false });
  if (error) throw new AppError("generation_failed", campaignErrors.save);
  await updateCampaignAsset(client, assetId, { status: "done", meta, storage_path: path });
}
