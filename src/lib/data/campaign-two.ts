import { campaignGenerationTimedOut, latestAssetsByPosition } from "@/lib/campaign-workspace";
import { campaignProductKey, resolveCampaignProduct } from "@/lib/campaign-product";
import { AppError, campaignErrors } from "@/lib/errors";
import { createSessionWriter } from "@/lib/supabase/server";
import {
  brandProfileSchema,
  campaignTwoAssetMetaSchema,
  campaignTwoResultSchema,
  type CampaignClient,
  type CampaignProducts,
  type CampaignTwoRequest,
} from "@/lib/types";
import {
  saveCampaignImage,
  setCampaignRunStatus,
  updateCampaignAsset,
} from "@/lib/data/campaign-assets";

export async function getCampaignProducts(sourceUrl?: string): Promise<CampaignProducts> {
  const client = await createSessionWriter();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new AppError("auth", campaignErrors.login);
  let query = client.from("brands").select("id, profile").eq("user_id", user.id);
  if (sourceUrl) query = query.eq("source_url", sourceUrl);
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new AppError("network", campaignErrors.products);
  if (!data) return null;
  const profile = brandProfileSchema.parse(data.profile);
  return {
    brand_id: data.id,
    products: profile.products.map((product) => ({
      key: campaignProductKey(product),
      product,
    })),
  };
}

export async function createCampaignTwoRun(input: CampaignTwoRequest) {
  const client = await createSessionWriter();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new AppError("auth", campaignErrors.login);
  const { data: brand, error } = await client
    .from("brands")
    .select("id, profile")
    .eq("id", input.brand_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new AppError("network", campaignErrors.brand);
  if (!brand) throw new AppError("not_found", campaignErrors.brand);
  const profile = brandProfileSchema.parse(brand.profile);
  const product = resolveCampaignProduct(profile, input.product_key);
  const recent = await client
    .from("runs")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brand.id)
    .eq("campaign_key", "one_product_three_scenes")
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());
  if (recent.error) throw new AppError("network", campaignErrors.create);
  if ((recent.count ?? 0) >= 2) throw new AppError("generation_failed", campaignErrors.rateLimited);
  const { data: run, error: runError } = await client
    .from("runs")
    .insert({
      brand_id: brand.id,
      campaign_key: "one_product_three_scenes",
      reference_key: "campaign-2",
      status: "pending",
    })
    .select("id")
    .single();
  if (runError || !run) throw new AppError("generation_failed", campaignErrors.create);

  const slots = [
    { day: 1, format: "feed" },
    { day: 2, format: "feed" },
    { day: 2, format: "story" },
    { day: 3, format: "feed" },
    { day: 3, format: "story" },
    { day: 4, format: "feed" },
    { day: 4, format: "story" },
    { day: 5, format: "carousel" },
    { day: 5, format: "carousel" },
    { day: 5, format: "carousel" },
  ] as const;
  const { data: assets, error: assetError } = await client
    .from("assets")
    .insert(
      slots.map((slot, index) => ({
        run_id: run.id,
        kind: "image",
        status: "pending",
        meta: {
          ...slot,
          position: index + 1,
          product,
          product_key: input.product_key,
          caption: null,
          error: null,
        },
      })),
    )
    .select("id, meta");
  if (assetError || !assets) {
    await failCampaignTwoRun(client, run.id, campaignErrors.create);
    throw new AppError("generation_failed", campaignErrors.create);
  }
  return {
    client,
    runId: run.id,
    profile,
    product,
    assets: assets.map((asset) => ({
      id: asset.id,
      meta: campaignTwoAssetMetaSchema.parse(asset.meta),
    })),
  };
}

export const setCampaignTwoRunStatus = setCampaignRunStatus;
export const updateCampaignTwoAsset = updateCampaignAsset;
export const saveCampaignTwoImage = saveCampaignImage;

export async function failCampaignTwoRun(client: CampaignClient, runId: string, cause: string) {
  const { data, error } = await client
    .from("assets")
    .select("id, meta")
    .eq("run_id", runId)
    .in("status", ["pending", "processing"]);
  if (error) throw new AppError("generation_failed", campaignErrors.save);
  for (const asset of data ?? []) {
    const meta = campaignTwoAssetMetaSchema.parse(asset.meta);
    await updateCampaignTwoAsset(client, asset.id, {
      status: "failed",
      meta: { ...meta, error: cause },
    });
  }
  await setCampaignTwoRunStatus(client, runId, "failed");
}

export async function getCampaignTwoResult(runId: string) {
  const client = await createSessionWriter();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new AppError("auth", campaignErrors.login);
  const { data: run, error } = await client
    .from("runs")
    .select("id, status, created_at")
    .eq("id", runId)
    .eq("campaign_key", "one_product_three_scenes")
    .maybeSingle();
  if (error) throw new AppError("network", campaignErrors.result);
  if (!run) throw new AppError("not_found", campaignErrors.result);
  const { data: assets, error: assetsError } = await client
    .from("assets")
    .select("id, status, storage_path, meta, created_at")
    .eq("run_id", runId);
  if (assetsError) throw new AppError("network", campaignErrors.result);
  if (
    ["pending", "processing"].includes(run.status) &&
    campaignGenerationTimedOut(run.created_at, assets ?? [])
  ) {
    await failCampaignTwoRun(client, runId, campaignErrors.timeout);
    run.status = "failed";
  }
  const latest = latestAssetsByPosition(
    (assets ?? []).map((asset) => ({
      ...asset,
      meta: campaignTwoAssetMetaSchema.parse(asset.meta),
    })),
  );
  const results = await Promise.all(
    latest.map(async (asset) => {
      let image_url: string | null = null;
      if (asset.status === "done" && asset.storage_path) {
        const signed = await client.storage
          .from("assets")
          .createSignedUrl(asset.storage_path, 3600);
        if (signed.error) throw new AppError("network", campaignErrors.result);
        image_url = signed.data.signedUrl;
      }
      return {
        id: asset.id,
        status: asset.status,
        image_url,
        meta: asset.meta,
      };
    }),
  );
  return campaignTwoResultSchema.parse({
    run_id: runId,
    status: run.status,
    assets: results.sort((a, b) => a.meta.position - b.meta.position),
  });
}
