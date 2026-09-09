import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CAMPAIGN_PLAN_CUTOFF_MS } from "@/lib/campaign-timeouts";
import { claimSignatureGridRun, failSignatureGridRun } from "@/lib/data/signature-grid";
import {
  updateCampaignAsset,
  saveCampaignImage,
  setCampaignRunStatus,
} from "@/lib/data/campaign-assets";
import { collectSite } from "@/lib/providers/firecrawl";
import {
  asCampaignImageUrl,
  parseStructuredOutput,
  generateCampaignImage,
} from "@/lib/providers/openai";
import { signatureGridPlanSchema } from "@/lib/types";
import { AppError, campaignErrors } from "@/lib/errors";
import { log } from "@/lib/log";
import { signatureGridPrompt, signatureGridImagePrompt } from "./prompt";

export async function generateSignatureGrid(id: string) {
  const context = { requestId: crypto.randomUUID(), runId: id, assetId: null };
  const startedAt = Date.now();
  const claimed = await claimSignatureGridRun(id);
  if (!claimed) return;
  const { client, profile, assets } = claimed;
  try {
    const references = await Promise.all(
      [
        "brewish-coffee-instagram-feed.jpg",
        "gaea-skincare-instagram-feed.jpg",
        "bakery-coffee-instagram-feed.jpg",
        "skincare-photo-instagram-feed.jpg",
      ].map(
        async (file) =>
          `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "reference/campaigns/campaign-1", file))).toString("base64")}`,
      ),
    );
    const site = await collectSite(profile.source_url, context);
    if (Date.now() - startedAt > CAMPAIGN_PLAN_CUTOFF_MS)
      throw new AppError("generation_failed", campaignErrors.timeout);
    const sourceImages = new Set(
      [
        profile.logo_url,
        ...profile.products.map((product) => product.image_url),
        ...site.pages.flatMap((page) => page.images),
      ].filter((url): url is string => !!url),
    );
    const { output: plan } = await parseStructuredOutput(
      signatureGridPlanSchema,
      "signature_grid_plan",
      signatureGridPrompt,
      JSON.stringify({ brand: profile, current_site: site }),
      context,
      [
        ...references,
        ...(await Promise.all(
          Array.from(sourceImages)
            .slice(0, 12)
            .map((url) => asCampaignImageUrl(url)),
        )),
      ],
    );
    if (Date.now() - startedAt > CAMPAIGN_PLAN_CUTOFF_MS)
      throw new AppError("generation_failed", campaignErrors.timeout);
    if (plan.posts.some((post) => post.source_image_urls.some((url) => !sourceImages.has(url))))
      throw new AppError("generation_failed", campaignErrors.plan);
    let failed = false;
    const results = await Promise.allSettled(
      plan.posts.map(async (post) => {
        const asset = assets.find((item) => item.meta.position === post.position);
        if (!asset) throw new AppError("generation_failed", campaignErrors.plan);
        const meta = {
          ...asset.meta,
          day: post.upload_order,
          caption: post.caption,
          purpose: post.purpose,
          source_facts: post.source_facts,
          source_image_urls: post.source_image_urls,
          image_brief: post.image_brief,
          text_in_image: post.text_in_image,
          upload_order: post.upload_order,
          concept: plan.concept,
          reference_direction: plan.reference_direction,
        };
        try {
          await updateCampaignAsset(client, asset.id, { status: "processing", meta });
          const image = await generateCampaignImage(
            signatureGridImagePrompt(plan, post),
            [
              ...references,
              ...(await Promise.all(post.source_image_urls.map((url) => asCampaignImageUrl(url)))),
            ],
            "square",
            { ...context, assetId: asset.id },
            { runStartedAt: startedAt },
          );
          await saveCampaignImage(client, id, asset.id, image, meta);
        } catch (error) {
          failed = true;
          const cause =
            error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.image;
          await updateCampaignAsset(client, asset.id, {
            status: "failed",
            meta: { ...meta, error: cause },
          });
          log.error("signature_grid.asset_failed", { ...context, assetId: asset.id }, { cause });
        }
      }),
    );
    const rejected = results.find((result) => result.status === "rejected");
    if (rejected?.status === "rejected") throw rejected.reason;
    await setCampaignRunStatus(client, id, failed ? "failed" : "done");
  } catch (error) {
    const cause = error instanceof AppError ? (error.cause ?? error.message) : campaignErrors.plan;
    await failSignatureGridRun(client, id, cause);
    log.error("signature_grid.failed", context, { cause });
  }
}
