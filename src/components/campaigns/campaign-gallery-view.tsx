"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, Globe, Camera, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { CampaignGalleryCard } from "./campaign-gallery-card";
import { filterCampaignGallery } from "@/lib/campaign-gallery";
import { copy } from "@/lib/copy";
import type { CampaignGalleryViewProps } from "@/lib/types";

export function CampaignGalleryView({ campaigns, preview }: CampaignGalleryViewProps) {
  const params = useSearchParams();
  const pathname = usePathname();
  const text = copy.campaignGallery;
  const status = params.get("status") === "done" ? "done" : "active";
  const channels = [...new Set(campaigns.flatMap((campaign) => campaign.channels))];
  const filtered = filterCampaignGallery(campaigns, new URLSearchParams(params.toString()));
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const hasFilters = ["q", "channel", "from", "to", "sort"].some((key) => params.has(key));
  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    window.history.replaceState(null, "", `${pathname}?${next}`);
  }
  const groups = [
    ...channels,
    ...(filtered.some((campaign) => !campaign.channels.length) ? [""] : []),
  ];
  return (
    <section
      data-source={preview ? "mock" : "server"}
      aria-label={text.title}
      className="mx-auto w-full max-w-screen-xl px-6 py-10 lg:px-8"
    >
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-shell-ink text-2xl font-semibold">{text.title}</h1>
        <Button
          render={<Link href="/campaigns/new" />}
          nativeButton={false}
          className="bg-shell-button hover:bg-shell-button-hover rounded-shell h-9 gap-2 px-4 text-xs text-white"
        >
          <Plus className="size-4" />
          {copy.campaigns.newCampaign}
        </Button>
      </header>
      <nav aria-label={text.status} className="border-shell-border flex gap-6 border-b">
        {(["active", "done"] as const).map((value) => (
          <button
            type="button"
            key={value}
            aria-current={status === value ? "page" : undefined}
            onClick={() => update("status", value)}
            data-selected={status === value}
            className="text-shell-icon data-[selected=true]:border-shell-ink data-[selected=true]:text-shell-ink flex items-center gap-2 border-b-2 border-transparent px-1 pb-4 text-sm data-[selected=true]:font-semibold"
          >
            {text[value]}
            <span className="bg-shell-active rounded-shell px-2 py-0.5 text-xs">
              {
                campaigns.filter((campaign) => (campaign.status === "done") === (value === "done"))
                  .length
              }
            </span>
          </button>
        ))}
      </nav>
      <div className="my-5 flex flex-wrap items-center gap-2">
        <label className="border-shell-border text-shell-icon rounded-shell flex h-9 min-w-48 flex-1 items-center gap-2 border px-3">
          <Search className="size-4" aria-hidden="true" />
          <input
            type="search"
            aria-label={text.search}
            placeholder={text.search}
            value={params.get("q") ?? ""}
            onChange={(event) => update("q", event.target.value)}
            className="text-shell-ink min-w-0 flex-1 bg-transparent text-xs outline-none"
          />
        </label>
        <details className="relative">
          <summary className="border-shell-border text-shell-muted rounded-shell flex h-9 cursor-pointer list-none items-center gap-2 border px-3 text-xs">
            <CalendarDays className="size-4" />
            {from || to ? `${from} – ${to}` : text.allDates}
          </summary>
          <div className="border-shell-border rounded-shell bg-background absolute right-0 z-10 mt-2 w-64 space-y-3 border p-4 shadow-sm">
            <p className="text-shell-muted text-xs">{text.dateHint}</p>
            <label className="block text-xs">
              {text.from}
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => update("from", event.target.value)}
                className="border-shell-border rounded-shell mt-1 w-full border p-2"
              />
            </label>
            <label className="block text-xs">
              {text.to}
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => update("to", event.target.value)}
                className="border-shell-border rounded-shell mt-1 w-full border p-2"
              />
            </label>
            {from && to && from > to && (
              <p role="alert" className="text-destructive text-xs">
                {text.invalidRange}
              </p>
            )}
          </div>
        </details>
        <select
          aria-label={text.sort}
          value={params.get("sort") ?? ""}
          onChange={(event) => update("sort", event.target.value)}
          className="border-shell-border text-shell-muted rounded-shell bg-background h-9 border px-3 text-xs"
        >
          <option value="">{text.newest}</option>
          <option value="deadline">{text.deadline}</option>
          <option value="name">{text.name}</option>
        </select>
        <select
          aria-label={text.channel}
          value={params.get("channel") ?? ""}
          onChange={(event) => update("channel", event.target.value)}
          className="border-shell-border text-shell-muted rounded-shell bg-background h-9 border px-3 text-xs"
        >
          <option value="">{text.allChannels}</option>
          {channels.map((channel) => (
            <option key={channel}>{channel}</option>
          ))}
        </select>
      </div>
      {hasFilters && (
        <div className="text-shell-muted mb-6 flex items-center gap-3 text-xs">
          <span aria-live="polite">{text.count(filtered.length)}</span>
          <button
            type="button"
            className="underline"
            onClick={() => window.history.replaceState(null, "", `${pathname}?status=${status}`)}
          >
            {text.reset}
          </button>
        </div>
      )}
      {!filtered.length ? (
        <EmptyState
          title={campaigns.length ? text.noResults : copy.campaignWorkspace.emptyCampaigns}
        />
      ) : (
        groups.map((channel) => {
          const items = filtered.filter((campaign) =>
            channel ? campaign.channels.includes(channel) : !campaign.channels.length,
          );
          if (!items.length || (params.get("channel") && params.get("channel") !== channel))
            return null;
          const Icon = channel === "Instagram" ? Camera : Globe;
          return (
            <section key={channel} className="mt-8" aria-label={channel || text.unknownChannel}>
              <h2 className="text-shell-ink mb-4 flex items-center gap-2 text-base font-semibold">
                <span className="bg-shell-active grid size-7 place-items-center rounded-lg">
                  <Icon className="size-4" />
                </span>
                {channel || text.unknownChannel}
              </h2>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {items.map((campaign) => (
                  <CampaignGalleryCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </section>
  );
}
