import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { campaigns } from "@/definitions/campaigns";
import { createSessionReader } from "@/lib/supabase/server";
import { AppError, campaignErrors } from "@/lib/errors";
import { signatureSlots } from "@/lib/campaign-workspace";
import {
  campaignPostMetaSchema,
  campaign4SavedPlanSchema,
  campaignSelectionSchema,
  type SavedCampaign,
  type SavedCampaignCard,
} from "@/lib/types";

async function session() {
  const client = await createSessionReader();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new AppError("auth", campaignErrors.login);
  return { client, user };
}

export async function ownedCampaign(runId: string) {
  z.uuid().parse(runId);
  const { client, user } = await session();
  const { data: run, error } = await client
    .from("runs")
    .select("id, campaign_key, status, created_at, brands!inner(id, user_id, profile)")
    .eq("id", runId)
    .eq("brands.user_id", user.id)
    .maybeSingle();
  if (error) throw new AppError("network", campaignErrors.result);
  if (!run) throw new AppError("not_found", campaignErrors.result);
  return { client, run };
}

export async function createSavedCampaign(input: unknown): Promise<string> {
  const parsed = campaignSelectionSchema.parse(input);
  const { client, user } = await session();
  let query = client.from("brands").select("id").eq("user_id", user.id);
  if (parsed.sourceUrl) query = query.eq("source_url", parsed.sourceUrl);
  const { data: brand, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !brand) throw new AppError("not_found", campaignErrors.brand);
  const created = await client.from("runs").upsert(
    {
      id: parsed.requestId,
      brand_id: brand.id,
      campaign_key: parsed.key,
      reference_key: "campaign-1",
      status: "pending",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (created.error) throw new AppError("network", campaignErrors.create);
  const { run } = await ownedCampaign(parsed.requestId);
  if (run.campaign_key !== parsed.key || run.brands.id !== brand.id)
    throw new AppError("not_found", campaignErrors.create);
  const start = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const assets = signatureSlots(start).map((meta) => {
    const hash = createHash("sha256").update(`${run.id}:${meta.position}`).digest("hex");
    const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
    return { id, run_id: run.id, kind: "image", status: "pending", meta };
  });
  const inserted = await client
    .from("assets")
    .upsert(assets, { onConflict: "id", ignoreDuplicates: true });
  if (inserted.error) throw new AppError("network", campaignErrors.create);
  return run.id;
}

export async function getSavedCampaign4Plan(runId: string) {
  const { client, run } = await ownedCampaign(runId);
  if (run.campaign_key !== "real_usage") throw new AppError("not_found", campaignErrors.result);
  const { data, error } = await client
    .from("assets")
    .select("meta")
    .eq("run_id", run.id)
    .eq("kind", "caption")
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) throw new AppError("not_found", campaignErrors.result);
  const parsed = campaign4SavedPlanSchema.safeParse(data.meta);
  if (!parsed.success) throw new AppError("generation_failed", campaignErrors.result);
  return parsed.data;
}

export async function getSavedCampaign(runId: string): Promise<SavedCampaign> {
  const { client, run } = await ownedCampaign(runId);
  const definition = campaigns.find((item) => item.key === run.campaign_key);
  if (!definition) throw new AppError("not_found", campaignErrors.result);
  const { data, error } = await client
    .from("assets")
    .select("id, status, storage_path, meta")
    .eq("run_id", run.id)
    .eq("kind", "image");
  if (error) throw new AppError("network", campaignErrors.result);
  const posts = await Promise.all(
    (data ?? []).map(async (asset) => {
      const meta = campaignPostMetaSchema.parse(asset.meta);
      let image_url: string | null = null;
      if (asset.storage_path && asset.status === "done") {
        const signed = await client.storage
          .from("assets")
          .createSignedUrl(asset.storage_path, 3600);
        if (signed.error) throw new AppError("network", campaignErrors.result);
        image_url = signed.data.signedUrl;
      }
      return {
        id: asset.id,
        status: z.enum(["pending", "processing", "done", "failed"]).parse(asset.status),
        meta,
        image_url,
      };
    }),
  );
  posts.sort((a, b) => a.meta.day - b.meta.day || a.meta.position - b.meta.position);
  const profile = z.object({ name: z.string() }).parse(run.brands.profile);
  return {
    id: run.id,
    key: run.campaign_key,
    name: definition.name,
    brand: profile.name,
    status: run.status,
    startDate:
      posts.find((post) => post.meta.start_date)?.meta.start_date ?? run.created_at.slice(0, 10),
    posts,
  };
}

export async function listSavedCampaigns(): Promise<SavedCampaignCard[]> {
  const { client, user } = await session();
  const { data, error } = await client
    .from("runs")
    .select(
      "id, campaign_key, status, created_at, brands!inner(user_id, profile), assets(storage_path, status)",
    )
    .eq("brands.user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new AppError("network", campaignErrors.result);
  return Promise.all(
    (data ?? []).map(async (run) => {
      const definition = campaigns.find((item) => item.key === run.campaign_key);
      const profile = z.object({ name: z.string() }).parse(run.brands.profile);
      const path = run.assets.find(
        (asset) => asset.status === "done" && asset.storage_path,
      )?.storage_path;
      let image: string | null = definition?.image ?? null;
      if (path) {
        const signed = await client.storage.from("assets").createSignedUrl(path, 3600);
        if (signed.error) throw new AppError("network", campaignErrors.result);
        image = signed.data.signedUrl;
      }
      return {
        id: run.id,
        key: run.campaign_key,
        name: definition?.name ?? run.campaign_key,
        brand: profile.name,
        status: run.status,
        createdAt: run.created_at,
        image,
      };
    }),
  );
}

export async function ownedCampaignAsset(runId: string, assetId: string) {
  z.uuid().parse(assetId);
  const { client } = await ownedCampaign(runId);
  const { data: asset, error } = await client
    .from("assets")
    .select("id, meta, storage_path, status")
    .eq("id", assetId)
    .eq("run_id", runId)
    .eq("kind", "image")
    .maybeSingle();
  if (error || !asset) throw new AppError("not_found", campaignErrors.result);
  return { client, asset };
}
