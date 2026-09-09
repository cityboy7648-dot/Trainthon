"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderIcon, HomeIcon, ImageIcon, MegaphoneIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { copy } from "@/lib/copy";

const items = [
  { href: "/", label: copy.nav.home, icon: HomeIcon },
  { href: "/brands", label: copy.nav.brands, icon: FolderIcon, badge: copy.nav.new },
  { href: "/campaigns", label: copy.nav.campaigns, icon: MegaphoneIcon },
  { href: "/assets", label: copy.nav.assets, icon: ImageIcon },
] as const;

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton isActive={active} render={<Link href={item.href} />}>
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
            {"badge" in item && (
              <SidebarMenuBadge className="text-sidebar-primary">{item.badge}</SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
