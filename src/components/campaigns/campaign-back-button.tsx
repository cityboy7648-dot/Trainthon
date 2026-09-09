import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";

export function CampaignBackButton() {
  return (
    <Button
      render={<Link href="/campaigns" />}
      nativeButton={false}
      variant="ghost"
      className="text-shell-muted hover:text-shell-ink rounded-shell mb-5 h-9 shrink-0 gap-2 self-start px-2 text-sm"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {copy.campaignWorkspace.back}
    </Button>
  );
}
