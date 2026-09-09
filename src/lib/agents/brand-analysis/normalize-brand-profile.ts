import { AppError } from "../../errors.ts";
import { toBrandSourceUrl } from "../../home.ts";
import {
  brandProfileSchema,
  type BrandAnalysisOutput,
  type BrandProduct,
  type BrandProfileData,
} from "../../types.ts";

function normalizeKey(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function deduplicateProducts(products: BrandProduct[]): BrandProduct[] {
  const productsByName = new Map<string, BrandProduct>();

  for (const product of products) {
    const key = normalizeKey(product.name);
    const existing = productsByName.get(key);

    if (!existing) {
      productsByName.set(key, product);
      continue;
    }

    productsByName.set(key, {
      name: existing.name,
      image_url: existing.image_url ?? product.image_url,
      description: existing.description ?? product.description,
      price: existing.price ?? product.price,
    });
  }

  return [...productsByName.values()];
}

export function assertCompleteAnalysis(result: BrandAnalysisOutput): void {
  if (!result.collection_complete) {
    throw new AppError(
      "analysis_failed",
      result.incomplete_reason ?? "제품·서비스 목록의 끝을 확인하지 못했다.",
    );
  }
}

export function normalizeBrandProfile(
  profile: Omit<BrandProfileData, "source_url" | "analyzed_at">,
  sourceUrl: string,
): BrandProfileData {
  return brandProfileSchema.parse({
    ...profile,
    palette: [...new Set(profile.palette.map((color) => color.toUpperCase()))],
    mood_keywords: [
      ...new Map(profile.mood_keywords.map((keyword) => [normalizeKey(keyword), keyword])).values(),
    ],
    products: deduplicateProducts(profile.products),
    source_url: toBrandSourceUrl(sourceUrl),
    analyzed_at: new Date().toISOString(),
  });
}
