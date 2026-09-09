import { readFile } from "node:fs/promises";
import path from "node:path";
import { campaign4 } from "@/definitions/campaign-4";
import { realUsagePrompt } from "@/lib/agents/real-usage/prompt";
import { asCampaignImageUrl, parseStructuredOutput } from "@/lib/providers/openai";
import { AppError } from "@/lib/errors";
import type { LogContext } from "@/lib/log";
import { campaign4PlanSchema, type BrandProduct, type BrandProfileData } from "@/lib/types";

export async function planCampaign4(
  profile: BrandProfileData,
  product: BrandProduct,
  context: LogContext,
) {
  try {
    const images = await Promise.all(
      campaign4.references.map(async (file) => {
        const bytes = await readFile(
          path.join(process.cwd(), "reference/campaigns/campaign-4", file),
        );
        return `data:image/jpeg;base64,${bytes.toString("base64")}`;
      }),
    );
    if (product.image_url && /^(https:\/\/|data:image\/)/.test(product.image_url)) {
      images.push(await asCampaignImageUrl(product.image_url));
    }
    return await parseStructuredOutput(
      campaign4PlanSchema,
      "real_usage_plan",
      realUsagePrompt,
      JSON.stringify({
        brand: { ...profile, products: [product] },
        product,
        schedule: campaign4.schedule,
      }),
      context,
      images,
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error.code === "analysis_failed"
        ? new AppError("generation_failed", error.cause)
        : error;
    }
    throw new AppError(
      "generation_failed",
      "캠페인 기획 또는 레퍼런스 이미지 읽기에 실패했습니다.",
    );
  }
}
