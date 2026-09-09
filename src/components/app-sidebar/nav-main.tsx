"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Megaphone, Palette } from "lucide-react";
import { copy } from "@/lib/copy";

const items = [
  { href: "/", label: copy.sidebar.dashboard, icon: House },
  { href: "/campaigns", label: copy.nav.campaigns, icon: Megaphone },
  { href: "/brands", label: copy.nav.brands, icon: Palette },
] as const;

export function NavMain() {
  const pathname = usePathname();
  return (
    <nav aria-label={copy.sidebar.navigation} className="mt-4.5 grid gap-1">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          title={label}
          aria-current={pathname === href ? "page" : undefined}
          className="text-shell-muted text-shell-nav hover:bg-shell-hover aria-[current=page]:bg-shell-active aria-[current=page]:text-shell-ink min-h-shell-nav flex items-center gap-2.5 rounded-md px-2.5 font-medium group-data-[collapsed=true]/shell:justify-center group-data-[collapsed=true]/shell:px-0 aria-[current=page]:font-semibold"
        >
          <Icon className="text-shell-icon size-4 shrink-0" strokeWidth={1.75} />
          <span className="group-data-[collapsed=true]/shell:hidden">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
