"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { NavMain } from "@/components/app-sidebar/nav-main";
import { NavUser } from "@/components/app-sidebar/nav-user";
import { copy } from "@/lib/copy";
import type { AppSidebarProps } from "@/lib/types";

export function AppSidebar({ user }: AppSidebarProps) {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar();
  const collapsed = isMobile ? !openMobile : !open;
  return (
    <aside
      aria-label={copy.sidebar.label}
      data-source="server"
      data-collapsed={collapsed}
      className="group/shell bg-shell-background border-shell-border font-shell w-shell max-xl:w-shell-tablet max-lg:w-shell-compact max-md:w-shell-mobile data-[collapsed=true]:w-shell-rail max-md:data-[collapsed=true]:w-shell-mobile max-md:data-[collapsed=false]:w-shell sticky top-0 flex h-dvh shrink-0 flex-col border-r px-4 pt-6 pb-4 data-[collapsed=true]:px-2 max-md:data-[collapsed=false]:fixed max-md:data-[collapsed=false]:z-30 max-md:data-[collapsed=false]:shadow-xl"
    >
      <header className="min-h-shell-header flex items-center gap-2 px-1.5 group-data-[collapsed=true]/shell:flex-col group-data-[collapsed=true]/shell:gap-3 group-data-[collapsed=true]/shell:px-0">
        <BrandMark />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={collapsed ? copy.sidebar.expand : copy.sidebar.collapse}
          aria-expanded={!collapsed}
          className="text-shell-icon hover:bg-shell-active size-shell-control rounded-shell ml-auto group-data-[collapsed=true]/shell:ml-0"
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </header>
      <Button
        render={<Link href="/campaigns/new" />}
        nativeButton={false}
        aria-label={copy.sidebar.newCampaignLabel}
        className="bg-shell-button hover:bg-shell-button-hover rounded-shell h-shell-create group-data-[collapsed=true]/shell:w-shell-create mt-6 w-full gap-2 text-xs font-semibold text-white group-data-[collapsed=true]/shell:mx-auto group-data-[collapsed=true]/shell:px-0"
      >
        <Plus className="size-3.5" />
        <span className="group-data-[collapsed=true]/shell:hidden">{copy.sidebar.newCampaign}</span>
      </Button>
      <NavMain />
      <footer className="min-h-shell-footer mt-auto flex items-center pt-2.5">
        {user && <NavUser user={user} />}
      </footer>
    </aside>
  );
}
