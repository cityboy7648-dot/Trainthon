"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowUpRight, Building2 } from "lucide-react";
import { readActiveBrandUrl, readAnalyzedBrandProfile } from "@/lib/brand-profile-session";
import { copy } from "@/lib/copy";
import type { BrandProfileData } from "@/lib/types";

export function DashboardBrand() {
  const [profile, setProfile] = useState<BrandProfileData | null>(null);
  useEffect(() => {
    const update = () => {
      const url = readActiveBrandUrl();
      setProfile(url ? readAnalyzedBrandProfile(url) : null);
    };
    const frame = requestAnimationFrame(update);
    window.addEventListener("brand-profile-change", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("brand-profile-change", update);
    };
  }, []);
  return (
    <div className="text-center">
      <Link
        href="/brands"
        aria-label={copy.dashboard.brandSettings}
        className="text-shell-muted flex items-center justify-between text-xs"
      >
        <span>{copy.dashboard.myBrand}</span>
        <ArrowUpRight className="size-4" />
      </Link>
      <div className="bg-background mx-auto mt-4 flex size-14 items-center justify-center overflow-hidden rounded-xl p-2">
        {profile?.logo_url ? (
          <Image
            src={profile.logo_url}
            alt={copy.brandAnalysis.logoAlt(profile.name)}
            width={56}
            height={56}
            unoptimized
            className="size-full object-contain"
          />
        ) : (
          <Building2 className="text-shell-icon size-7" />
        )}
      </div>
      <h2 className="mt-2 truncate text-base font-medium">
        {profile?.name || copy.dashboard.myBrand}
      </h2>
    </div>
  );
}
