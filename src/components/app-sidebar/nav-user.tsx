"use client";

import { ChevronsUpDown, Gauge, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { copy } from "@/lib/copy";
import { signOut } from "@/lib/data/auth";
import type { NavUserProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NavUser({ user, compact = false }: NavUserProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            aria-label={copy.sidebar.openMenu}
            className={cn(
              "hover:bg-shell-active h-shell-header rounded-shell gap-2",
              compact
                ? "w-shell-header justify-center rounded-full p-0"
                : "w-full justify-start px-1.5 group-data-[collapsed=true]/shell:justify-center group-data-[collapsed=true]/shell:px-0",
            )}
          />
        }
      >
        <span className="bg-shell-avatar grid size-8 shrink-0 place-items-center rounded-full text-white">
          <UserRound className="size-4.5" />
        </span>
        {!compact && (
          <>
            <span className="grid flex-1 text-left group-data-[collapsed=true]/shell:hidden">
              <strong className="text-shell-ink text-shell-nav font-semibold">{user.name}</strong>
              <small className="text-shell-icon text-shell-caption font-normal">
                {copy.sidebar.plan}
              </small>
            </span>
            <ChevronsUpDown className="text-shell-icon size-3.5 group-data-[collapsed=true]/shell:hidden" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={compact ? "bottom" : "top"}
        align={compact ? "end" : "start"}
        className="font-shell w-56"
      >
        <div className="px-2 py-2">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-muted-foreground text-xs">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled title={copy.sidebar.pending}>
          <Gauge />
          {copy.sidebar.usage}
        </DropdownMenuItem>
        <form action={signOut}>
          <DropdownMenuItem render={<button type="submit" />} nativeButton className="w-full">
            <LogOut />
            {copy.sidebar.signOut}
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
