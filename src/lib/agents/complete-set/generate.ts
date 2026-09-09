import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AppError, campaignErrors } from "@/lib/errors";
import { campaignProductKey } from "@/lib/campaign-product";
import { log } from "@/lib/log";
import { collectSite } from "@/lib/providers/firecrawl";
import { generateCampaignImage, parseStructuredOutput } from "@/lib/providers/openai";
import {
  failCampaignFiveRun,
  saveCampaignFiveImage,
  setCampaignFiveRunStatus,
  updateCampaignFiveAsset,
} from "@/lib/data/campaign-five";
import type { createCampaignFiveRun } from "@/lib/data/campaign-five";
import { campaignFivePlanSchema } from "@/lib/types";
import { campaignFiveImagePrompt, campaignFivePrompt } from "./prompt";

export async function generateCampaignFive(
  run: Awaited<ReturnType<typeof createCampaignFiveRun>>,
  requestId: string,
) {
  const context = { requestId, runId: run.runId, assetId: null };
  const startedAt = Date.now();
  try {
    await setCampaignFiveRunStatus(run.client, run.runId, "processing");
    const reference = await readFile(
      join(process.cwd(), "reference/campaigns/campaign-5/weekly-outfit-flatlay.jpg"),
    );
    const selected = [
      { key: run.primaryProductKey, product: run.primaryProduct },
      ...run.companionProducts,
    ];
    if (selected.some(({ key, product }) => campaignProductKey(product) !== key))
      throw new AppError("generation_failed", campaignErrors.staleProduct);
    if (selected.some(({ product }) => !product.image_url))
      throw new AppError("generation_failed", campaignErrors.productImage);
    const images = [
      `data:image/jpeg;base64,${reference.toString("base64")}`,
      ...selected.map(({ product }) => product.image_url as string),
    ];
    const site = await collectSite(run.profile.source_url, context);
    if (Date.now() - startedAt > 195_000)
      throw new AppError("generation_failed", campaignErrors.timeout);
    const { output: plan } = await parseStructuredOutput(
      campaignFivePlanSchema,
      "campaign_five_plan",
      campaignFivePrompt,
      JSON.stringify({
        brand: { ...run.profile, products: selected.map(({ product }) => product) },
        selected_products: selected.map(({ product }) => product),
        selected_product_keys: selected.map(({ key }) => key),
        current_site: site,
      }),
      context,
      images,
    );
    const sourceHost = new URL(run.profile.source_url).hostname.replace(/^www\./, "");
    const allowedUrls = new Set(
      site.pages
        .flatMap((page) => [page.url, ...page.links])
        .filter((url) => {
          try {
            const parsed = new URL(url);
            return (
              ["http:", "https:"].includes(parsed.protocol) &&
              !parsed.username &&
              !parsed.password &&
              parsed.hostname.replace(/^www\./, "") === sourceHost
            );
          } catch {
            return false;
          }
        }),
    );
    const proposedLinks = new Map(plan.product_links.map((link) => [link.key, link.url]));
    const productLinks = selected.map(({ key, product }) => {
      const proposed = proposedLinks.get(key) ?? null;
      return {
        key,
        name: product.name,
        url: proposed && allowedUrls.has(proposed) ? proposed : null,
      };
    });
    let failed = false;
    for (let offset = 0; offset < run.assets.length; offset += 4) {
      if (Date.now() - startedAt > 195_000)
        throw new AppError("generation_failed", campaignErrors.timeout);
      await Promise.all(
        run.assets.slice(offset, offset + 4).map(async (asset) => {
          const assetContext = { ...context, assetId: asset.id };
          const meta = {
            ...asset.meta,
            caption: plan.captions[asset.meta.day - 1],
            product_links: productLinks,
          };
          try {
            await updateCampaignFiveAsset(run.client, asset.id, { status: "processing", meta });
            const image = await generateCampaignImage(
              campaignFiveImagePrompt(
                plan.concept,
                plan.image_briefs[asset.meta.position - 1],
                JSON.stringify(selected.map(({ product }) => product)),
              ),
              images,
              asset.meta.format === "pinterest" ? "pinterest" : false,
              assetContext,
            );
            await saveCampaignFiveImage(run.client, run.runId, asset.id, image, meta);
          } catch (error) {
            failed = true;
            const cause =
              error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.image;
            await updateCampaignFiveAsset(run.client, asset.id, {
              status: "failed",
              meta: { ...meta, error: cause },
            });
            log.error("campaign_five.asset_failed", assetContext, { cause });
          }
        }),
      );
    }
    await setCampaignFiveRunStatus(run.client, run.runId, failed ? "failed" : "done");
  } catch (error) {
    const cause = error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.plan;
    await failCampaignFiveRun(run.client, run.runId, cause);
    log.error("campaign_five.failed", context, { cause });
  }
}
