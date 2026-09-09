"use client";
import { campaignErrors } from "@/lib/errors";
import type { CampaignRequestState, SavedCampaign, CampaignArchiveFile } from "@/lib/types";
import { campaignZip } from "@/lib/campaign-zip";
import { campaignDate } from "@/lib/campaign-workspace";

export async function downloadCampaignArchive(
  id: string,
  preview?: SavedCampaign,
): Promise<CampaignRequestState<null>> {
  try {
    let blob: Blob;
    if (preview) {
      const files: CampaignArchiveFile[] = [];
      for (const post of preview.posts) {
        if (!post.image_url) continue;
        const response = await fetch(post.image_url);
        if (!response.ok) throw new Error(campaignErrors.download);
        files.push({
          name: `post-${post.meta.day}.png`,
          bytes: new Uint8Array(await response.arrayBuffer()),
        });
      }
      files.push({
        name: "captions.txt",
        bytes: new TextEncoder().encode(
          preview.posts
            .map(
              (post) =>
                `${campaignDate(preview.startDate, post.meta.day)} 18:00 KST\n${post.meta.caption ?? ""}`,
            )
            .join("\n\n"),
        ),
      });
      blob = new Blob([new Uint8Array(campaignZip(files))], { type: "application/zip" });
    } else {
      const response = await fetch(`/api/campaigns/${encodeURIComponent(id)}/download`);
      if (!response.ok) return { ok: false, code: "network", cause: campaignErrors.download };
      blob = await response.blob();
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `campaign-${id}.zip`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, data: null };
  } catch {
    return { ok: false, code: "network", cause: campaignErrors.download };
  }
}
