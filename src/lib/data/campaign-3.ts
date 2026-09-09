import { campaign3 } from "@/definitions/campaign-3";
import { planCampaign3 } from "@/lib/agents/drop-week/plan-campaign";
import { AppError, campaign3Errors } from "@/lib/errors";
import { log } from "@/lib/log";
import { createSessionWriter } from "@/lib/supabase/server";
import { brandProfileSchema, campaign3RequestSchema } from "@/lib/types";

export async function createCampaign3Plan(input: unknown) {
  const parsed = campaign3RequestSchema.safeParse(input);
  if (!parsed.success) throw new AppError("invalid_request");
  const client = await createSessionWriter();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) throw new AppError("auth");
  const { data: brand, error: brandError } = await client
    .from("brands")
    .select("id, profile")
    .eq("id", parsed.data.brandId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (brandError) throw new AppError("network", campaign3Errors.brand);
  if (!brand) throw new AppError("not_found", campaign3Errors.brand);
  const profile = brandProfileSchema.safeParse(brand.profile);
  if (!profile.success) throw new AppError("generation_failed", campaign3Errors.brand);
  const product = profile.data.products[parsed.data.productIndex];
  if (!product?.image_url || !/^(https:\/\/|data:image\/)/.test(product.image_url)) {
    throw new AppError("invalid_request", campaign3Errors.product);
  }
  const context = {
    requestId: crypto.randomUUID(),
    runId: crypto.randomUUID(),
    assetId: crypto.randomUUID(),
  };
  const meta = {
    stage: "planning",
    product,
    productIndex: parsed.data.productIndex,
    launchDate: parsed.data.launchDate,
  };
  const { error: runError } = await client.from("runs").insert({
    id: context.runId,
    brand_id: brand.id,
    campaign_key: campaign3.key,
    reference_key: campaign3.referenceKey,
    status: "pending",
  });
  if (runError) throw new AppError("network", campaign3Errors.save);
  try {
    const { error: assetError } = await client.from("assets").insert({
      id: context.assetId,
      run_id: context.runId,
      kind: "caption",
      status: "pending",
      meta,
    });
    if (assetError) throw new AppError("network", campaign3Errors.save);
    const start = await client
      .from("assets")
      .update({ status: "processing" })
      .eq("id", context.assetId)
      .eq("status", "pending")
      .select("id")
      .single();
    if (start.error || !start.data) throw new AppError("network", campaign3Errors.save);
    const {
      output: plan,
      usage,
      schedule,
    } = await planCampaign3(profile.data, product, parsed.data.launchDate, context);
    const saved = await client
      .from("assets")
      .update({
        status: "done",
        meta: { ...meta, plan, usage, schedule },
      })
      .eq("id", context.assetId)
      .eq("status", "processing")
      .select("id")
      .single();
    if (saved.error || !saved.data) throw new AppError("network", campaign3Errors.save);
    // 이미지 생성 전이므로 기획 asset만 완료하고 run은 pending으로 유지한다.
    return {
      runId: context.runId,
      assetId: context.assetId,
      stage: "planned",
      product,
      plan,
      schedule,
    };
  } catch (error) {
    const failure =
      error instanceof AppError ? error : new AppError("generation_failed", campaign3Errors.plan);
    const failedAsset = await client
      .from("assets")
      .update({
        status: "failed",
        meta: { ...meta, code: failure.code, cause: failure.cause ?? null },
      })
      .eq("id", context.assetId)
      .in("status", ["pending", "processing"]);
    const failedRun = await client
      .from("runs")
      .update({ status: "failed" })
      .eq("id", context.runId)
      .in("status", ["pending", "processing"]);
    log.error("campaign3.plan_failed", context, {
      code: failure.code,
      statusSaveFailed: Boolean(failedAsset.error || failedRun.error),
    });
    if (failedAsset.error || failedRun.error)
      throw new AppError("network", campaign3Errors.failureSave);
    throw failure;
  }
}
