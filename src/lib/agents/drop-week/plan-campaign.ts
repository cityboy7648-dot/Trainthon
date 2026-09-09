import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { campaign3 } from "@/definitions/campaign-3";
import { dropWeekPrompt } from "./prompt";
import { parseStructuredOutput } from "@/lib/providers/openai";
import { AppError, campaign3Errors } from "@/lib/errors";
import type { LogContext } from "@/lib/log";
import { campaign3PlanSchema, type BrandProduct, type BrandProfileData } from "@/lib/types";

export async function planCampaign3(
  profile: BrandProfileData,
  product: BrandProduct,
  launchDate: string,
  context: LogContext,
) {
  if (!context.runId || !context.assetId)
    throw new AppError("generation_failed", campaign3Errors.save);
  if (!product.image_url) throw new AppError("invalid_request", campaign3Errors.product);
  const references = await Promise.all(
    campaign3.references.map(async ({ file, mime }) => {
      try {
        const bytes = await readFile(join(process.cwd(), "reference/campaigns/campaign-3", file));
        return `data:${mime};base64,${bytes.toString("base64")}`;
      } catch {
        throw new AppError("generation_failed", campaign3Errors.reference);
      }
    }),
  );
  const schedule = campaign3.schedule.map((slot) => {
    const date = new Date(`${launchDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + slot.offset);
    return { ...slot, date: date.toISOString().slice(0, 10) };
  });
  try {
    const result = await parseStructuredOutput(
      campaign3PlanSchema,
      "drop_week_plan",
      dropWeekPrompt,
      JSON.stringify({ brand: { ...profile, products: [product] }, product, launchDate, schedule }),
      context,
      [product.image_url, ...references],
    );
    return { ...result, schedule };
  } catch {
    throw new AppError("generation_failed", campaign3Errors.plan);
  }
}
