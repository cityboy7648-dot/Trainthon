"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createSavedCampaign,
  getSavedCampaign,
  ownedCampaignAsset,
} from "@/lib/data/campaign-workspace";
import { campaignDate, validateCampaignImage } from "@/lib/campaign-workspace";
import { AppError, campaignErrors } from "@/lib/errors";
import { campaignEditSchema, campaignPostMetaSchema, type CampaignRequestState } from "@/lib/types";

function failure(error: unknown): CampaignRequestState<never> {
  return error instanceof AppError
    ? { ok: false, code: error.code, cause: error.cause }
    : {
        ok: false,
        code: "network",
        cause: error instanceof z.ZodError ? campaignErrors.request : campaignErrors.save,
      };
}

export async function refreshSavedCampaign(id: string) {
  try {
    return { ok: true as const, data: await getSavedCampaign(id) };
  } catch (error) {
    return failure(error);
  }
}

export async function selectSavedCampaign(input: unknown): Promise<CampaignRequestState<string>> {
  try {
    const id = await createSavedCampaign(input);
    revalidatePath("/campaigns");
    return { ok: true, data: id };
  } catch (error) {
    return failure(error);
  }
}

export async function editCampaignPost(input: unknown): Promise<CampaignRequestState<null>> {
  try {
    const parsed = campaignEditSchema.parse(input);
    const { client, asset } = await ownedCampaignAsset(parsed.runId, parsed.assetId);
    const meta = campaignPostMetaSchema.parse(asset.meta);
    const next =
      parsed.kind === "caption"
        ? { ...meta, caption: parsed.value }
        : { ...meta, start_date: campaignDate(parsed.value, 1) };
    // 시작일은 첫 게시물에만 저장해 전체 날짜가 한 번에 바뀌게 한다.
    if (parsed.kind === "date" && meta.day !== 1)
      throw new AppError("network", campaignErrors.request);
    const result = await client
      .from("assets")
      .update({ meta: next })
      .eq("id", asset.id)
      .eq("meta", JSON.stringify(asset.meta))
      .select("id")
      .maybeSingle();
    if (result.error || !result.data) throw new AppError("network", campaignErrors.conflict);
    revalidatePath(`/campaigns/${parsed.runId}`);
    return { ok: true, data: null };
  } catch (error) {
    return failure(error);
  }
}

export async function replaceCampaignImage(form: FormData): Promise<CampaignRequestState<null>> {
  try {
    const runId = z.uuid().parse(form.get("runId"));
    const assetId = z.uuid().parse(form.get("assetId"));
    const { client, asset } = await ownedCampaignAsset(runId, assetId);
    if (asset.status === "processing" || asset.status === "failed")
      throw new AppError("network", campaignErrors.conflict);
    const file = form.get("image");
    if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
      throw new AppError("generation_failed", campaignErrors.upload);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = validateCampaignImage(bytes, file.type);
    const path = `${runId}/${assetId}-${crypto.randomUUID()}.${extension}`;
    // Storage 정책이 assets.storage_path로 소유자를 확인하므로 업로드 전에 경로를 예약한다.
    let reserve = client
      .from("assets")
      .update({ storage_path: path })
      .eq("id", assetId)
      .eq("status", asset.status);
    reserve = asset.storage_path
      ? reserve.eq("storage_path", asset.storage_path)
      : reserve.is("storage_path", null);
    const reserved = await reserve.select("id").maybeSingle();
    if (reserved.error || !reserved.data) throw new AppError("network", campaignErrors.conflict);
    const upload = await client.storage
      .from("assets")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (upload.error) {
      const rollback = await client
        .from("assets")
        .update({ storage_path: asset.storage_path })
        .eq("id", assetId)
        .eq("storage_path", path)
        .select("id")
        .maybeSingle();
      if (rollback.error || !rollback.data) throw new AppError("network", campaignErrors.conflict);
      throw new AppError("network", campaignErrors.save);
    }
    const saved = await client
      .from("assets")
      .update({ status: "done" })
      .eq("id", assetId)
      .eq("storage_path", path)
      .select("id")
      .maybeSingle();
    if (saved.error || !saved.data) throw new AppError("network", campaignErrors.save);
    revalidatePath(`/campaigns/${runId}`);
    revalidatePath("/campaigns");
    return { ok: true, data: null };
  } catch (error) {
    return failure(error);
  }
}
