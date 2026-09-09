import { campaign4 } from "@/definitions/campaign-4";
import { planCampaign4 } from "@/lib/agents/real-usage/plan-campaign";
import { AppError, campaignErrors } from "@/lib/errors";
import { log } from "@/lib/log";
import { createSessionReader } from "@/lib/supabase/server";
import { brandProfileSchema, campaign4RequestSchema } from "@/lib/types";
import type {
  BrandProduct,
  BrandProfileData,
  Campaign4Plan,
  Campaign4ProductOptions,
  CampaignClient,
} from "@/lib/types";

export type Campaign4StartedRun = {
  client: CampaignClient;
  runId: string;
  assetId: string;
  requestId: string;
  startedAt: number;
  profile: BrandProfileData;
  product: BrandProduct;
  productIndex: number;
};

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

export async function startCampaign4Run(input: unknown): Promise<Campaign4StartedRun> {
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

  const started: Campaign4StartedRun = {
    client,
    requestId: crypto.randomUUID(),
    runId: crypto.randomUUID(),
    assetId: crypto.randomUUID(),
    startedAt: Date.now(),
    profile,
    product,
    productIndex,
  };
  const recent = await client
    .from("runs")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brand.id)
    .eq("campaign_key", campaign4.key)
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());
  if (recent.error) throw new AppError("network", campaignErrors.create);
  if ((recent.count ?? 0) >= 2) throw new AppError("generation_failed", campaignErrors.rateLimited);
  const { error: runError } = await client.from("runs").insert({
    id: started.runId,
    brand_id: brand.id,
    campaign_key: campaign4.key,
    reference_key: campaign4.referenceKey,
    status: "pending",
  });
  if (runError) throw new AppError("network", `${campaignErrors.create} ${runError.message}`);
  const { error: assetError } = await client.from("assets").insert({
    id: started.assetId,
    run_id: started.runId,
    kind: "caption",
    status: "pending",
    meta: {
      stage: "planning",
      productIndex,
      product,
      aspect: campaign4.aspect,
    },
  });
  if (assetError) throw new AppError("network", "기획 저장 공간을 만들지 못했습니다.");
  return started;
}

export async function finishCampaign4Plan(started: Campaign4StartedRun): Promise<Campaign4Plan> {
  const context = {
    requestId: started.requestId,
    runId: started.runId,
    assetId: started.assetId,
  };
  try {
    const { error: startError, data: claimed } = await started.client
      .from("assets")
      .update({ status: "processing" })
      .eq("id", started.assetId)
      .eq("status", "pending")
      .select("id")
      .single();
    if (startError || !claimed) throw new AppError("network", "기획 상태를 변경하지 못했습니다.");

    const { output: plan, usage } = await planCampaign4(started.profile, started.product, context);
    const { error: saveError, data: saved } = await started.client
      .from("assets")
      .update({
        status: "done",
        meta: {
          stage: "planning",
          productIndex: started.productIndex,
          product: started.product,
          plan,
          usage,
          aspect: campaign4.aspect,
        },
      })
      .eq("id", started.assetId)
      .eq("status", "processing")
      .select("id")
      .single();
    if (saveError || !saved) throw new AppError("network", "기획 결과를 저장하지 못했습니다.");
    return plan;
  } catch (error) {
    const failure = error instanceof AppError ? error : new AppError("generation_failed");
    const { error: runFailureError } = await started.client
      .from("runs")
      .update({ status: "failed" })
      .eq("id", started.runId)
      .in("status", ["pending", "processing"]);
    const { error: failureError } = await started.client
      .from("assets")
      .update({
        status: "failed",
        meta: {
          stage: "planning",
          productIndex: started.productIndex,
          code: failure.code,
          cause: failure.cause,
        },
      })
      .eq("id", started.assetId)
      .in("status", ["pending", "processing"]);
    log.error("campaign4.plan_failed", context, {
      code: failure.code,
      statusSaveFailed: Boolean(failureError || runFailureError),
    });
    if (failureError || runFailureError)
      throw new AppError("network", "기획에 실패했고 실패 상태도 저장하지 못했습니다.");
    throw failure;
  }
}
