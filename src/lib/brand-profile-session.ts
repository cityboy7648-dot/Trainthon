import { brandProfileSchema, type BrandProfileData } from "@/lib/types";

const storageKey = (url: string) => `brand-profile:${url}`;

export function saveAnalyzedBrandProfile(url: string, profile: BrandProfileData) {
  sessionStorage.setItem(storageKey(url), JSON.stringify(profile));
}

export function readAnalyzedBrandProfile(url: string): BrandProfileData | null {
  const raw = sessionStorage.getItem(storageKey(url));
  if (!raw) {
    return null;
  }

  try {
    const parsed = brandProfileSchema.safeParse(JSON.parse(raw) as unknown);
    return parsed.success ? parsed.data : null;
  } catch {
    // 깨진 세션 값은 다시 분석한다.
    return null;
  }
}
