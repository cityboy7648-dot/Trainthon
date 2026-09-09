"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { HomeHeader } from "@/components/home/home-header";
import { HomeSkeleton } from "@/components/home/home-skeleton";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MockBadge } from "@/components/mock-badge";
import { hasAnalyzedBrandProfile, initializeBrandSession } from "@/lib/brand-profile-session";
import { copy } from "@/lib/copy";
import type { AppAccessProps } from "@/lib/types";

export function AppAccess({ user, children }: AppAccessProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState({ owner: "", ready: false });

  useEffect(() => {
    const update = () => {
      initializeBrandSession(user.email);
      const ready = hasAnalyzedBrandProfile();
      setAccess({ owner: user.email, ready });
      if (!ready && pathname !== "/analyzing") router.replace("/");
    };
    const frame = requestAnimationFrame(update);
    window.addEventListener("brand-profile-change", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("brand-profile-change", update);
    };
  }, [pathname, router, user.email]);

  if (access.owner !== user.email || (!access.ready && pathname !== "/analyzing")) {
    return <HomeSkeleton />;
  }

  if (!access.ready) {
    return (
      <main
        className="font-shell relative flex min-h-dvh flex-col px-6 pt-24"
        aria-label={copy.sidebar.workspace}
      >
        <HomeHeader user={user} />
        {children}
      </main>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main
        aria-label={copy.sidebar.workspace}
        data-source="server"
        className="bg-background flex min-h-dvh min-w-0 flex-1 flex-col"
      >
        {children}
      </main>
      <MockBadge />
    </SidebarProvider>
  );
}
