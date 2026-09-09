"use client";

import { ChevronsUpDownIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { copy } from "@/lib/copy";
import { initials } from "@/lib/format";
import type { SessionUser } from "@/lib/types";

type NavUserProps = {
  user: SessionUser;
};

export function NavUser({ user }: NavUserProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" aria-label={copy.sidebar.openMenu} />}
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-primary text-xs font-medium">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-sm font-medium">{user.name}</span>
            <ChevronsUpDownIcon className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-(--anchor-width)">
            <DropdownMenuItem>
              <SettingsIcon />
              {copy.sidebar.account}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOutIcon />
              {copy.sidebar.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
