"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandProfile } from "@/components/brand-assets/brand-profile";
import { BrandProfileSkeleton } from "@/components/brand-assets/brand-profile-skeleton";
import { readAnalyzedBrandProfile, saveAnalyzedBrandProfile } from "@/lib/brand-profile-session";
import { toBrandSourceUrl } from "@/lib/home";
import type { BrandProfileData, BrandProfileResultProps } from "@/lib/types";

export function BrandProfileResult({ url }: BrandProfileResultProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<BrandProfileData | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const brandUrl = toBrandSourceUrl(url);
      const cached = readAnalyzedBrandProfile(brandUrl) ?? readAnalyzedBrandProfile(url);
      if (cached) {
        const profile = { ...cached, source_url: brandUrl };
        if (url !== brandUrl || cached.source_url !== brandUrl) {
          saveAnalyzedBrandProfile(brandUrl, profile);
          if (url !== brandUrl) {
            router.replace(`/brands?url=${encodeURIComponent(brandUrl)}`);
            return;
          }
        }
        setProfile(profile);
        return;
      }

      router.replace(`/analyzing?url=${encodeURIComponent(url)}`);
    });

    return () => cancelAnimationFrame(frame);
  }, [router, url]);

  if (!profile) {
    return <BrandProfileSkeleton />;
  }

  return (
    <BrandProfile
      profile={profile}
      onChange={(next) => {
        saveAnalyzedBrandProfile(next.source_url, next);
        setProfile(next);
      }}
    />
  );
}
