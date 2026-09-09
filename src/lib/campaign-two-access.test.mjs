import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";
import { campaignProductKey } from "./campaign-product.ts";

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
let owner = null;
let inserts = [];
const brand = { id: "f19b4d55-508a-4818-bae0-71a1b357d339", user_id: "owner", profile };
globalThis.campaignAccessClient = {
  auth: {
    async getUser() {
      return { data: { user: owner ? { id: owner } : null } };
    },
  },
  from(table) {
    const filters = [];
    let inserted;
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
        inserted = value;
        inserts.push({ table, value });
        return query;
      },
      async maybeSingle() {
        return {
          data: filters.every(([key, value]) => brand[key] === value) ? brand : null,
          error: null,
        };
      },
      async single() {
        return { data: { id: "run-id" }, error: null };
      },
      then(resolve, reject) {
        return Promise.resolve({
          data:
            table === "assets" && inserted
              ? inserted.map((row, i) => ({ id: String(i), meta: row.meta }))
              : null,
          count: 0,
          error: null,
        }).then(resolve, reject);
      },
    };
    return query;
  },
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/supabase/server")
      return {
        url: "data:text/javascript,export async function createSessionWriter(){return globalThis.campaignAccessClient;}",
        shortCircuit: true,
      };
    if (specifier.startsWith("@/"))
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return nextResolve(specifier, context);
  },
});
const { createCampaignTwoRun } = await import("./data/campaign-two.ts");
const input = { brand_id: brand.id, product_key: campaignProductKey(product) };

test("로그인 없거나 다른 사람 브랜드면 run을 만들지 않는다", async () => {
  for (const user of [null, "other-owner"]) {
    owner = user;
    inserts = [];
    await assert.rejects(createCampaignTwoRun(input));
    assert.equal(inserts.length, 0);
  }
});

test("변조된 상품 키는 비용 작업 전에 거부한다", async () => {
  owner = "owner";
  inserts = [];
  await assert.rejects(createCampaignTwoRun({ ...input, product_key: "0".repeat(64) }));
  assert.equal(inserts.length, 0);
});

test("확정 상품 스냅샷을 정확한 5일 일정의 10개 asset에 저장한다", async () => {
  owner = "owner";
  inserts = [];
  const run = await createCampaignTwoRun(input);
  assert.deepEqual(run.product, product);
  assert.equal(inserts[0].table, "runs");
  assert.equal(inserts[0].value.campaign_key, "one_product_three_scenes");
  const assets = inserts[1].value;
  assert.equal(assets.length, 10);
  assert.ok(
    assets.every(
      (asset) => asset.status === "pending" && asset.meta.product_key === input.product_key,
    ),
  );
  assert.deepEqual(assets[0].meta.product, product);
  assert.equal(assets.filter((asset) => asset.meta.format === "feed").length, 4);
  assert.equal(assets.filter((asset) => asset.meta.format === "story").length, 3);
  assert.equal(assets.filter((asset) => asset.meta.format === "carousel").length, 3);
});
