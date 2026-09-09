import type { PrimaryNavKey } from "@/lib/types";

const primaryNavHrefs: Record<PrimaryNavKey, string> = {
  dashboard: "/dashboard",
  campaigns: "/campaigns",
  brands: "/brands",
};

export function getPrimaryNavHref(key: PrimaryNavKey): string {
  return primaryNavHrefs[key];
}
