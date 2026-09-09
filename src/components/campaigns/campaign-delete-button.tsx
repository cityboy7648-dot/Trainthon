"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { removeSavedCampaign } from "@/lib/data/campaign-workspace-actions";
import { copy } from "@/lib/copy";
import type { CampaignRequestState } from "@/lib/types";

export function CampaignDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const text = copy.campaignGallery;
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState<Extract<CampaignRequestState<null>, { ok: false }>>();
  function remove() {
    if (!window.confirm(text.deleteConfirm(name))) return;
    startTransition(async () => {
      const result = await removeSavedCampaign(id);
      if (result.ok) router.refresh();
      else setFailed(result);
    });
  }
  return (
    <>
      <button
        type="button"
        aria-label={text.delete(name)}
        disabled={pending}
        onClick={remove}
        className="border-campaign-border bg-background text-shell-muted hover:text-shell-ink focus-visible:ring-shell-ink absolute -top-2 -right-2 grid size-7 place-items-center rounded-full border opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 disabled:opacity-100"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
      {failed && (
        <div className="mt-2">
          <ErrorState code={failed.code} cause={failed.cause} onRetry={remove} />
        </div>
      )}
    </>
  );
}
