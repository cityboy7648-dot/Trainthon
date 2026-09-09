import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  CAMPAIGN_IMAGE_BUDGET_MS,
  CAMPAIGN_MAX_DURATION_SECONDS,
  CAMPAIGN_PLAN_CUTOFF_MS,
  CAMPAIGN_STALE_MS,
} from "./campaign-timeouts.ts";

test("생성 한도는 이미지 예산보다 길고 폴링 마감은 그 뒤에 온다", () => {
  assert.ok(CAMPAIGN_IMAGE_BUDGET_MS <= CAMPAIGN_MAX_DURATION_SECONDS * 1000);
  assert.ok(CAMPAIGN_STALE_MS > CAMPAIGN_MAX_DURATION_SECONDS * 1000);
  assert.ok(CAMPAIGN_PLAN_CUTOFF_MS < CAMPAIGN_IMAGE_BUDGET_MS);
});

test("캠페인 1·2·4·5 생성 경로의 실행 한도는 300초다", () => {
  for (const file of [
    "../app/api/campaigns/1/runs/route.ts",
    "../app/api/campaigns/2/runs/route.ts",
    "../app/api/campaigns/4/runs/route.ts",
    "../app/api/campaigns/5/runs/route.ts",
    "../app/(app)/campaigns/new/page.tsx",
  ]) {
    assert.match(readFileSync(new URL(file, import.meta.url), "utf8"), /maxDuration = 300/);
  }
});

// Vercel Hobby는 300초를 넘는 maxDuration이 있으면 빌드가 아니라 배포에서 거절한다.
test("app 라우트의 maxDuration은 Hobby 한도를 넘지 않는다", () => {
  const root = fileURLToPath(new URL("../app/", import.meta.url));
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue;
    const source = readFileSync(join(entry.parentPath, entry.name), "utf8");
    for (const [, value] of source.matchAll(/maxDuration = (\d+)/g)) {
      assert.ok(Number(value) <= CAMPAIGN_MAX_DURATION_SECONDS, `${entry.name}: ${value}`);
    }
  }
});
