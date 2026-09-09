import { createCampaign4Plan } from "@/lib/data/campaign-4";
import { setCampaignRunStatus, updateCampaignAsset } from "@/lib/data/campaign-assets";
import { createSessionReader } from "@/lib/supabase/server";
import { AppError, campaignErrors } from "@/lib/errors";
import { campaign4ImageMetaSchema, campaign4ResultSchema, type CampaignClient } from "@/lib/types";

export async function prepareCampaign4Images(input: unknown) {
  const startedAt = Date.now();
  const planned = await createCampaign4Plan(input);
  const client = await createSessionReader();
  try {
    const posts = [
      planned.plan.day1,
      planned.plan.day2,
      planned.plan.day3,
      planned.plan.day4,
      planned.plan.day5,
    ];
    const { data, error } = await client
      .from("assets")
      .insert(
        posts.map((post, index) => ({
          run_id: planned.runId,
          kind: "image",
          status: "pending",
          meta: {
            day: index + 1,
            position: index + 1,
            format: "feed",
            product: planned.product,
            scene: post.scene,
            caption: post.caption,
            error: null,
          },
        })),
      )
      .select("id, meta");
    if (error || !data || data.length !== 5)
      throw new AppError("generation_failed", campaignErrors.create);
    await setCampaignRunStatus(client, planned.runId, "processing");
    return {
      client,
      runId: planned.runId,
      plan: planned.plan,
      product: planned.product,
      startedAt,
      assets: data
        .map((asset) => ({ id: asset.id, meta: campaign4ImageMetaSchema.parse(asset.meta) }))
        .sort((a, b) => a.meta.day - b.meta.day),
    };
  } catch (error) {
    await failCampaign4Images(client, planned.runId, campaignErrors.create);
    throw error;
  }
}

export async function failCampaign4Images(client: CampaignClient, runId: string, cause: string) {
  const { data, error } = await client
    .from("assets")
    .select("id, meta")
    .eq("run_id", runId)
    .eq("kind", "image")
    .in("status", ["pending", "processing"]);
  if (error) throw new AppError("generation_failed", campaignErrors.save);
  await Promise.all(
    (data ?? []).map((asset) =>
      updateCampaignAsset(client, asset.id, {
        status: "failed",
        meta: { ...campaign4ImageMetaSchema.parse(asset.meta), error: cause },
      }),
    ),
  );
  await setCampaignRunStatus(client, runId, "failed");
}

export async function getCampaign4Result(runId: string) {
  const client = await createSessionReader();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new AppError("auth", campaignErrors.login);
  const { data: run, error } = await client
    .from("runs")
    .select("id, status, created_at, brands!inner(user_id)")
    .eq("id", runId)
    .eq("campaign_key", "real_usage")
    .eq("brands.user_id", auth.user.id)
    .maybeSingle();
  if (error) throw new AppError("network", campaignErrors.result);
  if (!run) throw new AppError("not_found", campaignErrors.result);
  const { data: assets, error: assetsError } = await client
    .from("assets")
    .select("id, status, storage_path, meta")
    .eq("run_id", runId)
    .eq("kind", "image");
  if (assetsError) throw new AppError("network", campaignErrors.result);
  let cause: string | null = null;
  if (run.status === "failed" && !assets.length) {
    const { data: planning, error: planningError } = await client
      .from("assets")
      .select("cause:meta->>cause")
      .eq("run_id", runId)
      .eq("kind", "caption")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (planningError) throw new AppError("network", campaignErrors.result);
    cause = typeof planning?.cause === "string" ? planning.cause : campaignErrors.create;
  }
  if (
    assets.length &&
    ["pending", "processing"].includes(run.status) &&
    Date.now() - Date.parse(run.created_at) > 360_000
  ) {
    await failCampaign4Images(client, runId, campaignErrors.timeout);
    return getCampaign4Result(runId);
  }
  const results = await Promise.all(
    assets.map(async (asset) => {
      let imageUrl: string | null = null;
      if (asset.status === "done" && asset.storage_path) {
        try {
          const signed = await client.storage
            .from("assets")
            .createSignedUrl(asset.storage_path, 3600);
          imageUrl = signed.error ? null : (signed.data?.signedUrl ?? null);
        } catch {
          // 조회 오류는 해당 이미지에서 표시하며 다른 완료 이미지는 유지한다.
          imageUrl = null;
        }
      }
      return {
        id: asset.id,
        status: asset.status,
        imageUrl,
        meta: campaign4ImageMetaSchema.parse(asset.meta),
      };
    }),
  );
  return campaign4ResultSchema.parse({
    runId,
    status: run.status,
    cause,
    assets: results.sort((a, b) => a.meta.day - b.meta.day),
  });
}
