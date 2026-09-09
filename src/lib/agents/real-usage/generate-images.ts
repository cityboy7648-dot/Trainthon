import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { campaign4 } from "@/definitions/campaign-4";
import { CAMPAIGN_PLAN_CUTOFF_MS } from "@/lib/campaign-timeouts";
import { asCampaignImageUrl, generateCampaignImage } from "@/lib/providers/openai";
import { failCampaign4Run, type startCampaign4Run } from "@/lib/data/campaign-4";
import {
  saveCampaignImage,
  setCampaignRunStatus,
  updateCampaignAsset,
} from "@/lib/data/campaign-assets";
import { AppError, campaignErrors } from "@/lib/errors";
import { log } from "@/lib/log";
import { planCampaign4 } from "./plan-campaign";
import { realUsageImagePrompt } from "./prompt";

export async function generateCampaign4(
  run: Awaited<ReturnType<typeof startCampaign4Run>>,
  requestId: string,
) {
  const context = { requestId, runId: run.runId, assetId: null };
  const startedAt = Date.now();
  try {
    await setCampaignRunStatus(run.client, run.runId, "processing");
    if (!run.product.image_url)
      throw new AppError("generation_failed", campaignErrors.productImage);
    const references = await Promise.all(
      campaign4.references.map(
        async (file) =>
          `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "reference/campaigns/campaign-4", file))).toString("base64")}`,
      ),
    );
    const inputs = [...references, await asCampaignImageUrl(run.product.image_url)];
    const { output: plan } = await planCampaign4(run.profile, run.product, context);
    if (Date.now() - startedAt > CAMPAIGN_PLAN_CUTOFF_MS)
      throw new AppError("generation_failed", campaignErrors.timeout);
    const posts = [plan.day1, plan.day2, plan.day3, plan.day4, plan.day5];
    async function generate(asset: (typeof run.assets)[number], anchor?: Buffer) {
      const assetContext = { ...context, assetId: asset.id };
      const post = posts[asset.meta.day - 1];
      const meta = { ...asset.meta, scene: post.scene, caption: post.caption };
      try {
        await updateCampaignAsset(run.client, asset.id, { status: "processing", meta });
        const image = await generateCampaignImage(
          realUsageImagePrompt(
            plan.visualDirection,
            plan.personContinuity,
            post.imagePrompt,
            JSON.stringify(run.product),
            Boolean(anchor),
          ),
          anchor ? [...inputs, `data:image/png;base64,${anchor.toString("base64")}`] : inputs,
          false,
          assetContext,
          { runStartedAt: startedAt },
        );
        await saveCampaignImage(run.client, run.runId, asset.id, image, meta);
        return image;
      } catch (error) {
        const cause =
          error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.image;
        await updateCampaignAsset(run.client, asset.id, {
          status: "failed",
          meta: { ...meta, error: cause },
        });
        log.error("campaign4.image_failed", assetContext, { cause });
        return null;
      }
    }
    // 인물이 분명히 보이는 D2를 나머지 장의 동일 인물 기준으로 쓴다. 재시도에 D2가 없으면 기준 없이 그린다.
    const anchorAsset = run.assets.find((asset) => asset.meta.day === 2);
    const anchor = anchorAsset ? await generate(anchorAsset) : null;
    const outcomes = await Promise.all(
      run.assets
        .filter((asset) => asset !== anchorAsset)
        .map((asset) => generate(asset, anchor ?? undefined)),
    );
    const failed = (anchorAsset && !anchor) || outcomes.some((image) => image === null);
    await setCampaignRunStatus(run.client, run.runId, failed ? "failed" : "done");
  } catch (error) {
    const cause = error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.plan;
    await failCampaign4Run(run.client, run.runId, cause);
    log.error("campaign4.failed", context, { cause });
  }
}
