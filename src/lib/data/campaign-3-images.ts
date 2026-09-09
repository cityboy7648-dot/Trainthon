import { z } from "zod";
import { createSessionWriter, createSessionReader } from "@/lib/supabase/server";
import { createCampaign3Plan } from "./campaign-3";
import { dropWeekImageSlots } from "@/lib/agents/drop-week/image-slots";
import { generateDropWeekImage } from "@/lib/agents/drop-week/generate-image";
import { AppError, campaign3Errors } from "@/lib/errors";
import { log } from "@/lib/log";
import {
  brandProfileSchema,
  campaign3ImageMetaSchema,
  campaign3RequestSchema,
  type Campaign3Brand,
  type Campaign3Result,
  type Campaign3Asset,
} from "@/lib/types";

export async function getCampaign3Brands(): Promise<Campaign3Brand[]> {
  const client = await createSessionReader();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new AppError("auth");
  const { data, error } = await client
    .from("brands")
    .select("id, profile")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new AppError("network", campaign3Errors.brand);
  return (data ?? []).map((brand) => {
    const profile = brandProfileSchema.parse(brand.profile);
    return { id: brand.id, name: profile.name, products: profile.products };
  });
}

export async function getRecentDropWeeks() {
  const client = await createSessionReader();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new AppError("auth");
  const { data, error } = await client
    .from("runs")
    .select("id,created_at,brands!inner(user_id)")
    .eq("campaign_key", "drop_week")
    .eq("brands.user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw new AppError("network", campaign3Errors.save);
  return (data ?? []).map(({ id, created_at }) => ({ id, date: created_at.slice(0, 10) }));
}

async function ownedRun(runId: string) {
  if (!z.uuid().safeParse(runId).success) throw new AppError("invalid_request");
  const client = await createSessionWriter();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new AppError("auth");
  const run = await client
    .from("runs")
    .select("id, status, brands!inner(user_id)")
    .eq("id", runId)
    .eq("campaign_key", "drop_week")
    .eq("brands.user_id", user.id)
    .maybeSingle();
  if (run.error) throw new AppError("network", campaign3Errors.save);
  if (!run.data) throw new AppError("not_found");
  return client;
}

export async function startCampaign3Run(input: unknown) {
  const parsed = campaign3RequestSchema.safeParse(input);
  if (!parsed.success) throw new AppError("invalid_request");
  const result = await createCampaign3Plan(parsed.data);
  const client = await ownedRun(result.runId);
  const slots = dropWeekImageSlots(result.plan, result.product, parsed.data.launchDate);
  const { error } = await client.from("assets").insert(
    slots.map((meta) => ({
      run_id: result.runId,
      kind: "image",
      status: "pending",
      meta,
    })),
  );
  if (error) {
    await client
      .from("runs")
      .update({ status: "failed" })
      .eq("id", result.runId)
      .eq("status", "pending");
    throw new AppError("network", campaign3Errors.save);
  }
  const started = await client
    .from("runs")
    .update({ status: "processing" })
    .eq("id", result.runId)
    .eq("status", "pending");
  if (started.error) throw new AppError("network", campaign3Errors.save);
  return { runId: result.runId };
}

export async function getCampaign3Result(runId: string): Promise<Campaign3Result> {
  const client = await ownedRun(runId);
  const { data, error } = await client
    .from("assets")
    .select("id,status,storage_path,meta,created_at")
    .eq("run_id", runId)
    .eq("kind", "image")
    .order("created_at");
  if (error) throw new AppError("network", campaign3Errors.save);
  const latest = new Map<number, Campaign3Asset>();
  for (const row of data ?? []) {
    const meta = campaign3ImageMetaSchema.parse(row.meta);
    let status = z.enum(["pending", "processing", "done", "failed"]).parse(row.status);
    if (
      status === "processing" &&
      meta.startedAt &&
      Date.now() - Date.parse(meta.startedAt) > 180_000
    ) {
      const changed = await client
        .from("assets")
        .update({ status: "failed", meta: { ...meta, error: campaign3Errors.timeout } })
        .eq("id", row.id)
        .eq("status", "processing")
        .select("id")
        .maybeSingle();
      if (changed.error) throw new AppError("network", campaign3Errors.save);
      if (changed.data) {
        status = "failed";
        meta.error = campaign3Errors.timeout;
      }
    }
    let imageUrl: string | null = null;
    if (status === "done" && row.storage_path) {
      const signed = await client.storage.from("assets").createSignedUrl(row.storage_path, 3600);
      if (signed.error) throw new AppError("network", campaign3Errors.save);
      imageUrl = signed.data.signedUrl;
    }
    latest.set(meta.position, { id: row.id, status, imageUrl, meta });
  }
  return { runId, assets: [...latest.values()].sort((a, b) => a.meta.position - b.meta.position) };
}

export async function generateCampaign3Asset(runId: string, assetId: string) {
  if (!z.uuid().safeParse(assetId).success) throw new AppError("invalid_request");
  const client = await ownedRun(runId);
  const selected = await client
    .from("assets")
    .select("id,meta")
    .eq("id", assetId)
    .eq("run_id", runId)
    .eq("kind", "image")
    .eq("status", "pending")
    .maybeSingle();
  if (selected.error) throw new AppError("network", campaign3Errors.save);
  if (!selected.data) return;
  const meta = {
    ...campaign3ImageMetaSchema.parse(selected.data.meta),
    startedAt: new Date().toISOString(),
  };
  const path = `${runId}/${assetId}.png`;
  const claim = await client
    .from("assets")
    .update({ status: "processing", meta, storage_path: path })
    .eq("id", assetId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (claim.error) throw new AppError("network", campaign3Errors.save);
  if (!claim.data) return;
  const context = { requestId: crypto.randomUUID(), runId, assetId };
  try {
    const bytes = await generateDropWeekImage(meta, context);
    const upload = await client.storage
      .from("assets")
      .upload(path, bytes, { contentType: "image/png", upsert: false });
    if (upload.error) throw new AppError("network", campaign3Errors.save);
    const done = await client
      .from("assets")
      .update({ status: "done", meta })
      .eq("id", assetId)
      .eq("status", "processing")
      .select("id")
      .maybeSingle();
    if (done.error || !done.data) throw new AppError("network", campaign3Errors.save);
  } catch (error) {
    const failure =
      error instanceof AppError ? error : new AppError("generation_failed", campaign3Errors.image);
    const saved = await client
      .from("assets")
      .update({
        status: "failed",
        meta: { ...meta, error: failure.cause ?? campaign3Errors.image },
      })
      .eq("id", assetId)
      .eq("status", "processing");
    log.error("campaign3.image_failed", context, {
      code: failure.code,
      statusSaveFailed: Boolean(saved.error),
    });
    if (saved.error) throw new AppError("network", campaign3Errors.failureSave);
  }
  const result = await getCampaign3Result(runId);
  if (result.assets.length === 10 && result.assets.every((asset) => asset.status === "done")) {
    const complete = await client
      .from("runs")
      .update({ status: "done" })
      .eq("id", runId)
      .eq("status", "processing");
    if (complete.error) throw new AppError("network", campaign3Errors.save);
  }
}

export async function retryCampaign3Asset(runId: string, assetId: string) {
  const result = await getCampaign3Result(runId);
  const asset = result.assets.find((item) => item.id === assetId && item.status === "failed");
  if (!asset) throw new AppError("invalid_request");
  const client = await ownedRun(runId);
  const retry = await client.from("assets").insert({
    run_id: runId,
    kind: "image",
    status: "pending",
    meta: { ...asset.meta, error: null, startedAt: null, retryOf: asset.id },
  });
  if (retry.error && retry.error.code !== "23505")
    throw new AppError("network", campaign3Errors.save);
}

export async function finishCampaign3Images(runId: string) {
  const result = await getCampaign3Result(runId);
  const pending = result.assets.filter((asset) => asset.status === "pending");
  for (let index = 0; index < pending.length; index += 2) {
    await Promise.all(
      pending.slice(index, index + 2).map((asset) => generateCampaign3Asset(runId, asset.id)),
    );
  }
}
