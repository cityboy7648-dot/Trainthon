import { generateCampaignFive } from "@/lib/agents/complete-set/generate";
import { generateCampaignTwo } from "@/lib/agents/one-product-three-scenes/generate";
import { generateSignatureGrid } from "@/lib/agents/signature-grid/generate";
import { generatedCampaignKeys, latestAssetsByPosition } from "@/lib/campaign-workspace";
import { setCampaignRunStatus, syncCampaignRunStatus } from "@/lib/data/campaign-assets";
import { ownedCampaign } from "@/lib/data/campaign-workspace";
import { AppError, campaignErrors } from "@/lib/errors";
import {
  brandProfileSchema,
  campaignFiveAssetMetaSchema,
  campaignPostMetaSchema,
  campaignTwoAssetMetaSchema,
  type CampaignClient,
} from "@/lib/types";

type RetryImage = {
  id: string;
  status: string;
  created_at: string;
  meta: unknown;
};

function selectRetryTargets<T extends { status: string }>(latest: T[], runStatus: string) {
  return latest.filter((asset) => {
    if (asset.status === "failed") return true;
    return runStatus === "failed" && asset.status === "pending";
  });
}

async function loadImages(client: CampaignClient, runId: string): Promise<RetryImage[]> {
  const { data, error } = await client
    .from("assets")
    .select("id, status, created_at, meta")
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

async function claimFailedRun(client: CampaignClient, runId: string) {
  const claimed = await client
    .from("runs")
    .update({ status: "processing" })
    .eq("id", runId)
    .eq("status", "failed")
    .select("id")
    .maybeSingle();
  if (claimed.error) throw new AppError("generation_failed", campaignErrors.save);
  if (!claimed.data) throw new AppError("invalid_request", campaignErrors.conflict);
}

async function replaceFailedImages<T extends { id: string; status: string; meta: object }>(
  client: CampaignClient,
  runId: string,
  latest: T[],
  runStatus: string,
) {
  if (latest.some((asset) => asset.status === "pending" || asset.status === "processing"))
    throw new AppError("invalid_request", campaignErrors.conflict);
  const targets = selectRetryTargets(latest, runStatus);
  if (!targets.length) throw new AppError("invalid_request");
  await claimFailedRun(client, runId);
  try {
    return await insertRetryImages(client, runId, targets);
  } catch (error) {
    await setCampaignRunStatus(client, runId, "failed");
    throw error;
  }
}

export async function prepareCampaignRetry(runId: string) {
  const { client, run } = await ownedCampaign(runId);
  if (!(generatedCampaignKeys as readonly string[]).includes(run.campaign_key))
    throw new AppError("invalid_request");
  if (run.status !== "failed") throw new AppError("invalid_request");
  const writer = client as CampaignClient;
  const images = await loadImages(writer, run.id);
  const profile = brandProfileSchema.parse(run.brands.profile);

  if (run.campaign_key === "signature_grid") {
    const rows = await replaceFailedImages(
      writer,
      run.id,
      latestAssetsByPosition(
        images.map((asset) => ({ ...asset, meta: campaignPostMetaSchema.parse(asset.meta) })),
      ),
      run.status,
    );
    return {
      kind: "signature_grid" as const,
      runId: run.id,
      client: writer,
      claimed: {
        client: writer,
        profile,
        assets: rows.map((asset) => ({
          id: asset.id,
          meta: campaignPostMetaSchema.parse(asset.meta),
        })),
      },
    };
  }

  if (run.campaign_key === "one_product_three_scenes") {
    const latest = latestAssetsByPosition(
      images.map((asset) => ({ ...asset, meta: campaignTwoAssetMetaSchema.parse(asset.meta) })),
    );
    const rows = await replaceFailedImages(writer, run.id, latest, run.status);
    return {
      kind: "one_product_three_scenes" as const,
      run: {
        client: writer,
        runId: run.id,
        profile,
        product: latest[0].meta.product,
        assets: rows.map((asset) => ({
          id: asset.id,
          meta: campaignTwoAssetMetaSchema.parse(asset.meta),
        })),
      },
    };
  }

  const latest = latestAssetsByPosition(
    images.map((asset) => ({ ...asset, meta: campaignFiveAssetMetaSchema.parse(asset.meta) })),
  );
  const rows = await replaceFailedImages(writer, run.id, latest, run.status);
  return {
    kind: "complete_set" as const,
    run: {
      client: writer,
      runId: run.id,
      profile,
      primaryProduct: latest[0].meta.primary_product,
      primaryProductKey: latest[0].meta.primary_product_key,
      companionProducts: latest[0].meta.companion_products,
      assets: rows.map((asset) => ({
        id: asset.id,
        meta: campaignFiveAssetMetaSchema.parse(asset.meta),
      })),
    },
  };
}

export async function executeCampaignRetry(job: Awaited<ReturnType<typeof prepareCampaignRetry>>) {
  if (job.kind === "signature_grid") {
    await generateSignatureGrid(job.runId, job.claimed);
    await syncCampaignRunStatus(job.client, job.runId);
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
