"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CampaignWorkspace } from "./campaign-workspace";
import { campaignDate, validateCampaignImage } from "@/lib/campaign-workspace";
import { previewCampaign } from "@/mock/campaign-workspace"; // MOCK
import { AppError, campaignErrors } from "@/lib/errors";
import type { CampaignPreviewEdit } from "@/lib/types";

export function CampaignWorkspacePreview() {
  const params = useSearchParams();
  const [campaign, setCampaign] = useState(() =>
    params.get("state") === "generating"
      ? {
          ...previewCampaign,
          status: "processing",
          posts: previewCampaign.posts.map((post, index) =>
            index < 3
              ? post
              : {
                  ...post,
                  status: "processing" as const,
                  image_url: null,
                  meta: { ...post.meta, caption: null },
                },
          ),
        }
      : previewCampaign,
  );
  const edit: CampaignPreviewEdit = async (kind, id, form) => {
    if (kind === "date") {
      const date = campaignDate(String(form.get("value")), 1);
      setCampaign((current) => ({ ...current, startDate: date }));
      return;
    }
    let image: string | undefined;
    if (kind === "image") {
      const file = form.get("image");
      if (!(file instanceof File)) throw new AppError("generation_failed", campaignErrors.upload);
      validateCampaignImage(new Uint8Array(await file.arrayBuffer()), file.type);
      image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    setCampaign((current) => ({
      ...current,
      posts: current.posts.map((post) =>
        post.id !== id
          ? post
          : {
              ...post,
              ...(image ? { image_url: image } : {}),
              meta: {
                ...post.meta,
                ...(kind === "caption" ? { caption: String(form.get("value")) } : {}),
              },
            },
      ),
    }));
  };
  return <CampaignWorkspace campaign={campaign} onPreviewEdit={edit} />;
}
