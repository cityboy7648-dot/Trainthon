import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";
let status = "pending";
let valid = true;
const profile = {
  name: "브랜드",
  tagline: null,
  industry: null,
  logo_url: null,
  palette: [],
  font_feel: null,
  voice: null,
  mood_keywords: [],
  products: [],
  target_audience: null,
  source_url: "https://example.com",
  analyzed_at: "2026-09-10T00:00:00Z",
};
let assets;
globalThis.claimClient = {
  from(table) {
    let values;
    const filters = [];
    const query = {
      update(v) {
        values = v;
        return query;
      },
      select() {
        return query;
      },
      eq(k, v) {
        filters.push([k, [v]]);
        return query;
      },
      in(k, v) {
        filters.push([k, v]);
        return query;
      },
      async maybeSingle() {
        if (table === "runs") {
          if (!filters.every(([k, vs]) => k !== "status" || vs.includes(status)))
            return { data: null, error: null };
          if (values) status = values.status;
          return { data: { id: "run" }, error: null };
        }
        const asset = assets.find((a) => filters.every(([k, vs]) => vs.includes(a[k])));
        if (asset && values) Object.assign(asset, values);
        return { data: asset ?? null, error: null };
      },
      then(resolve) {
        if (table === "runs") {
          if (values) status = values.status;
          resolve({ data: [{ id: "run" }], error: null });
          return;
        }
        const selected = assets.filter((a) => filters.every(([k, vs]) => vs.includes(a[k])));
        if (values) selected.forEach((row) => Object.assign(row, values));
        resolve({ data: selected, error: null });
      },
    };
    return query;
  },
};
globalThis.claimOwned = async () => ({
  client: globalThis.claimClient,
  run: {
    id: "run",
    campaign_key: "signature_grid",
    status,
    brands: { profile: valid ? profile : {} },
  },
});
registerHooks({
  resolve(s, c, n) {
    if (s === "server-only") return { url: "data:text/javascript,export {}", shortCircuit: true };
    if (s === "@/lib/data/campaign-workspace")
      return {
        url: "data:text/javascript,export const ownedCampaign=globalThis.claimOwned",
        shortCircuit: true,
      };
    if (s.startsWith("@/")) return n(new URL(`../${s.slice(2)}.ts`, import.meta.url).href, c);
    return n(s, c);
  },
});
const { claimSignatureGridRun } = await import("./data/signature-grid.ts");
function reset() {
  status = "pending";
  assets = Array.from({ length: 9 }, (_, i) => ({
    id: `asset-${i}`,
    run_id: "run",
    kind: "image",
    status: "pending",
    meta: { day: i + 1, position: 9 - i, format: "feed", caption: null },
  }));
}
test("DB 상태로 생성 권한을 한 번만 획득한다", async () => {
  reset();
  valid = true;
  assert.ok(await claimSignatureGridRun("run"));
  assert.equal(await claimSignatureGridRun("run"), null);
  assert.equal(status, "processing");
});
test("브랜드 검증 실패는 대기로 방치하지 않고 실패 사유를 저장한다", async () => {
  reset();
  valid = false;
  await assert.rejects(claimSignatureGridRun("run"));
  assert.equal(status, "failed");
  assert.ok(assets.every((a) => a.status === "failed" && a.meta.error));
});
