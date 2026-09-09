import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { campaign4 } from "@/definitions/campaign-4";
import { asCampaignImageUrl, generateCampaignImage } from "@/lib/providers/openai";
import { failCampaign4Images, prepareCampaign4Images } from "@/lib/data/campaign-4-images";
import type { Campaign4StartedRun } from "@/lib/data/campaign-4";
import {
  saveCampaignImage,
  setCampaignRunStatus,
  updateCampaignAsset,
} from "@/lib/data/campaign-assets";
import { AppError, campaignErrors } from "@/lib/errors";
import { log } from "@/lib/log";
import { realUsageImagePrompt } from "./prompt";

export async function generateCampaign4(started: Campaign4StartedRun) {
  try {
    await generateCampaign4Images(await prepareCampaign4Images(started));
  } catch (error) {
    const cause = error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.image;
    await failCampaign4Images(started.client, started.runId, cause);
    log.error(
      "campaign4.generate_failed",
      { requestId: started.requestId, runId: started.runId, assetId: null },
      { cause },
    );
  }
}

export async function generateCampaign4Images(
  run: Awaited<ReturnType<typeof prepareCampaign4Images>>,
) {
  const context = { requestId: crypto.randomUUID(), runId: run.runId, assetId: null };
  try {
    const productImage = run.product.image_url
      ? await asCampaignImageUrl(run.product.image_url)
      : null;
    if (!productImage) throw new AppError("generation_failed", campaignErrors.productImage);
    const references = await Promise.all(
      campaign4.references.map(
        async (file) =>
          `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "reference/campaigns/campaign-4", file))).toString("base64")}`,
      ),
    );
    const inputs = [...references, productImage];
    const posts = [run.plan.day1, run.plan.day2, run.plan.day3, run.plan.day4, run.plan.day5];
    async function generate(
      asset: (typeof run.assets)[number],
      index: number,
      imagesStartedAt: number,
      anchor?: Buffer,
    ) {
      await updateCampaignAsset(run.client, asset.id, { status: "processing" });
      const image = await generateCampaignImage(
        realUsageImagePrompt(
          run.plan.visualDirection,
          run.plan.personContinuity,
          posts[asset.meta.day - 1].imagePrompt,
          JSON.stringify(run.product),
          Boolean(anchor),
        ),
        anchor ? [...inputs, `data:image/png;base64,${anchor.toString("base64")}`] : inputs,
        false,
        { ...context, assetId: asset.id },
        { runStartedAt: run.startedAt, imagesStartedAt, index },
      );
      await saveCampaignImage(run.client, run.runId, asset.id, image, asset.meta);
      return image;
    }
    async function generateOrFail(
      asset: (typeof run.assets)[number],
      index: number,
      imagesStartedAt: number,
      anchor?: Buffer,
    ) {
      try {
        return await generate(asset, index, imagesStartedAt, anchor);
      } catch (error) {
        const cause =
          error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.image;
        await updateCampaignAsset(run.client, asset.id, {
          status: "failed",
          meta: { ...asset.meta, error: cause },
        });
        log.error("campaign4.image_failed", { ...context, assetId: asset.id }, { cause });
        return null;
      }
    }
    // 인물이 분명히 보이는 D2를 나머지 장의 동일 인물 기준으로 쓴다.
    const anchorAsset = run.assets[1];
    const rest = run.assets.filter((asset) => asset.id !== anchorAsset.id);
    const anchorStartedAt = Date.now();
    const anchor = await generateOrFail(anchorAsset, 0, anchorStartedAt);
    const restStartedAt = Date.now();
    const outcomes = await Promise.all(
      rest.map((asset, index) => generateOrFail(asset, index, restStartedAt, anchor ?? undefined)),
    );
    await setCampaignRunStatus(
      run.client,
      run.runId,
      !anchor || outcomes.some((image) => image === null) ? "failed" : "done",
    );
  } catch (error) {
    const cause = error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.image;
    await failCampaign4Images(run.client, run.runId, cause);
    log.error("campaign4.images_failed", context, { cause });
  }
}
