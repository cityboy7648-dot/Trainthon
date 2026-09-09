import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { campaign3 } from "@/definitions/campaign-3";
import { generateCampaignImage } from "@/lib/providers/openai";
import { AppError, campaign3Errors } from "@/lib/errors";
import { dropWeekImagePrompt } from "./prompt";
import type { LogContext } from "@/lib/log";
import type { Campaign3ImageMeta } from "@/lib/types";

export async function generateDropWeekImage(meta: Campaign3ImageMeta, context: LogContext) {
  if (!meta.product.image_url) throw new AppError("generation_failed", campaign3Errors.product);
  const refs = await Promise.all(
    campaign3.references.map(async ({ file, mime }) => {
      const bytes = await readFile(join(process.cwd(), "reference/campaigns/campaign-3", file));
      return `data:${mime};base64,${bytes.toString("base64")}`;
    }),
  );
  return generateCampaignImage(
    dropWeekImagePrompt(meta),
    [meta.product.image_url, ...refs],
    meta.format === "story",
    context,
  );
}
