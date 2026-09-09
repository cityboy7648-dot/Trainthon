import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
let run;
let assets;
globalThis.detailDataClient = {
  auth: {
    async getUser() {
      return { data: { user: { id: "user" } } };
    },
  },
  storage: {
    from() {
      return {
        async createSignedUrl() {
          return { data: { signedUrl: "https://example.com/saved.png" } };
        },
      };
    },
  },
  from(table) {
    const filters = [];
    let values;
    const query = {
      select() {
        return query;
      },
      eq(key, value) {
        filters.push([key, [value]]);
        return query;
      },
      in(key, value) {
        filters.push([key, value]);
        return query;
      },
      update(value) {
        values = value;
        return query;
      },
      async maybeSingle() {
        return { data: run, error: null };
      },
      then(resolve, reject) {
        const rows = table === "runs" ? [run] : assets;
        const selected = rows.filter((row) =>
          filters.every(([key, choices]) => choices.includes(row[key])),
        );
        if (values) selected.forEach((row) => Object.assign(row, values));
        return Promise.resolve({ data: selected, error: null }).then(resolve, reject);
      },
    };
    return query;
  },
};
registerHooks({
  resolve(s, c, n) {
    if (s === "server-only") return { url: "data:text/javascript,export {}", shortCircuit: true };
    if (s === "@/lib/supabase/server")
      return {
        url: "data:text/javascript,export async function createSessionReader(){return globalThis.detailDataClient}",
        shortCircuit: true,
      };
    if (s.startsWith("@/")) return n(new URL(`../${s.slice(2)}.ts`, import.meta.url).href, c);
    return n(s, c);
  },
});
const { getSavedCampaign } = await import("./data/campaign-workspace.ts");
test("중단된 생성 캠페인은 완료 이미지를 보존하고 남은 항목만 실패 처리한다", async () => {
  for (const key of ["signature_grid", "one_product_three_scenes", "complete_set"]) {
    run = {
      id: "b287625f-65d0-435e-b1fd-55b5c7e912ab",
      campaign_key: key,
      status: "processing",
      created_at: "2020-01-01T00:00:00Z",
      brands: { profile: { name: "브랜드" } },
    };
    assets = ["done", "processing", "pending"].map((status, i) => ({
      id: `asset-${i}`,
      run_id: run.id,
      kind: "image",
      status,
      storage_path: i === 0 ? "saved.png" : null,
      meta: {
        day: i + 1,
        position: i + 1,
        format: "feed",
        caption: "보존",
        product_key: "preserved",
      },
    }));
    const result = await getSavedCampaign(run.id);
    assert.equal(result.status, "failed");
    assert.deepEqual(
      result.posts.map((p) => p.status),
      ["done", "failed", "failed"],
    );
    assert.equal(result.posts[0].image_url, "https://example.com/saved.png");
    assert.equal(result.posts[1].meta.product_key, "preserved");
    assert.match(result.posts[1].meta.error, /시간/);
  }
});
