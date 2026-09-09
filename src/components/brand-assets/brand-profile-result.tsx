"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandProfile } from "@/components/brand-assets/brand-profile";
import { BrandProfileSkeleton } from "@/components/brand-assets/brand-profile-skeleton";
import { readAnalyzedBrandProfile } from "@/lib/brand-profile-session";
import type { BrandProfileData, BrandProfileResultProps } from "@/lib/types";

export function BrandProfileResult({ url }: BrandProfileResultProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<BrandProfileData | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const cached = readAnalyzedBrandProfile(url);
      if (cached) {
        setProfile(cached);
        return;
      }

      router.replace(`/analyzing?url=${encodeURIComponent(url)}`);
    });

    return () => cancelAnimationFrame(frame);
  }, [router, url]);

  if (!profile) {
    return <BrandProfileSkeleton />;
  }

  return <BrandProfile profile={profile} />;
}
