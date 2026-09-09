import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";
const runId = "b287625f-65d0-435e-b1fd-55b5c7e912ab";
const assetId = "b287625f-65d0-435e-b1fd-55b5c7e912ac";
let stale = false;
let writes = [];
globalThis.editRun = { campaign_key: "signature_grid" };
const original = {
  day: 1,
  position: 9,
  format: "feed",
  caption: "원래 캡션",
  start_date: "2026-09-14",
  product_key: "keep",
};
globalThis.editAsset = {
  id: assetId,
  status: "done",
  meta: original,
  storage_path: "original.png",
};
globalThis.editClient = {
  from() {
    const query = {
      update(value) {
        writes.push(value);
        return query;
      },
      eq() {
        return query;
      },
      select() {
        return query;
      },
      async maybeSingle() {
        return { data: stale ? null : { id: assetId }, error: null };
      },
    };
    return query;
  },
};
registerHooks({
  resolve(s, c, n) {
    if (s === "next/cache")
      return { url: "data:text/javascript,export function revalidatePath(){}", shortCircuit: true };
    if (s === "@/lib/data/campaign-workspace")
      return {
        url: "data:text/javascript,export async function ownedCampaignAsset(){return {client:globalThis.editClient,asset:globalThis.editAsset,run:globalThis.editRun}}; export async function createSavedCampaign(){throw new Error()}; export async function getSavedCampaign(){throw new Error()}",
        shortCircuit: true,
      };
    if (s.startsWith("@/")) return n(new URL(`../${s.slice(2)}.ts`, import.meta.url).href, c);
    return n(s, c);
  },
});
const { editCampaignPost, replaceCampaignImage } =
  await import("./data/campaign-workspace-actions.ts");
test("생성 중인 캠페인의 수정은 결과에 덮어써지지 않도록 거부한다", async () => {
  for (const key of ["signature_grid", "one_product_three_scenes", "complete_set"]) {
    globalThis.editRun = { campaign_key: key };
    for (const status of ["pending", "processing"]) {
      globalThis.editAsset.status = status;
      writes = [];
      for (const [kind, value] of [
        ["caption", "수정"],
        ["date", "2026-10-01"],
      ]) {
        assert.equal((await editCampaignPost({ runId, assetId, kind, value })).ok, false);
      }
      assert.equal(writes.length, 0);
    }
  }
  globalThis.editRun = { campaign_key: "signature_grid" };
  globalThis.editAsset.status = "done";
});
test("캡션 편집은 기획 정보와 날짜를 보존한다", async () => {
  writes = [];
  stale = false;
  const result = await editCampaignPost({ runId, assetId, kind: "caption", value: "변경한 캡션" });
  assert.equal(result.ok, true);
  assert.deepEqual(writes[0].meta, { ...original, caption: "변경한 캡션" });
});
test("시작일 변경은 날짜만 바꾸고 잘못된 날짜는 저장하지 않는다", async () => {
  writes = [];
  assert.equal(
    (await editCampaignPost({ runId, assetId, kind: "date", value: "2026-10-01" })).ok,
    true,
  );
  assert.deepEqual(writes[0].meta, { ...original, start_date: "2026-10-01" });
  writes = [];
  assert.equal(
    (await editCampaignPost({ runId, assetId, kind: "date", value: "2026-02-30" })).ok,
    false,
  );
  assert.equal(writes.length, 0);
});
test("동시 변경 충돌은 성공으로 표시하지 않는다", async () => {
  stale = true;
  assert.equal(
    (await editCampaignPost({ runId, assetId, kind: "caption", value: "충돌" })).ok,
    false,
  );
  stale = false;
});
test("가짜 이미지 파일은 Storage 경로 예약 전에 차단한다", async () => {
  writes = [];
  const form = new FormData();
  form.set("runId", runId);
  form.set("assetId", assetId);
  form.set("image", new File(["<script>"], "image.png", { type: "image/png" }));
  assert.equal((await replaceCampaignImage(form)).ok, false);
  assert.equal(writes.length, 0);
});
test("실패한 이미지는 파일 검사 전에 충돌로 막지 않는다", async () => {
  globalThis.editAsset.status = "failed";
  globalThis.editAsset.storage_path = null;
  writes = [];
  const form = new FormData();
  form.set("runId", runId);
  form.set("assetId", assetId);
  form.set("image", new File(["<script>"], "image.png", { type: "image/png" }));
  const result = await replaceCampaignImage(form);
  assert.equal(result.ok, false);
  assert.match(result.cause ?? "", /PNG|JPG/);
  assert.equal(writes.length, 0);
  globalThis.editAsset.status = "done";
  globalThis.editAsset.storage_path = "original.png";
});
