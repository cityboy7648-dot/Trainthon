"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { editCampaignPost, replaceCampaignImage } from "@/lib/data/campaign-workspace-actions";
import { showErrorNotice } from "@/lib/error-notice";
import { copy } from "@/lib/copy";
import type { CampaignPostEditorProps } from "@/lib/types";

export function CampaignPostEditor({
  campaign,
  post,
  kind,
  onClose,
  onPreviewEdit,
}: CampaignPostEditorProps) {
  const [pending, startTransition] = useTransition();
  const c = copy.campaignWorkspace;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogTitle>{c[kind]}</DialogTitle>
        <DialogDescription>
          {kind === "date" ? c.dateHint : kind === "image" ? c.imageHint : c.captionHint}
        </DialogDescription>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            startTransition(async () => {
              try {
                if (onPreviewEdit) {
                  await onPreviewEdit(kind, post.id, form);
                  onClose();
                  return;
                }
                form.set("runId", campaign.id);
                form.set("assetId", post.id);
                const result =
                  kind === "image"
                    ? await replaceCampaignImage(form)
                    : await editCampaignPost({
                        runId: campaign.id,
                        assetId: post.id,
                        kind,
                        value: form.get("value"),
                      });
                if (result.ok) onClose();
                else showErrorNotice(result.code, result.cause);
              } catch {
                showErrorNotice("network");
              }
            });
          }}
          className="space-y-5"
        >
          {kind === "caption" ? (
            <textarea
              aria-label={c.caption}
              name="value"
              maxLength={2200}
              defaultValue={post.meta.caption ?? ""}
              rows={7}
              className="border-shell-border rounded-shell w-full border p-3 text-sm"
            />
          ) : kind === "date" ? (
            <input
              aria-label={c.dateLabel}
              type="date"
              name="value"
              required
              defaultValue={campaign.startDate}
              className="border-shell-border rounded-shell h-11 w-full border px-3"
            />
          ) : (
            <input
              aria-label={c.image}
              type="file"
              name="image"
              accept="image/png,image/jpeg"
              required
              className="border-shell-border rounded-shell w-full border p-3 text-sm"
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
              {c.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? c.saving : c.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
