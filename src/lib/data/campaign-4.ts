import { campaign4 } from "@/definitions/campaign-4";
import { setCampaignRunStatus, updateCampaignAsset } from "@/lib/data/campaign-assets";
import { AppError, campaignErrors } from "@/lib/errors";
import { createSessionReader } from "@/lib/supabase/server";
import {
  brandProfileSchema,
  campaign4ImageMetaSchema,
  campaign4RequestSchema,
  type Campaign4ProductOptions,
  type CampaignClient,
} from "@/lib/types";

export async function getCampaign4Products(): Promise<Campaign4ProductOptions> {
  const client = await createSessionReader();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) throw new AppError("auth");
  const { data, error } = await client
    .from("brands")
    .select("id, profile")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new AppError("network");
  return (data ?? []).map((brand) => {
    const parsed = brandProfileSchema.safeParse(brand.profile);
    if (!parsed.success) throw new AppError("generation_failed");
    return {
      brandId: brand.id,
      brandName: parsed.data.name,
      products: parsed.data.products.flatMap((product, index) =>
        product.image_url && /^(https:\/\/|data:image\/)/.test(product.image_url)
          ? [{ index, ...product }]
          : [],
      ),
    };
  });
}

export async function startCampaign4Run(input: unknown) {
  const parsed = campaign4RequestSchema.safeParse(input);
  if (!parsed.success) throw new AppError("invalid_request");
  const client = await createSessionReader();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) throw new AppError("auth");

  let query = client.from("brands").select("id, profile").eq("user_id", user.id);
  if (parsed.data.brandId) query = query.eq("id", parsed.data.brandId);
  const { data: brand, error: brandError } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (brandError) throw new AppError("network", "저장된 브랜드를 불러오지 못했습니다.");
  if (!brand) throw new AppError("not_found", "저장된 브랜드가 없습니다.");
  const result = brandProfileSchema.safeParse(brand.profile);
  if (!result.success)
    throw new AppError("generation_failed", "저장된 브랜드 정보 형식을 확인해 주세요.");
  const profile = result.data;
  const productIndex =
    parsed.data.productIndex ??
    profile.products.findIndex(
      (product) =>
        product.image_url !== null && /^(https:\/\/|data:image\/)/.test(product.image_url),
    );
  const product = profile.products[productIndex];
  if (!product?.image_url || !/^(https:\/\/|data:image\/)/.test(product.image_url)) {
    throw new AppError("not_found", "대표 상품의 이름과 이미지를 먼저 저장해 주세요.");
  }

  const recent = await client
    .from("runs")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brand.id)
    .eq("campaign_key", campaign4.key)
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());
  if (recent.error) throw new AppError("network", campaignErrors.create);
  if ((recent.count ?? 0) >= 2) throw new AppError("generation_failed", campaignErrors.rateLimited);
  const { data: run, error: runError } = await client
    .from("runs")
    .insert({
      brand_id: brand.id,
      campaign_key: campaign4.key,
      reference_key: campaign4.referenceKey,
      status: "pending",
    })
    .select("id")
    .single();
  if (runError || !run)
    throw new AppError(
      "generation_failed",
      runError ? `${campaignErrors.create} ${runError.message}` : campaignErrors.create,
    );
  const { data: assets, error: assetError } = await client
    .from("assets")
    .insert(
      campaign4.schedule.map((_, index) => ({
        run_id: run.id,
        kind: "image",
        status: "pending",
        meta: {
          day: index + 1,
          position: index + 1,
          format: "feed",
          product,
          scene: null,
          caption: null,
          error: null,
        },
      })),
    )
    .select("id, meta");
  if (assetError || !assets) {
    await failCampaign4Run(client, run.id, campaignErrors.create);
    throw new AppError("generation_failed", campaignErrors.create);
  }
  return {
    client,
    runId: run.id,
    profile,
    product,
    assets: assets.map((asset) => ({
      id: asset.id,
      meta: campaign4ImageMetaSchema.parse(asset.meta),
    })),
  };
}

export async function failCampaign4Run(client: CampaignClient, runId: string, cause: string) {
  const { data, error } = await client
    .from("assets")
    .select("id, meta")
    .eq("run_id", runId)
    .eq("kind", "image")
    .in("status", ["pending", "processing"]);
  if (error) throw new AppError("generation_failed", campaignErrors.save);
  for (const asset of data ?? []) {
    const meta = campaign4ImageMetaSchema.parse(asset.meta);
    await updateCampaignAsset(client, asset.id, {
      status: "failed",
      meta: { ...meta, error: cause },
    });
  }
  await setCampaignRunStatus(client, runId, "failed");
}
