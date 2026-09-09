import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

let owner = null;
let calls = 0;
let failPlan = false;
let writes = [];
const input = {
  brandId: "a9d69a1d-dffe-4d9f-afb1-0a7539de1931",
  productIndex: 0,
  launchDate: "2026-10-01",
};
const product = {
  name: "상품",
  image_url: "https://example.com/product.png",
  description: null,
  price: null,
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
  source_url: "https://example.com",
  analyzed_at: "2026-09-09T00:00:00Z",
};
globalThis.campaign3TestClient = {
  auth: {
    async getUser() {
      return { data: { user: owner ? { id: owner } : null }, error: null };
    },
  },
  from(table) {
    const filters = {};
    const query = {
      select() {
        return query;
      },
      eq(key, value) {
        filters[key] = value;
        return query;
      },
      in() {
        return query;
      },
      insert(value) {
        writes.push({ table, value });
        return query;
      },
      update(value) {
        writes.push({ table, value });
        return query;
      },
      async maybeSingle() {
        return {
          data: filters.user_id === "owner" ? { id: input.brandId, profile } : null,
          error: null,
        };
      },
      async single() {
        return { data: { id: "saved" }, error: null };
      },
      then(resolve, reject) {
        return Promise.resolve({ error: null }).then(resolve, reject);
      },
    };
    return query;
  },
};
globalThis.planCampaign3Test = async () => {
  calls += 1;
  assert.ok(writes.some(({ table, value }) => table === "runs" && value.status === "pending"));
  if (failPlan) throw new Error("provider failure");
  return { output: { concept: "기획" }, usage: { calls: 1 }, schedule: [] };
};
registerHooks({
  resolve(specifier, context, next) {
    const sources = {
      "@/lib/supabase/server":
        "export async function createSessionWriter(){return globalThis.campaign3TestClient}",
      "@/lib/agents/drop-week/plan-campaign":
        "export const planCampaign3 = globalThis.planCampaign3Test",
      "@/lib/log": "export const log = {error(){}}",
    };
    if (sources[specifier])
      return {
        url: `data:text/javascript,${encodeURIComponent(sources[specifier])}`,
        shortCircuit: true,
      };
    if (specifier.startsWith("@/"))
      return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return next(specifier, context);
  },
});
const { createCampaign3Plan } = await import("./data/campaign-3.ts");

test("로그인 없음·다른 소유자·없는 상품은 비용 호출 전에 거부한다", async () => {
  for (const user of [null, "other"]) {
    owner = user;
    await assert.rejects(createCampaign3Plan(input));
  }
  owner = "owner";
  await assert.rejects(createCampaign3Plan({ ...input, productIndex: 99 }));
  assert.equal(calls, 0);
  assert.equal(writes.length, 0);
});
test("기획 성공은 asset에 결과를 저장하고 run을 완료로 오인하지 않는다", async () => {
  owner = "owner";
  writes = [];
  const result = await createCampaign3Plan(input);
  assert.equal(result.stage, "planned");
  assert.equal(writes.at(-1).value.status, "done");
  assert.equal(writes.at(-1).value.meta.launchDate, input.launchDate);
  assert.equal(writes.filter(({ table }) => table === "runs").length, 1);
});
test("AI 실패는 asset과 run 모두 실패 상태로 저장한다", async () => {
  writes = [];
  failPlan = true;
  await assert.rejects(createCampaign3Plan(input));
  assert.equal(writes.at(-2).value.status, "failed");
  assert.equal(writes.at(-1).table, "runs");
  assert.equal(writes.at(-1).value.status, "failed");
});
