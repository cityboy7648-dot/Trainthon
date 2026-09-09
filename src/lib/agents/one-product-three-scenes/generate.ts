import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AppError, campaignErrors } from "@/lib/errors";
import { log } from "@/lib/log";
import { parseStructuredOutput, generateCampaignImage } from "@/lib/providers/openai";
import { collectSite } from "@/lib/providers/firecrawl";
import {
  failCampaignTwoRun,
  setCampaignTwoRunStatus,
  updateCampaignTwoAsset,
  saveCampaignTwoImage,
} from "@/lib/data/campaign-two";
import type { createCampaignTwoRun } from "@/lib/data/campaign-two";
import { campaignTwoPlanSchema } from "@/lib/types";
import { campaignTwoPrompt, campaignTwoImagePrompt } from "./prompt";

export async function generateCampaignTwo(
  run: Awaited<ReturnType<typeof createCampaignTwoRun>>,
  requestId: string,
) {
  const context = { requestId, runId: run.runId, assetId: null };
  const startedAt = Date.now();
  try {
    await setCampaignTwoRunStatus(run.client, run.runId, "processing");
    const files = [
      "v-by-very-fashion-three-style.jpg",
      "dida-ritchie-look-1.jpg",
      "dida-ritchie-look-2.jpg",
      "dida-ritchie-look-3.jpg",
    ];
    const references = await Promise.all(
      files.map(async (file) => {
        const bytes = await readFile(join(process.cwd(), "reference/campaigns/campaign-2", file));
        return `data:image/jpeg;base64,${bytes.toString("base64")}`;
      }),
    );
    if (!run.product.image_url)
      throw new AppError("generation_failed", campaignErrors.productImage);
    const images = [run.product.image_url, ...references];
    const site = await collectSite(run.profile.source_url, context);
    const { output: plan } = await parseStructuredOutput(
      campaignTwoPlanSchema,
      "campaign_two_plan",
      campaignTwoPrompt,
      JSON.stringify({
        brand: { ...run.profile, products: [run.product] },
        selected_product: run.product,
        current_site: site,
      }),
      context,
      images,
    );
    let failed = false;
    // 요청 전체 제한 안에서 종료되도록 두 장씩 생성한다.
    for (let offset = 0; offset < run.assets.length; offset += 2) {
      if (Date.now() - startedAt > 540_000)
        throw new AppError("generation_failed", campaignErrors.timeout);
      await Promise.all(
        run.assets.slice(offset, offset + 2).map(async (asset) => {
          const assetContext = { ...context, assetId: asset.id };
          const sceneIndex =
            asset.meta.format === "carousel" ? asset.meta.position - 8 : asset.meta.day - 2;
          const brief =
            asset.meta.day === 1 ? plan.product_brief : plan.scenes[sceneIndex].image_brief;
          const meta = { ...asset.meta, caption: plan.captions[asset.meta.day - 1] };
          try {
            await updateCampaignTwoAsset(run.client, asset.id, { status: "processing", meta });
            const image = await generateCampaignImage(
              campaignTwoImagePrompt(
                plan.concept,
                brief,
                JSON.stringify(run.product),
                meta.format === "story",
              ),
              images,
              meta.format === "story",
              assetContext,
            );
            await saveCampaignTwoImage(run.client, run.runId, asset.id, image, meta);
          } catch (error) {
            failed = true;
            const cause =
              error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.image;
            await updateCampaignTwoAsset(run.client, asset.id, {
              status: "failed",
              meta: { ...meta, error: cause },
            });
            log.error("campaign_two.asset_failed", assetContext, { cause });
          }
        }),
      );
    }
    await setCampaignTwoRunStatus(run.client, run.runId, failed ? "failed" : "done");
  } catch (error) {
    const cause = error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.plan;
    await failCampaignTwoRun(run.client, run.runId, cause);
    log.error("campaign_two.failed", context, { cause });
  }
}
