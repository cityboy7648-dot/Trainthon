import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CAMPAIGN_PLAN_CUTOFF_MS } from "@/lib/campaign-timeouts";
import { AppError, campaignErrors } from "@/lib/errors";
import { log } from "@/lib/log";
import {
  asCampaignImageUrl,
  parseStructuredOutput,
  generateCampaignImage,
} from "@/lib/providers/openai";
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
    const images = [await asCampaignImageUrl(run.product.image_url), ...references];
    const site = await collectSite(run.profile.source_url, context);
    if (Date.now() - startedAt > CAMPAIGN_PLAN_CUTOFF_MS)
      throw new AppError("generation_failed", campaignErrors.timeout);
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
    if (Date.now() - startedAt > CAMPAIGN_PLAN_CUTOFF_MS)
      throw new AppError("generation_failed", campaignErrors.timeout);
    const imagesStartedAt = Date.now();
    await Promise.all(
      run.assets.map(async (asset, index) => {
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
            { runStartedAt: startedAt, imagesStartedAt, index },
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
    await setCampaignTwoRunStatus(run.client, run.runId, failed ? "failed" : "done");
  } catch (error) {
    const cause = error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.plan;
    await failCampaignTwoRun(run.client, run.runId, cause);
    log.error("campaign_two.failed", context, { cause });
  }
}
