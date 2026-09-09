import { campaign4 } from "@/definitions/campaign-4";
import { generateCampaignFive } from "@/lib/agents/complete-set/generate";
import { generateCampaignTwo } from "@/lib/agents/one-product-three-scenes/generate";
import {
  generateCampaign4,
  generateCampaign4Images,
} from "@/lib/agents/real-usage/generate-images";
import { latestAssetsByPosition } from "@/lib/campaign-workspace";
import { type Campaign4StartedRun } from "@/lib/data/campaign-4";
import { insertCampaign4Images } from "@/lib/data/campaign-4-images";
import { setCampaignRunStatus, syncCampaignRunStatus } from "@/lib/data/campaign-assets";
import { ownedCampaign } from "@/lib/data/campaign-workspace";
import { AppError, campaignErrors } from "@/lib/errors";
import {
  brandProfileSchema,
  campaign4ImageMetaSchema,
  campaign4PlanningMetaSchema,
  campaignFiveAssetMetaSchema,
  campaignTwoAssetMetaSchema,
  type CampaignClient,
} from "@/lib/types";

const GENERATABLE = new Set(["real_usage", "one_product_three_scenes", "complete_set"]);

type OwnedRun = Awaited<ReturnType<typeof ownedCampaign>>["run"];
type RetryImage = {
  id: string;
  status: string;
  storage_path: string | null;
  created_at: string;
  meta: unknown;
};

type CampaignRetryJob =
  | { kind: "real_usage_plan"; started: Campaign4StartedRun }
  | {
      kind: "real_usage_images";
      run: Awaited<ReturnType<typeof insertCampaign4Images>> & { anchor?: Buffer };
    }
  | {
      kind: "one_product_three_scenes";
      run: {
        client: CampaignClient;
        runId: string;
        profile: ReturnType<typeof brandProfileSchema.parse>;
        product: ReturnType<typeof campaignTwoAssetMetaSchema.parse>["product"];
        assets: { id: string; meta: ReturnType<typeof campaignTwoAssetMetaSchema.parse> }[];
      };
    }
  | {
      kind: "complete_set";
      run: {
        client: CampaignClient;
        runId: string;
        profile: ReturnType<typeof brandProfileSchema.parse>;
        primaryProduct: ReturnType<typeof campaignFiveAssetMetaSchema.parse>["primary_product"];
        primaryProductKey: string;
        companionProducts: ReturnType<
          typeof campaignFiveAssetMetaSchema.parse
        >["companion_products"];
        assets: { id: string; meta: ReturnType<typeof campaignFiveAssetMetaSchema.parse> }[];
      };
    };

function selectRetryTargets<T extends { id: string; status: string }>(
  latest: T[],
  runStatus: string,
  assetId?: string,
) {
  return latest.filter((asset) => {
    if (assetId) return asset.id === assetId && asset.status === "failed";
    if (asset.status === "failed") return true;
    return runStatus === "failed" && asset.status === "pending";
  });
}

async function loadImages(client: CampaignClient, runId: string): Promise<RetryImage[]> {
  const { data, error } = await client
    .from("assets")
    .select("id, status, storage_path, created_at, meta")
    .eq("run_id", runId)
    .eq("kind", "image");
  if (error) throw new AppError("network", campaignErrors.result);
  return data ?? [];
}

async function insertRetryImages(
  client: CampaignClient,
  runId: string,
  targets: { meta: object }[],
) {
  const { data, error } = await client
    .from("assets")
    .insert(
      targets.map((asset) => ({
        run_id: runId,
        kind: "image" as const,
        status: "pending" as const,
        meta: { ...asset.meta, error: null },
      })),
    )
    .select("id, meta");
  if (error || !data || data.length !== targets.length)
    throw new AppError("generation_failed", campaignErrors.save);
  return data;
}

async function prepareCampaign4Retry(
  client: CampaignClient,
  run: OwnedRun,
  assetId?: string,
): Promise<CampaignRetryJob> {
  const profile = brandProfileSchema.parse(run.brands.profile);
  const caption = await client
    .from("assets")
    .select("id, status, meta")
    .eq("run_id", run.id)
    .eq("kind", "caption")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (caption.error) throw new AppError("network", campaignErrors.result);
  if (!caption.data) throw new AppError("generation_failed", campaignErrors.plan);
  const planning = campaign4PlanningMetaSchema.parse(caption.data.meta);
  const product = planning.product ?? profile.products[planning.productIndex];
  if (!product?.image_url) throw new AppError("not_found", campaignErrors.productImage);

  const latest = latestAssetsByPosition(
    (await loadImages(client, run.id)).map((asset) => ({
      ...asset,
      meta: campaign4ImageMetaSchema.parse(asset.meta),
    })),
  );
  if (!latest.length) {
    if (assetId) throw new AppError("invalid_request");
    if (caption.data.status === "done" && planning.plan) {
      return {
        kind: "real_usage_images",
        run: await insertCampaign4Images(client, run.id, planning.plan, product, Date.now()),
      };
    }
    if (caption.data.status === "pending") {
      await setCampaignRunStatus(client, run.id, "processing");
      return {
        kind: "real_usage_plan",
        started: {
          client,
          runId: run.id,
          assetId: caption.data.id,
          requestId: crypto.randomUUID(),
          startedAt: Date.now(),
          profile,
          product,
          productIndex: planning.productIndex,
        },
      };
    }
    if (caption.data.status === "processing") throw new AppError("invalid_request");
    const inserted = await client
      .from("assets")
      .insert({
        run_id: run.id,
        kind: "caption",
        status: "pending",
        meta: {
          stage: "planning",
          productIndex: planning.productIndex,
          product,
          aspect: campaign4.aspect,
        },
      })
      .select("id")
      .single();
    if (inserted.error || !inserted.data)
      throw new AppError("generation_failed", campaignErrors.save);
    await setCampaignRunStatus(client, run.id, "processing");
    return {
      kind: "real_usage_plan",
      started: {
        client,
        runId: run.id,
        assetId: inserted.data.id,
        requestId: crypto.randomUUID(),
        startedAt: Date.now(),
        profile,
        product,
        productIndex: planning.productIndex,
      },
    };
  }

  const targets = selectRetryTargets(latest, run.status, assetId);
  if (!targets.length) throw new AppError("invalid_request");
  if (!planning.plan) throw new AppError("generation_failed", campaignErrors.plan);
  const rows = await insertRetryImages(client, run.id, targets);
  await setCampaignRunStatus(client, run.id, "processing");
  let anchor: Buffer | undefined;
  if (!targets.some((asset) => asset.meta.day === 2)) {
    const day2 = latest.find(
      (asset) => asset.meta.day === 2 && asset.status === "done" && asset.storage_path,
    );
    if (day2?.storage_path) {
      const file = await client.storage.from("assets").download(day2.storage_path);
      if (!file.error && file.data) anchor = Buffer.from(await file.data.arrayBuffer());
    }
  }
  return {
    kind: "real_usage_images",
    run: {
      client,
      runId: run.id,
      plan: planning.plan,
      product,
      startedAt: Date.now(),
      anchor,
      assets: rows
        .map((asset) => ({ id: asset.id, meta: campaign4ImageMetaSchema.parse(asset.meta) }))
        .sort((a, b) => a.meta.day - b.meta.day),
    },
  };
}

async function prepareCampaignTwoRetry(
  client: CampaignClient,
  run: OwnedRun,
  assetId?: string,
): Promise<CampaignRetryJob> {
  const latest = latestAssetsByPosition(
    (await loadImages(client, run.id)).map((asset) => ({
      ...asset,
      meta: campaignTwoAssetMetaSchema.parse(asset.meta),
    })),
  );
  const targets = selectRetryTargets(latest, run.status, assetId);
  if (!targets.length) throw new AppError("invalid_request");
  const rows = await insertRetryImages(client, run.id, targets);
  await setCampaignRunStatus(client, run.id, "processing");
  return {
    kind: "one_product_three_scenes",
    run: {
      client,
      runId: run.id,
      profile: brandProfileSchema.parse(run.brands.profile),
      product: targets[0].meta.product,
      assets: rows.map((asset) => ({
        id: asset.id,
        meta: campaignTwoAssetMetaSchema.parse(asset.meta),
      })),
    },
  };
}

async function prepareCampaignFiveRetry(
  client: CampaignClient,
  run: OwnedRun,
  assetId?: string,
): Promise<CampaignRetryJob> {
  const latest = latestAssetsByPosition(
    (await loadImages(client, run.id)).map((asset) => ({
      ...asset,
      meta: campaignFiveAssetMetaSchema.parse(asset.meta),
    })),
  );
  const targets = selectRetryTargets(latest, run.status, assetId);
  if (!targets.length) throw new AppError("invalid_request");
  const rows = await insertRetryImages(client, run.id, targets);
  await setCampaignRunStatus(client, run.id, "processing");
  return {
    kind: "complete_set",
    run: {
      client,
      runId: run.id,
      profile: brandProfileSchema.parse(run.brands.profile),
      primaryProduct: targets[0].meta.primary_product,
      primaryProductKey: targets[0].meta.primary_product_key,
      companionProducts: targets[0].meta.companion_products,
      assets: rows.map((asset) => ({
        id: asset.id,
        meta: campaignFiveAssetMetaSchema.parse(asset.meta),
      })),
    },
  };
}

export async function prepareCampaignRetry(
  runId: string,
  assetId?: string,
): Promise<CampaignRetryJob> {
  const { client, run } = await ownedCampaign(runId);
  if (!GENERATABLE.has(run.campaign_key)) throw new AppError("invalid_request");
  const writer = client as CampaignClient;
  if (run.campaign_key === "real_usage") return prepareCampaign4Retry(writer, run, assetId);
  if (run.campaign_key === "one_product_three_scenes")
    return prepareCampaignTwoRetry(writer, run, assetId);
  return prepareCampaignFiveRetry(writer, run, assetId);
}

export async function executeCampaignRetry(job: CampaignRetryJob) {
  if (job.kind === "real_usage_plan") {
    await generateCampaign4(job.started);
    await syncCampaignRunStatus(job.started.client, job.started.runId);
    return;
  }
  if (job.kind === "real_usage_images") {
    await generateCampaign4Images(job.run);
    await syncCampaignRunStatus(job.run.client, job.run.runId);
    return;
  }
  if (job.kind === "one_product_three_scenes") {
    await generateCampaignTwo(job.run, crypto.randomUUID());
    await syncCampaignRunStatus(job.run.client, job.run.runId);
    return;
  }
  await generateCampaignFive(job.run, crypto.randomUUID());
  await syncCampaignRunStatus(job.run.client, job.run.runId);
}
