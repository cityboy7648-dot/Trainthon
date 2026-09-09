"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { readActiveBrandUrl } from "@/lib/brand-profile-session";
import { BrandProfileSkeleton } from "@/components/brand-assets/brand-profile-skeleton";

export function ActiveBrandProfile() {
  const router = useRouter();
  useEffect(() => {
    const url = readActiveBrandUrl();
    router.replace(url ? `/brands?url=${encodeURIComponent(url)}` : "/");
  }, [router]);
  return <BrandProfileSkeleton />;
}
