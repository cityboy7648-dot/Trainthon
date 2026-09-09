import { campaigns as catalog } from "@/definitions/campaigns";
import { copy } from "@/lib/copy";
import { AppError, campaignErrors } from "@/lib/errors";
import { createSessionReader } from "@/lib/supabase/server";
import {
  dashboardAssetMetaSchema,
  type CampaignRequestState,
  type DashboardCampaign,
  type DashboardData,
  type DashboardStoredRun,
} from "@/lib/types";

export async function getDashboardData(): Promise<CampaignRequestState<DashboardData>> {
  try {
    const client = await createSessionReader();
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || !auth.user) throw new AppError("auth", campaignErrors.dashboardLogin);

    const runs: DashboardStoredRun[] = [];
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await client
        .from("runs")
        .select(
          "id, campaign_key, status, created_at, brands!inner(user_id), assets(id, kind, status, storage_path, created_at, day:meta->day, position:meta->position, upload_order:meta->upload_order, title:meta->>title, caption:meta->>caption, stage:meta->>stage, role:meta->>role, completed_at:meta->>completed_at)",
        )
        .eq("brands.user_id", auth.user.id)
        .in(
          "campaign_key",
          catalog.map((campaign) => campaign.key),
        )
        .order("created_at", { ascending: false })
        .order("id")
        .range(offset, offset + 99);
      if (error) throw new AppError("network", campaignErrors.dashboard);
      runs.push(
        ...data.map((run) => ({
          ...run,
          assets: run.assets.map((asset) => {
            const parsed = dashboardAssetMetaSchema.safeParse(asset);
            if (!parsed.success)
              throw new AppError("invalid_request", campaignErrors.dashboardData);
            return { ...asset, meta: parsed.data };
          }),
        })),
      );
      if (data.length < 100) break;
    }

    const campaigns: DashboardCampaign[] = [];
    const tasks = runs.flatMap((run) => {
      const definition = catalog.find((campaign) => campaign.key === run.campaign_key);
      if (!definition) throw new AppError("not_found", campaignErrors.dashboardData);
      const images = run.assets
        .filter((asset) => asset.kind === "image")
        .filter((asset) => asset.meta.stage !== "planning" && asset.meta.role !== "preview");

      const completed = definition.schedule.flatMap((slot) => {
        const dayImages = images
          .filter((asset) => (asset.meta.day ?? asset.meta.upload_order) === slot.day)
          .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
        // 재시도 행은 같은 산출물 위치의 마지막 상태만 센다.
        const latest = [
          ...new Map(dayImages.map((asset) => [asset.meta.position ?? asset.id, asset])).values(),
        ].sort((a, b) => (a.meta.position ?? 0) - (b.meta.position ?? 0));
        if (
          latest.length !== slot.image_count ||
          latest.some((asset) => asset.status !== "done" || !asset.storage_path) ||
          !latest.some((asset) => asset.meta.caption)
        )
          return [];
        const first = latest[0];
        return [
          {
            id: `${run.id}-${slot.day}`,
            title: copy.dashboard.taskTitle(slot.day, first.meta.title || slot.purpose),
            campaignName: definition.name,
            storagePath: first.storage_path!,
            // 이전 기록에는 완료 시각이 없어 생성 시각으로 정렬한다. 완료 날짜로 표시하지 않는다.
            completedAt: latest
              .map((asset) => asset.meta.completed_at ?? asset.created_at)
              .sort()
              .at(-1)!,
          },
        ];
      });

      campaigns.push({
        id: run.id,
        name: definition.name,
        completedTasks: completed.length,
        totalTasks: definition.schedule.length,
        failed: run.status === "failed" || images.some((asset) => asset.status === "failed"),
        href: ["one_product_three_scenes", "complete_set", "real_usage"].includes(run.campaign_key)
          ? `/campaigns/new?${new URLSearchParams({ campaign: run.campaign_key, run: run.id })}`
          : null,
      });
      return completed;
    });

    const recentTasks = await Promise.all(
      tasks
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt) || a.id.localeCompare(b.id))
        .slice(0, 20)
        .map(async ({ storagePath, ...task }) => {
          try {
            const { data, error } = await client.storage
              .from("assets")
              .createSignedUrl(storagePath, 3600);
            return { ...task, imageUrl: error ? null : (data?.signedUrl ?? null) };
          } catch {
            // 사진 오류는 해당 작업에서 표시하고 캠페인 집계는 유지한다.
            return { ...task, imageUrl: null };
          }
        }),
    );

    return { ok: true, data: { recentTasks, campaigns } };
  } catch (error) {
    return {
      ok: false,
      code: error instanceof AppError ? error.code : "network",
      cause: error instanceof AppError ? error.cause : campaignErrors.dashboard,
    };
  }
}
