import "server-only";
import { ownedCampaign } from "@/lib/data/campaign-workspace";
import { setCampaignRunStatus, updateCampaignAsset } from "@/lib/data/campaign-assets";
import { campaignGenerationTimedOut, latestAssetsByPosition } from "@/lib/campaign-workspace";
import { AppError, campaignErrors } from "@/lib/errors";
import { brandProfileSchema, campaignPostMetaSchema, type CampaignClient } from "@/lib/types";

export async function claimSignatureGridRun(id: string) {
  const { client, run } = await ownedCampaign(id);
  if (run.campaign_key !== "signature_grid") throw new AppError("not_found", campaignErrors.result);
  if (run.status !== "pending") return null;
  const claimed = await client
    .from("runs")
    .update({ status: "processing" })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (claimed.error) throw new AppError("generation_failed", campaignErrors.save);
  if (!claimed.data) return null;
  try {
    const profile = brandProfileSchema.parse(run.brands.profile);
    const result = await client
      .from("assets")
      .select("id, meta, status")
      .eq("run_id", id)
      .eq("kind", "image");
    if (result.error || result.data?.length !== 9)
      throw new AppError("generation_failed", campaignErrors.result);
    const assets = result.data.map((asset) => ({
      ...asset,
      meta: campaignPostMetaSchema.parse(asset.meta),
    }));
    if (assets.some((asset) => asset.status !== "pending"))
      throw new AppError("generation_failed", campaignErrors.result);
    return { client, run, profile, assets };
  } catch (error) {
    await failSignatureGridRun(
      client,
      id,
      error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.plan,
    );
    throw error;
  }
}

export async function failSignatureGridRun(client: CampaignClient, id: string, cause: string) {
  const result = await client
    .from("assets")
    .select("id, meta")
    .eq("run_id", id)
    .eq("kind", "image")
    .in("status", ["pending", "processing"]);
  if (result.error) throw new AppError("generation_failed", campaignErrors.save);
  for (const asset of result.data ?? []) {
    const meta =
      asset.meta && typeof asset.meta === "object" && !Array.isArray(asset.meta) ? asset.meta : {};
    await updateCampaignAsset(client, asset.id, {
      status: "failed",
      meta: { ...meta, error: cause },
    });
  }
  await setCampaignRunStatus(client, id, "failed");
}

export async function getSignatureGridResult(runId: string) {
  const { client, run } = await ownedCampaign(runId);
  if (run.campaign_key !== "signature_grid") throw new AppError("not_found", campaignErrors.result);
  const { data: assets, error } = await client
    .from("assets")
    .select("id, status, storage_path, created_at, meta")
    .eq("run_id", runId)
    .eq("kind", "image");
  if (error) throw new AppError("network", campaignErrors.result);
  if (
    ["pending", "processing"].includes(run.status) &&
    campaignGenerationTimedOut(run.created_at, assets ?? [])
  ) {
    await failSignatureGridRun(client, runId, campaignErrors.timeout);
    run.status = "failed";
    for (const asset of assets ?? []) {
      if (asset.status === "pending" || asset.status === "processing") asset.status = "failed";
    }
  }
  const posts = await Promise.all(
    latestAssetsByPosition(
      (assets ?? []).map((asset) => ({
        ...asset,
        meta: campaignPostMetaSchema.parse(asset.meta),
      })),
    ).map(async (asset) => {
      const meta = asset.meta;
      let image_url: string | null = null;
      if (asset.status === "done" && asset.storage_path) {
        const signed = await client.storage
          .from("assets")
          .createSignedUrl(asset.storage_path, 3600);
        if (signed.error) throw new AppError("network", campaignErrors.result);
        image_url = signed.data.signedUrl;
      }
      return {
        position: meta.position,
        status: asset.status,
        image_url,
        caption: meta.caption,
        upload_order:
          typeof meta.upload_order === "number" ? meta.upload_order : 10 - meta.position,
      };
    }),
  );
  posts.sort((a, b) => a.position - b.position);
  return {
    run_id: runId,
    campaign_key: "signature_grid" as const,
    status: run.status,
    feed_preview_url: null,
    posts,
    error: posts.find((post) => post.status === "failed")
      ? campaignErrors.image
      : run.status === "failed"
        ? campaignErrors.plan
        : null,
  };
}
