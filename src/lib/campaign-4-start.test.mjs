import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";

const product = {
  name: "선택 상품",
  image_url: "https://example.com/product.jpg",
  description: null,
  price: "10000",
};
const profile = {
  name: "브랜드",
  tagline: null,
  industry: null,
  logo_url: null,
  palette: [],
  font_feel: null,
  voice: null,
  mood_keywords: [],
  products: [product],
  target_audience: null,
  source_url: "https://example.com/",
  analyzed_at: "2026-09-09T00:00:00Z",
};
let inserts = [];
let inserted = null;
const brand = {
  id: "f19b4d55-508a-4818-bae0-71a1b357d339",
  user_id: "owner",
  profile,
};
globalThis.campaignFourClient = {
  auth: {
    async getUser() {
      return { data: { user: { id: "owner" } }, error: null };
    },
  },
  from(table) {
    const filters = [];
    const query = {
      select() {
        return query;
      },
      eq(key, value) {
        filters.push([key, value]);
        return query;
      },
      gte() {
        return query;
      },
      order() {
        return query;
      },
      limit() {
        return query;
      },
      insert(value) {
        inserts.push({ table, value });
        inserted = Array.isArray(value)
          ? value.map((row, index) => ({ id: `asset-${index + 1}`, ...row }))
          : { id: "run-1", ...value };
        return query;
      },
      async single() {
        return { data: inserted, error: null };
      },
      async maybeSingle() {
        return {
          data: filters.every(([key, value]) => brand[key] === value) ? brand : null,
          error: null,
        };
      },
      then(resolve, reject) {
        return Promise.resolve({ data: inserted, count: 0, error: null }).then(resolve, reject);
      },
    };
    return query;
  },
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/supabase/server")
      return {
        url: "data:text/javascript,export async function createSessionReader(){return globalThis.campaignFourClient;}",
        shortCircuit: true,
      };
    if (specifier === "@/lib/agents/real-usage/plan-campaign")
      return {
        url: "data:text/javascript,export async function planCampaign4(){ globalThis.campaignFourPlanCalls++; throw new Error('plan should wait for the detail page'); }",
        shortCircuit: true,
      };
    if (specifier.startsWith("@/"))
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return nextResolve(specifier, context);
  },
});
const { startCampaign4Run } = await import("./data/campaign-4.ts");

test("리얼 사용기 시작은 기획 전에 run과 이미지 5칸만 저장한다", async () => {
  globalThis.campaignFourPlanCalls = 0;
  inserts = [];
  const run = await startCampaign4Run({
    brandId: brand.id,
    productIndex: 0,
  });
  assert.equal(run.product.name, product.name);
  assert.equal(run.assets.length, 5);
  assert.equal(inserts[0].table, "runs");
  assert.equal(inserts[0].value.status, "pending");
  assert.equal(inserts[1].table, "assets");
  assert.equal(inserts[1].value.length, 5);
  assert.deepEqual(
    inserts[1].value.map((asset) => [asset.kind, asset.status, asset.meta.day, asset.meta.format]),
    [1, 2, 3, 4, 5].map((day) => ["image", "pending", day, "feed"]),
  );
  assert.ok(inserts[1].value.every((asset) => asset.meta.caption === null));
  assert.equal(globalThis.campaignFourPlanCalls, 0);
});

test("생성 시작 액션은 상세로 보낸 뒤 기획하고, 상세는 다른 캠페인과 같은 화면을 쓴다", () => {
  const action = readFileSync(new URL("./data/campaign-4-actions.ts", import.meta.url), "utf8");
  const result = readFileSync(
    new URL("../components/campaigns/campaign-workspace-result.tsx", import.meta.url),
    "utf8",
  );
  assert.match(action, /startCampaign4Run/);
  assert.match(action, /after\(\(\) => generateCampaign4\(run, /);
  assert.doesNotMatch(result, /real_usage|Campaign4/);
});
