import Link from "next/link";
import { ChevronRightIcon, ImageIcon, MegaphoneIcon, ScanSearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";

const actions = [
  { href: "/brands", label: copy.home.actions.analyze, icon: ScanSearchIcon },
  { href: "/campaigns", label: copy.home.actions.campaign, icon: MegaphoneIcon },
  { href: "/assets", label: copy.home.actions.assets, icon: ImageIcon },
] as const;

export function QuickActions() {
  return (
    <nav aria-label={copy.nav.home} className="grid grid-cols-3 gap-2">
      {actions.map((action) => (
        <Button
          key={action.href}
          variant="outline"
          nativeButton={false}
          className="h-11 justify-between rounded-lg px-3 font-medium shadow-xs"
          render={<Link href={action.href} />}
        >
          <span className="flex items-center gap-2">
            <action.icon className="text-muted-foreground" />
            {action.label}
          </span>
          <ChevronRightIcon className="text-muted-foreground" />
        </Button>
      ))}
    </nav>
  );
}
