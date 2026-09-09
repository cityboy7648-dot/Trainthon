"use client";

import { useState } from "react";
import { NavUser } from "@/components/app-sidebar/nav-user";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import type { HomeHeaderProps } from "@/lib/types";

export function HomeHeader({ user }: HomeHeaderProps) {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-6">
      <BrandMark />
      {user ? (
        <NavUser user={user} compact />
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAuthOpen(true)}
            className="border-shell-border text-shell-ink hover:bg-shell-hover rounded-shell"
          >
            {copy.login.title}
          </Button>
          <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        </>
      )}
    </header>
  );
}
