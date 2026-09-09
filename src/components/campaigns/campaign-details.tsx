import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { copy } from "@/lib/copy";
import type { CampaignDetailsProps } from "@/lib/types";

export function CampaignDetails({ campaign, onClose }: CampaignDetailsProps) {
  return (
    <Sheet
      open={Boolean(campaign)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        showCloseButton={false}
        data-source="mock"
        className="font-shell gap-0 overflow-y-auto p-6 data-[side=right]:w-full sm:p-8 data-[side=right]:sm:max-w-lg"
      >
        {campaign && (
          <>
            <header className="border-shell-border border-b pr-8 pb-6">
              <SheetTitle className="font-shell text-shell-ink text-2xl leading-8 font-semibold">
                {campaign.name}
              </SheetTitle>
              <SheetDescription className="text-shell-muted mt-3 leading-6">
                {copy.campaigns.scope}
              </SheetDescription>
              <SheetClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-5 right-5"
                    aria-label={copy.campaigns.close}
                  />
                }
              >
                <X aria-hidden="true" />
              </SheetClose>
            </header>
            <dl className="grid grid-cols-3 gap-4 py-6 text-sm">
              <div className="col-span-3">
                <dt className="text-shell-muted text-xs">{copy.campaigns.goal}</dt>
                <dd className="text-shell-ink mt-2 font-medium">{campaign.goal}</dd>
              </div>
              <div>
                <dt className="text-shell-muted text-xs">{copy.campaigns.duration}</dt>
                <dd className="mt-2">{copy.campaigns.days(campaign.duration_days)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-shell-muted text-xs">{copy.campaigns.channels}</dt>
                <dd className="mt-2">{campaign.channels.join(" · ")}</dd>
              </div>
            </dl>
            <section className="border-shell-border border-t pt-6">
              <h3 className="text-shell-ink text-sm font-semibold">{copy.campaigns.schedule}</h3>
              <ol className="mt-2 divide-y">
                {campaign.schedule.map((item) => (
                  <li key={item.day} className="grid grid-cols-5 gap-3 py-4">
                    <span className="text-shell-muted text-xs leading-6">
                      {copy.campaigns.day(item.day)}
                    </span>
                    <div className="col-span-4">
                      <p className="text-shell-ink text-sm leading-6 font-medium">{item.purpose}</p>
                      <p className="text-shell-muted mt-1 text-xs leading-5">
                        {item.channel} · {item.format}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <section className="border-shell-border mt-2 border-t pt-6">
              <h3 className="text-shell-ink text-sm font-semibold">{copy.campaigns.outputs}</h3>
              <p className="text-shell-muted mt-2 text-xs leading-6">
                {copy.campaigns.outputsPending}
              </p>
            </section>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
