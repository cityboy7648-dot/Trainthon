import "server-only";
import { ownedCampaign, getSavedCampaign } from "./campaign-workspace";
import { campaignZip } from "@/lib/campaign-zip";
import { campaignDate } from "@/lib/campaign-workspace";
import { AppError, campaignErrors } from "@/lib/errors";
import type { CampaignArchiveFile } from "@/lib/types";

export async function getCampaignArchive(runId: string): Promise<Uint8Array> {
  const { client } = await ownedCampaign(runId);
  const campaign = await getSavedCampaign(runId);
  const { data, error } = await client
    .from("assets")
    .select("id,storage_path")
    .eq("run_id", runId)
    .eq("status", "done")
    .eq("kind", "image");
  if (error || !data?.length) throw new AppError("not_found", campaignErrors.download);
  const files: CampaignArchiveFile[] = [];
  let total = 0;
  for (const post of campaign.posts) {
    const path = data.find((asset) => asset.id === post.id)?.storage_path;
    if (!path) continue;
    const downloaded = await client.storage.from("assets").download(path);
    if (downloaded.error) throw new AppError("network", campaignErrors.download);
    const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
    total += bytes.length;
    if (total > 100 * 1024 * 1024) throw new AppError("network", campaignErrors.download);
    files.push({
      name: `post-${String(post.meta.day).padStart(2, "0")}-${post.meta.position}.${path.endsWith(".jpg") ? "jpg" : "png"}`,
      bytes,
    });
  }
  files.push({
    name: "captions.txt",
    bytes: Buffer.from(
      campaign.posts
        .map(
          (post) =>
            `${campaignDate(campaign.startDate, post.meta.day)} 18:00 KST\n${post.meta.caption ?? ""}`,
        )
        .join("\n\n"),
    ),
  });
  return campaignZip(files);
}
