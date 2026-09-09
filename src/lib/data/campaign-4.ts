import { campaign4 } from "@/definitions/campaign-4";
import { planCampaign4 } from "@/lib/agents/real-usage/plan-campaign";
import { AppError } from "@/lib/errors";
import { log } from "@/lib/log";
import { createSessionReader } from "@/lib/supabase/server";
import { brandProfileSchema, campaign4RequestSchema } from "@/lib/types";
import type { Campaign4ProductOptions } from "@/lib/types";

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

export async function createCampaign4Plan(input: unknown) {
  const parsed = campaign4RequestSchema.safeParse(input);
  if (!parsed.success) throw new AppError("invalid_request");
  const supabase = await createSessionReader();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new AppError("auth");

  let query = supabase.from("brands").select("id, profile").eq("user_id", user.id);
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

  const context = {
    requestId: crypto.randomUUID(),
    runId: crypto.randomUUID(),
    assetId: crypto.randomUUID(),
  };
  const { error: runError } = await supabase.from("runs").insert({
    id: context.runId,
    brand_id: brand.id,
    campaign_key: campaign4.key,
    reference_key: campaign4.referenceKey,
    status: "pending",
  });
  if (runError) throw new AppError("network", "캠페인 실행을 저장하지 못했습니다.");

  try {
    const { error: assetError } = await supabase.from("assets").insert({
      id: context.assetId,
      run_id: context.runId,
      kind: "caption",
      status: "pending",
      meta: { stage: "planning", productIndex, product, aspect: campaign4.aspect },
    });
    if (assetError) throw new AppError("network", "기획 저장 공간을 만들지 못했습니다.");
    const { error: startError, data: started } = await supabase
      .from("assets")
      .update({ status: "processing" })
      .eq("id", context.assetId)
      .eq("status", "pending")
      .select("id")
      .single();
    if (startError || !started) throw new AppError("network", "기획 상태를 변경하지 못했습니다.");

    const { output: plan, usage } = await planCampaign4(profile, product, context);
    const { error: saveError, data: saved } = await supabase
      .from("assets")
      .update({
        status: "done",
        meta: { stage: "planning", productIndex, product, plan, usage, aspect: campaign4.aspect },
      })
      .eq("id", context.assetId)
      .eq("status", "processing")
      .select("id")
      .single();
    if (saveError || !saved) throw new AppError("network", "기획 결과를 저장하지 못했습니다.");
    // 이미지 생성은 후속 단계다. run은 pending으로 남고 기획 asset만 완료된다.
    return {
      runId: context.runId,
      assetId: context.assetId,
      stage: "planned",
      productIndex,
      product,
      plan,
    };
  } catch (error) {
    const failure = error instanceof AppError ? error : new AppError("generation_failed");
    const { error: failureError } = await supabase
      .from("assets")
      .update({
        status: "failed",
        meta: { stage: "planning", productIndex, code: failure.code, cause: failure.cause },
      })
      .eq("id", context.assetId)
      .in("status", ["pending", "processing"]);
    log.error("campaign4.plan_failed", context, {
      code: failure.code,
      statusSaveFailed: Boolean(failureError),
    });
    if (failureError)
      throw new AppError("network", "기획에 실패했고 실패 상태도 저장하지 못했습니다.");
    throw failure;
  }
}
