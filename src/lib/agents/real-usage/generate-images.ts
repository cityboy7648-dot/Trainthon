import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { campaign4 } from "@/definitions/campaign-4";
import { generateCampaignImage } from "@/lib/providers/openai";
import { failCampaign4Images, type prepareCampaign4Images } from "@/lib/data/campaign-4-images";
import {
  saveCampaignImage,
  setCampaignRunStatus,
  updateCampaignAsset,
} from "@/lib/data/campaign-assets";
import { AppError, campaignErrors } from "@/lib/errors";
import { log } from "@/lib/log";
import { realUsageImagePrompt } from "./prompt";

export async function generateCampaign4Images(
  run: Awaited<ReturnType<typeof prepareCampaign4Images>>,
) {
  const context = { requestId: crypto.randomUUID(), runId: run.runId, assetId: null };
  try {
    if (!run.product.image_url)
      throw new AppError("generation_failed", campaignErrors.productImage);
    const references = await Promise.all(
      campaign4.references.map(
        async (file) =>
          `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "reference/campaigns/campaign-4", file))).toString("base64")}`,
      ),
    );
    const inputs = [...references, run.product.image_url];
    const imagesStartedAt = Date.now();
    const posts = [run.plan.day1, run.plan.day2, run.plan.day3, run.plan.day4, run.plan.day5];
    async function generate(asset: (typeof run.assets)[number], anchor?: Buffer) {
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
        { runStartedAt: run.startedAt, imagesStartedAt, index: asset.meta.position - 1 },
      );
      await saveCampaignImage(run.client, run.runId, asset.id, image, asset.meta);
      return image;
    }
    // 인물이 분명히 보이는 D2를 나머지 장의 동일 인물 기준으로 쓴다.
    const anchorAsset = run.assets[1];
    const anchor = await generate(anchorAsset);
    const outcomes = await Promise.allSettled(
      run.assets
        .filter((asset) => asset.id !== anchorAsset.id)
        .map(async (asset) => {
          try {
            await generate(asset, anchor);
          } catch (error) {
            const cause =
              error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.image;
            await updateCampaignAsset(run.client, asset.id, {
              status: "failed",
              meta: { ...asset.meta, error: cause },
            });
            log.error("campaign4.image_failed", { ...context, assetId: asset.id }, { cause });
            throw error;
          }
        }),
    );
    if (outcomes.some((outcome) => outcome.status === "rejected")) {
      await failCampaign4Images(run.client, run.runId, campaignErrors.image);
    } else {
      await setCampaignRunStatus(run.client, run.runId, "done");
    }
  } catch (error) {
    const cause = error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.image;
    await failCampaign4Images(run.client, run.runId, cause);
    log.error("campaign4.images_failed", context, { cause });
  }
}
