"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleHelp, PanelLeftClose, PanelLeftOpen, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { NavMain } from "@/components/app-sidebar/nav-main";
import { NavUser } from "@/components/app-sidebar/nav-user";
import { copy } from "@/lib/copy";
import { mockUser } from "@/mock/session"; // MOCK

export function AppSidebar() {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar();
  const collapsed = isMobile ? !openMobile : !open;
  return (
    <aside
      aria-label={copy.sidebar.label}
      data-source="mock"
      data-collapsed={collapsed}
      className="group/shell bg-shell-background border-shell-border font-shell w-shell max-xl:w-shell-tablet max-lg:w-shell-compact max-md:w-shell-mobile data-[collapsed=true]:w-shell-rail max-md:data-[collapsed=true]:w-shell-mobile max-md:data-[collapsed=false]:w-shell sticky top-0 flex h-dvh shrink-0 flex-col border-r px-4 pt-6 pb-4 data-[collapsed=true]:px-2 max-md:data-[collapsed=false]:fixed max-md:data-[collapsed=false]:z-30 max-md:data-[collapsed=false]:shadow-xl"
    >
      <header className="min-h-shell-header flex items-center gap-2 px-1.5 group-data-[collapsed=true]/shell:flex-col group-data-[collapsed=true]/shell:gap-3 group-data-[collapsed=true]/shell:px-0">
        <Image
          src="/margo-icon.png"
          alt={copy.sidebar.logo}
          width={30}
          height={30}
          className="size-7.5 shrink-0 object-contain"
        />
        <strong className="text-shell-ink text-shell-brand flex-1 font-semibold tracking-tight group-data-[collapsed=true]/shell:hidden">
          {copy.sidebar.name}
        </strong>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={collapsed ? copy.sidebar.expand : copy.sidebar.collapse}
          aria-expanded={!collapsed}
          className="text-shell-icon hover:bg-shell-active size-shell-control rounded-shell"
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </header>
      <Button
        render={<Link href="/campaigns" />}
        nativeButton={false}
        aria-label={copy.sidebar.newCampaignLabel}
        className="bg-shell-button hover:bg-shell-button-hover rounded-shell h-shell-create group-data-[collapsed=true]/shell:w-shell-create mt-6 w-full gap-2 text-xs font-semibold text-white group-data-[collapsed=true]/shell:mx-auto group-data-[collapsed=true]/shell:px-0"
      >
        <Plus className="size-3.5" />
        <span className="group-data-[collapsed=true]/shell:hidden">{copy.sidebar.newCampaign}</span>
      </Button>
      <NavMain />
      <nav
        aria-label={copy.sidebar.utilities}
        className="border-shell-border mt-auto grid gap-0.5 border-b pb-3.5"
      >
        <Button
          variant="ghost"
          className="text-shell-muted hover:bg-shell-hover h-shell-control justify-start gap-2 rounded-md px-2.5 text-xs font-normal group-data-[collapsed=true]/shell:justify-center group-data-[collapsed=true]/shell:px-0"
          aria-label={copy.sidebar.support}
        >
          <CircleHelp className="size-3.5" />
          <span className="group-data-[collapsed=true]/shell:hidden">{copy.sidebar.support}</span>
        </Button>
        <Button
          variant="ghost"
          className="text-shell-muted hover:bg-shell-hover h-shell-control justify-start gap-2 rounded-md px-2.5 text-xs font-normal group-data-[collapsed=true]/shell:justify-center group-data-[collapsed=true]/shell:px-0"
          aria-label={copy.sidebar.account}
        >
          <Settings className="size-3.5" />
          <span className="group-data-[collapsed=true]/shell:hidden">{copy.sidebar.account}</span>
        </Button>
      </nav>
      <footer className="min-h-shell-footer flex items-center pt-2.5">
        <NavUser user={mockUser} />
      </footer>
    </aside>
  );
}
