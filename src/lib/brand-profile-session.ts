import { brandProfileSchema, type BrandProfileData } from "@/lib/types";

const storageKey = (url: string) => `brand-profile:${url}`;
const activeKey = "brand-profile:active";
const ownerKey = "brand-profile:owner";

export function initializeBrandSession(owner: string) {
  if (sessionStorage.getItem(ownerKey) !== owner) {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith("brand-profile:")) sessionStorage.removeItem(key);
    }
    sessionStorage.setItem(ownerKey, owner);
  }
}

export function hasAnalyzedBrandProfile(): boolean {
  const url = sessionStorage.getItem(activeKey);
  return Boolean(url && readAnalyzedBrandProfile(url));
}

export function saveAnalyzedBrandProfile(url: string, profile: BrandProfileData) {
  sessionStorage.setItem(storageKey(url), JSON.stringify(profile));
  sessionStorage.setItem(activeKey, url);
  window.dispatchEvent(new Event("brand-profile-change"));
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
