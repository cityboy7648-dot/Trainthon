import { campaignProductKey, resolveCampaignProduct } from "@/lib/campaign-product";
import { CAMPAIGN_STALE_MS } from "@/lib/campaign-timeouts";
import { AppError, campaignErrors } from "@/lib/errors";
import { createSessionWriter } from "@/lib/supabase/server";
import {
  saveCampaignImage,
  setCampaignRunStatus,
  updateCampaignAsset,
} from "@/lib/data/campaign-assets";
import {
  brandProfileSchema,
  campaignFiveAssetMetaSchema,
  campaignFiveResultSchema,
  type CampaignClient,
  type CampaignFiveRequest,
} from "@/lib/types";

const SLOTS = [
  { day: 1, format: "feed" },
  { day: 2, format: "feed" },
  { day: 2, format: "pinterest" },
  { day: 3, format: "feed" },
  { day: 3, format: "pinterest" },
  { day: 4, format: "carousel" },
  { day: 4, format: "carousel" },
  { day: 4, format: "carousel" },
  { day: 5, format: "carousel" },
  { day: 5, format: "carousel" },
  { day: 5, format: "carousel" },
] as const;

export async function createCampaignFiveRun(input: CampaignFiveRequest) {
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
  const primaryProduct = resolveCampaignProduct(profile, input.product_key);
  const companionProducts = input.companion_product_keys.map((key) => ({
    key,
    product: resolveCampaignProduct(profile, key),
  }));
  if (new Set(input.companion_product_keys).size !== input.companion_product_keys.length)
    throw new AppError("generation_failed", campaignErrors.request);
  if (companionProducts.some(({ product }) => campaignProductKey(product) === input.product_key))
    throw new AppError("generation_failed", campaignErrors.request);

  const recent = await client
    .from("runs")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brand.id)
    .eq("campaign_key", "complete_set")
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());
  if (recent.error) throw new AppError("network", campaignErrors.create);
  if ((recent.count ?? 0) >= 2) throw new AppError("generation_failed", campaignErrors.rateLimited);
  const { data: run, error: runError } = await client
    .from("runs")
    .insert({
      brand_id: brand.id,
      campaign_key: "complete_set",
      reference_key: "campaign-5",
      status: "pending",
    })
    .select("id")
    .single();
  if (runError || !run) throw new AppError("generation_failed", campaignErrors.create);

  const { data: assets, error: assetError } = await client
    .from("assets")
    .insert(
      SLOTS.map((slot, index) => ({
        run_id: run.id,
        kind: "image",
        status: "pending",
        meta: {
          ...slot,
          position: index + 1,
          primary_product: primaryProduct,
          primary_product_key: input.product_key,
          companion_products: companionProducts,
          product_links: [],
          caption: null,
          error: null,
        },
      })),
    )
    .select("id, meta");
  if (assetError || !assets) {
    await failCampaignFiveRun(client, run.id, campaignErrors.create);
    throw new AppError("generation_failed", campaignErrors.create);
  }
  return {
    client,
    runId: run.id,
    profile,
    primaryProduct,
    primaryProductKey: input.product_key,
    companionProducts,
    assets: assets.map((asset) => ({
      id: asset.id,
      meta: campaignFiveAssetMetaSchema.parse(asset.meta),
    })),
  };
}

export const setCampaignFiveRunStatus = setCampaignRunStatus;
export const updateCampaignFiveAsset = updateCampaignAsset;
export const saveCampaignFiveImage = saveCampaignImage;

export async function failCampaignFiveRun(client: CampaignClient, runId: string, cause: string) {
  const { data, error } = await client
    .from("assets")
    .select("id, meta")
    .eq("run_id", runId)
    .in("status", ["pending", "processing"]);
  if (error) throw new AppError("generation_failed", campaignErrors.save);
  for (const asset of data ?? []) {
    const meta = campaignFiveAssetMetaSchema.parse(asset.meta);
    await updateCampaignFiveAsset(client, asset.id, {
      status: "failed",
      meta: { ...meta, error: cause },
    });
  }
  await setCampaignFiveRunStatus(client, runId, "failed");
}

export async function getCampaignFiveResult(runId: string) {
  const client = await createSessionWriter();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new AppError("auth", campaignErrors.login);
  const { data: run, error } = await client
    .from("runs")
    .select("id, status, created_at, brands!inner(user_id)")
    .eq("id", runId)
    .eq("campaign_key", "complete_set")
    .eq("brands.user_id", user.id)
    .maybeSingle();
  if (error) throw new AppError("network", campaignErrors.result);
  if (!run) throw new AppError("not_found", campaignErrors.result);
  if (
    ["pending", "processing"].includes(run.status) &&
    Date.now() - Date.parse(run.created_at) > CAMPAIGN_STALE_MS
  ) {
    await failCampaignFiveRun(client, runId, campaignErrors.timeout);
    run.status = "failed";
  }
  const { data: assets, error: assetsError } = await client
    .from("assets")
    .select("id, status, storage_path, meta")
    .eq("run_id", runId);
  if (assetsError) throw new AppError("network", campaignErrors.result);
  const results = await Promise.all(
    (assets ?? []).map(async (asset) => {
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
        meta: campaignFiveAssetMetaSchema.parse(asset.meta),
      };
    }),
  );
  const sorted = results.sort((a, b) => a.meta.position - b.meta.position);
  return campaignFiveResultSchema.parse({
    run_id: runId,
    status: run.status,
    assets: sorted,
    product_links: sorted[0]?.meta.product_links ?? [],
  });
}
