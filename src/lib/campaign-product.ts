import { createHash } from "node:crypto";
import { AppError, campaignErrors } from "./errors.ts";
import type { BrandProfileData } from "./types.ts";

export function campaignProductKey(product: BrandProfileData["products"][number]) {
  return createHash("sha256").update(JSON.stringify(product)).digest("hex");
}

export function resolveCampaignProduct(profile: BrandProfileData, key: string) {
  const product = profile.products.find((item) => campaignProductKey(item) === key);
  if (!product) throw new AppError("generation_failed", campaignErrors.staleProduct);
  if (!product.image_url) throw new AppError("generation_failed", campaignErrors.productImage);
  return product;
}
