import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";

const runId = "b287625f-65d0-435e-b1fd-55b5c7e912ab";
const profile = {
  name: "브랜드",
  tagline: "한 줄",
  industry: "패션",
  logo_url: null,
  palette: ["#111111"],
  font_feel: "고딕",
  voice: "담백",
  mood_keywords: ["미니멀"],
  products: [
    {
      name: "셔츠",
      image_url: "https://example.com/shirt.png",
      description: "기본 셔츠",
      price: "39,000원",
    },
  ],
  target_audience: "20대",
  source_url: "https://example.com",
  analyzed_at: "2026-09-10T00:00:00.000Z",
};
const failedMeta = {
  day: 1,
  position: 1,
  format: "feed",
  caption: "캡션",
  error: "원인",
};
globalThis.retryState = {
  run: {
    id: runId,
    campaign_key: "signature_grid",
    status: "failed",
    brands: { profile },
  },
  images: [
    {
      id: "old",
      status: "failed",
      created_at: "2026-09-10T00:00:00Z",
      meta: failedMeta,
    },
  ],
  inserted: [],
  claimed: false,
};
globalThis.retryClient = {
  from(table) {
    const query = {
      _table: table,
      _update: null,
      _insert: null,
      select() {
        return query;
      },
      eq() {
        return query;
      },
      in() {
        return query;
      },
      update(value) {
        query._update = value;
        return query;
      },
      insert(value) {
        query._insert = value;
        return query;
      },
      async maybeSingle() {
        if (table === "runs" && query._update?.status === "processing") {
          if (globalThis.retryState.claimed || globalThis.retryState.run.status !== "failed")
            return { data: null, error: null };
          globalThis.retryState.claimed = true;
          globalThis.retryState.run.status = "processing";
          return { data: { id: runId }, error: null };
        }
        return { data: null, error: null };
      },
      then(resolve, reject) {
        if (table === "assets" && query._insert) {
          globalThis.retryState.inserted = query._insert.map((row, index) => ({
            id: `aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee${index}`,
            meta: row.meta,
          }));
          return Promise.resolve({ data: globalThis.retryState.inserted, error: null }).then(
            resolve,
            reject,
          );
        }
        if (table === "assets")
          return Promise.resolve({ data: globalThis.retryState.images, error: null }).then(
            resolve,
            reject,
          );
        return Promise.resolve({ error: null }).then(resolve, reject);
      },
    };
    return query;
  },
};
registerHooks({
  resolve(s, c, n) {
    if (s === "server-only") return { url: "data:text/javascript,export {}", shortCircuit: true };
    if (s === "@/lib/data/campaign-workspace")
      return {
        url: "data:text/javascript,export async function ownedCampaign(){return {client:globalThis.retryClient,run:globalThis.retryState.run}}",
        shortCircuit: true,
      };
    if (s === "@/lib/agents/signature-grid/generate")
      return {
        url: "data:text/javascript,export async function generateSignatureGrid(){}",
        shortCircuit: true,
      };
    if (s === "@/lib/agents/one-product-three-scenes/generate")
      return {
        url: "data:text/javascript,export async function generateCampaignTwo(){}",
        shortCircuit: true,
      };
    if (s === "@/lib/agents/complete-set/generate")
      return {
        url: "data:text/javascript,export async function generateCampaignFive(){}",
        shortCircuit: true,
      };
    if (s.startsWith("@/")) return n(new URL(`../${s.slice(2)}.ts`, import.meta.url).href, c);
    return n(s, c);
  },
});
const { prepareCampaignRetry } = await import("./data/campaign-retry.ts");

test("실패한 칸은 상태를 되돌리지 않고 새 행을 만든 뒤 같은 실행을 다시 돌린다", async () => {
  const job = await prepareCampaignRetry(runId);
  assert.equal(job.kind, "signature_grid");
  assert.equal(globalThis.retryState.images[0].status, "failed");
  assert.equal(globalThis.retryState.inserted.length, 1);
  assert.equal(globalThis.retryState.inserted[0].meta.error, null);
  assert.equal(globalThis.retryState.run.status, "processing");
  assert.equal(job.claimed.assets[0].id, globalThis.retryState.inserted[0].id);
});

test("생성 중이거나 실패한 실행이 아니면 재시도하지 않는다", async () => {
  globalThis.retryState.claimed = false;
  globalThis.retryState.inserted = [];
  globalThis.retryState.run.status = "processing";
  await assert.rejects(() => prepareCampaignRetry(runId));
  assert.equal(globalThis.retryState.inserted.length, 0);
  globalThis.retryState.run.status = "failed";
  globalThis.retryState.images[0].status = "processing";
  await assert.rejects(() => prepareCampaignRetry(runId));
  assert.equal(globalThis.retryState.inserted.length, 0);
  globalThis.retryState.images[0].status = "failed";
});

test("실패 화면은 다운로드 왼쪽에 재시도 버튼을 두고 백그라운드로 다시 생성한다", () => {
  const workspace = readFileSync(
    new URL("../components/campaigns/campaign-workspace.tsx", import.meta.url),
    "utf8",
  );
  const live = readFileSync(
    new URL("../components/campaigns/campaign-workspace-live.tsx", import.meta.url),
    "utf8",
  );
  const action = readFileSync(new URL("./data/campaign-retry-actions.ts", import.meta.url), "utf8");
  assert.ok(workspace.indexOf("c.retry") < workspace.indexOf("c.download"));
  assert.match(workspace, /bg-shell-button/);
  assert.match(live, /retryFailedCampaign/);
  assert.match(action, /after\(\(\) => executeCampaignRetry\(job\)\)/);
});
