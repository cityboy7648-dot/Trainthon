import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/"))
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return nextResolve(specifier, context);
  },
});
const { campaignGenerationTimedOut, latestAssetsByPosition } =
  await import("./campaign-workspace.ts");

test("같은 위치의 재시도 행은 마지막 상태만 남긴다", () => {
  const latest = latestAssetsByPosition([
    { id: "old", created_at: "2026-09-10T00:00:00Z", meta: { position: 1 } },
    { id: "retry", created_at: "2026-09-10T00:01:00Z", meta: { position: 1 } },
    { id: "other", created_at: "2026-09-10T00:00:30Z", meta: { position: 2 } },
  ]);
  assert.deepEqual(
    latest.map((asset) => asset.id),
    ["retry", "other"],
  );
});

test("생성 제한 시간은 재시도로 생긴 대기 행 기준으로 본다", () => {
  const now = Date.parse("2026-09-10T00:10:00Z");
  const realNow = Date.now;
  Date.now = () => now;
  try {
    assert.equal(
      campaignGenerationTimedOut("2026-09-10T00:00:00Z", [
        { status: "failed", created_at: "2026-09-10T00:00:00Z" },
        { status: "pending", created_at: "2026-09-10T00:09:00Z" },
      ]),
      false,
    );
    assert.equal(
      campaignGenerationTimedOut("2026-09-10T00:00:00Z", [
        { status: "pending", created_at: "2026-09-10T00:00:00Z" },
      ]),
      true,
    );
  } finally {
    Date.now = realNow;
  }
});

test("실패 화면은 같은 실행을 다시 돌린다", () => {
  const result = readFileSync(
    new URL("../components/campaigns/campaign-4-result.tsx", import.meta.url),
    "utf8",
  );
  const preview = readFileSync(
    new URL("../components/campaigns/campaign-post-preview.tsx", import.meta.url),
    "utf8",
  );
  const list = readFileSync(
    new URL("../components/dashboard/dashboard-campaign-list.tsx", import.meta.url),
    "utf8",
  );
  const action = readFileSync(new URL("./data/campaign-retry-actions.ts", import.meta.url), "utf8");
  assert.match(result, /retryFailedCampaign/);
  assert.match(result, /retryFailedCampaignAsset/);
  assert.match(preview, /onRetry=\{onRetry\}/);
  assert.match(list, /DashboardCampaignFailure/);
  assert.match(action, /after\(\(\) => executeCampaignRetry\(job\)\)/);
});
