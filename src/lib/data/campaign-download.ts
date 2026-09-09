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
  const files: CampaignArchiveFile[] = (
    await Promise.all(
      campaign.posts.map(async (post) => {
        const path = data.find((asset) => asset.id === post.id)?.storage_path;
        if (!path) return [];
        const downloaded = await client.storage.from("assets").download(path);
        if (downloaded.error) throw new AppError("network", campaignErrors.download);
        return [
          {
            name: `post-${String(post.meta.day).padStart(2, "0")}-${post.meta.position}.${path.endsWith(".jpg") ? "jpg" : "png"}`,
            bytes: new Uint8Array(await downloaded.data.arrayBuffer()),
          },
        ];
      }),
    )
  ).flat();
  if (files.reduce((sum, file) => sum + file.bytes.length, 0) > 100 * 1024 * 1024)
    throw new AppError("network", campaignErrors.download);
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
