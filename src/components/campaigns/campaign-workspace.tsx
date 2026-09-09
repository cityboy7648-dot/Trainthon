"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronRight, Download, ImageIcon, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignGenerationProgress } from "./campaign-generation-progress";
import { CampaignPostPreview } from "./campaign-post-preview";
import { CampaignPostEditor } from "./campaign-post-editor";
import { CampaignBackButton } from "./campaign-back-button";
import {
  campaignDate,
  campaignProgress,
  isGeneratedCampaign,
  previewModes,
} from "@/lib/campaign-workspace";
import { copy } from "@/lib/copy";
import { downloadCampaignArchive } from "@/lib/data/campaign-download-client";
import { showErrorNotice } from "@/lib/error-notice";
import type { CampaignWorkspaceProps } from "@/lib/types";

export function CampaignWorkspace({ campaign, onPreviewEdit, onRetry }: CampaignWorkspaceProps) {
  const params = useSearchParams();
  const pathname = usePathname();
  const [editing, setEditing] = useState<"caption" | "image" | "date" | null>(null);
  const [downloading, startDownload] = useTransition();
  const [retrying, startRetry] = useTransition();
  const modes = previewModes(campaign.key);
  const selected =
    campaign.posts.find((post) => post.id === params.get("post")) ?? campaign.posts[0];
  const mode = modes.find((mode) => mode === params.get("view")) ?? modes[0];
  const previewPost =
    selected?.meta.format === mode
      ? selected
      : campaign.posts.find(
          (post) => post.meta.day === selected?.meta.day && post.meta.format === mode,
        );
  const shown = mode === "grid" ? selected : previewPost;
  const generatedCampaign = isGeneratedCampaign(campaign.key);
  const progress = campaignProgress(campaign.posts);
  const editLocked =
    generatedCampaign && !!shown && ["pending", "processing"].includes(shown.status);
  const dateLocked =
    generatedCampaign && ["pending", "processing"].includes(campaign.posts[0]?.status);
  const canRetry =
    Boolean(onRetry) &&
    generatedCampaign &&
    !onPreviewEdit &&
    !progress.active &&
    (campaign.status === "failed" || progress.failed > 0);
  const c = copy.campaignWorkspace;
  function choose(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    if (key === "post") {
      const post = campaign.posts.find((post) => post.id === value);
      if (post) next.set("view", post.meta.format);
    }
    window.history.replaceState(null, "", `${pathname}?${next}`);
  }
  return (
    <div
      data-source={onPreviewEdit ? "mock" : "server"}
      className="font-shell bg-shell-background text-shell-ink mx-auto flex h-dvh min-h-0 w-full max-w-screen-2xl flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8 lg:py-6"
    >
      <CampaignBackButton />
      <header className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <h1 className="text-2xl leading-9 font-semibold tracking-tight">{campaign.name}</h1>
          <span className="bg-shell-background text-shell-muted rounded-full px-4 py-1 text-xs font-medium">
            {c.status[campaign.status as keyof typeof c.status] ?? c.status.pending}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canRetry && (
            <Button
              disabled={retrying}
              className="bg-shell-button hover:bg-shell-button-hover rounded-shell h-9 gap-2 px-4 text-xs text-white"
              onClick={() =>
                startRetry(async () => {
                  await onRetry?.();
                })
              }
            >
              <RotateCcw className="size-4" />
              {retrying ? c.retrying : c.retry}
            </Button>
          )}
          {onPreviewEdit ? (
            <Button
              variant="outline"
              disabled={downloading || !campaign.posts.some((p) => p.image_url)}
              className="bg-background rounded-shell h-9 gap-2 px-4 text-xs"
              onClick={() =>
                startDownload(async () => {
                  const result = await downloadCampaignArchive(campaign);
                  if (!result.ok) showErrorNotice(result.code, result.cause);
                })
              }
            >
              <Download className="size-4" />
              {downloading ? c.downloading : c.download}
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={!campaign.posts.some((p) => p.image_url)}
              nativeButton={false}
              render={
                <a
                  href={`/api/campaigns/${encodeURIComponent(campaign.id)}/download`}
                  download={`campaign-${campaign.id}.zip`}
                />
              }
              className="bg-background rounded-shell h-9 gap-2 px-4 text-xs"
            >
              <Download className="size-4" />
              {c.download}
            </Button>
          )}
        </div>
      </header>
      <CampaignGenerationProgress campaign={campaign} />
      <div className="grid min-h-0 flex-1 grid-rows-2 gap-5 lg:grid-cols-2 lg:grid-rows-1">
        <section
          className="border-shell-border rounded-campaign-card bg-background flex min-h-0 min-w-0 flex-col overflow-hidden border p-4 sm:p-5"
          aria-labelledby="schedule-heading"
        >
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h2 id="schedule-heading" className="text-base font-semibold">
                {copy.campaigns.schedule}
              </h2>
              <span className="text-shell-icon text-xs">{c.count(campaign.posts.length)}</span>
            </div>
            <Button
              variant="outline"
              disabled={!selected || dateLocked}
              onClick={() => setEditing("date")}
            >
              <CalendarDays className="size-4" />
              {c.date}
            </Button>
          </div>
          <div
            data-campaign-schedule
            className="border-shell-border min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain border-t"
          >
            {campaign.posts.map((post) => {
              const date = c.dateParts(campaignDate(campaign.startDate, post.meta.day));
              return (
                <button
                  key={post.id}
                  type="button"
                  aria-pressed={post.id === selected?.id}
                  onClick={() => choose("post", post.id)}
                  data-selected={post.id === selected?.id}
                  className="border-shell-border hover:bg-shell-background data-[selected=true]:border-l-shell-ink data-[selected=true]:bg-shell-background flex w-full items-center gap-3 border-b border-l-4 border-l-transparent px-3 py-3 text-left"
                >
                  <div className="w-16 shrink-0 sm:w-20">
                    <p className="text-sm font-semibold">{date.date}</p>
                    <p className="text-shell-icon mt-1 text-xs">
                      {date.weekday} · {c.time}
                    </p>
                  </div>
                  <div className="bg-shell-active rounded-shell relative size-12 shrink-0 overflow-hidden sm:size-16">
                    {post.image_url ? (
                      <Image
                        src={post.image_url}
                        alt={post.meta.title ?? c.post(post.meta.day)}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : post.status === "pending" || post.status === "processing" ? (
                      <Skeleton className="size-full" />
                    ) : (
                      <ImageIcon
                        className="text-shell-icon absolute inset-0 m-auto size-5"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {post.status === "pending" || post.status === "processing" ? (
                      <Skeleton className="h-4 w-3/4" />
                    ) : (
                      <p className="line-clamp-2 text-sm font-semibold">
                        {post.meta.title ?? c.post(post.meta.day)}
                      </p>
                    )}
                    <p className="text-shell-icon mt-1 text-xs">
                      {post.meta.format === "pinterest" ? c.modes.pinterest : c.channel} ·{" "}
                      {c.modes[post.meta.format]}
                    </p>
                  </div>
                  <span className="bg-shell-active text-shell-muted hidden shrink-0 rounded-full px-3 py-1 text-xs sm:block">
                    {c.status[post.status]}
                  </span>
                  <ChevronRight className="text-shell-icon size-4 shrink-0" />
                </button>
              );
            })}
          </div>
        </section>
        <section
          className="border-shell-border rounded-campaign-card bg-background flex min-h-0 min-w-0 flex-col overflow-hidden border p-4 sm:p-5"
          aria-labelledby="preview-heading"
        >
          <h2 id="preview-heading" className="mb-3 shrink-0 text-base font-semibold">
            {c.preview}
          </h2>
          <div
            className="border-shell-border mb-3 flex shrink-0 items-center gap-5 border-b"
            role="group"
            aria-label={c.preview}
          >
            {modes.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={mode === item}
                onClick={() => choose("view", item)}
                className={
                  mode === item
                    ? "border-shell-ink border-b-2 px-2 pb-3 text-sm font-semibold"
                    : "text-shell-icon border-b-2 border-transparent px-2 pb-3 text-sm"
                }
              >
                {c.modes[item]}
              </button>
            ))}
            <span className="text-shell-icon ml-auto pb-3 text-xs">
              {campaign.key === "signature_grid"
                ? "1:1"
                : mode === "story"
                  ? "9:16"
                  : mode === "pinterest"
                    ? "2:3"
                    : "4:5"}
            </span>
          </div>
          <div className="@container-size min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
            <div
              className={`mx-auto max-w-full ${mode === "story" ? "w-campaign-preview-story" : campaign.key === "signature_grid" || mode === "grid" ? "w-campaign-preview" : "w-campaign-preview-portrait"}`}
            >
              <CampaignPostPreview campaign={campaign} post={shown} mode={mode} />
              {shown && mode !== "grid" && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-10"
                    disabled={editLocked || shown.status === "processing"}
                    onClick={() => setEditing("image")}
                  >
                    <ImageIcon className="size-4" />
                    {c.image}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10"
                    disabled={editLocked}
                    onClick={() => setEditing("caption")}
                  >
                    <Pencil className="size-4" />
                    {c.caption}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      {editing && selected && (
        <CampaignPostEditor
          key={`${editing}-${shown?.id}`}
          campaign={campaign}
          post={editing === "date" ? campaign.posts[0] : (shown ?? selected)}
          kind={editing}
          onClose={() => setEditing(null)}
          onPreviewEdit={onPreviewEdit}
        />
      )}
    </div>
  );
}
