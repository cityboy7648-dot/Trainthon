import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";
import { campaignProductKey } from "./campaign-product.ts";

const primary = {
  name: "재킷",
  image_url: "https://example.com/jacket.jpg",
  description: null,
  price: null,
};
const companion = {
  name: "셔츠",
  image_url: "https://example.com/shirt.jpg",
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
  products: [primary, companion],
  target_audience: null,
  source_url: "https://example.com/",
  analyzed_at: "2026-09-09T00:00:00Z",
};
let owner = null;
let inserts = [];
const brand = { id: "f19b4d55-508a-4818-bae0-71a1b357d339", user_id: "owner", profile };
globalThis.campaignFiveAccessClient = {
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
              ? inserted.map((row, index) => ({ id: String(index), meta: row.meta }))
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
        url: "data:text/javascript,export async function createSessionWriter(){return globalThis.campaignFiveAccessClient;}",
        shortCircuit: true,
      };
    if (specifier.startsWith("@/"))
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return nextResolve(specifier, context);
  },
});
const { createCampaignFiveRun } = await import("./data/campaign-five.ts");
const input = {
  brand_id: brand.id,
  product_key: campaignProductKey(primary),
  companion_product_keys: [campaignProductKey(companion)],
};

test("로그인하지 않았거나 다른 사람 브랜드면 세트 캠페인을 만들지 않는다", async () => {
  for (const user of [null, "other-owner"]) {
    owner = user;
    inserts = [];
    await assert.rejects(createCampaignFiveRun(input));
    assert.equal(inserts.length, 0);
  }
});

test("변조된 대표 또는 동반 상품 키는 비용 작업 전에 거부한다", async () => {
  owner = "owner";
  for (const changed of [
    { ...input, product_key: "0".repeat(64) },
    { ...input, companion_product_keys: ["0".repeat(64)] },
  ]) {
    inserts = [];
    await assert.rejects(createCampaignFiveRun(changed));
    assert.equal(inserts.length, 0);
  }
});

test("선택 상품 스냅샷을 5일 일정의 11개 asset에 저장한다", async () => {
  owner = "owner";
  inserts = [];
  const run = await createCampaignFiveRun(input);
  assert.deepEqual(run.primaryProduct, primary);
  assert.deepEqual(run.companionProducts[0].product, companion);
  assert.equal(inserts[0].value.campaign_key, "complete_set");
  const assets = inserts[1].value;
  assert.equal(assets.length, 11);
  assert.equal(assets.filter((asset) => asset.meta.format === "pinterest").length, 2);
  assert.equal(assets.filter((asset) => asset.meta.format === "carousel").length, 6);
  assert.ok(assets.every((asset) => asset.meta.primary_product_key === input.product_key));
});
