import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";
import { dropWeekImageSlots } from "./agents/drop-week/image-slots.ts";
import { campaign3 } from "../definitions/campaign-3.ts";

const runId = "a9d69a1d-dffe-4d9f-afb1-0a7539de1931";
const product = {
  name: "재킷",
  image_url: "https://example.com/product.png",
  description: null,
  price: null,
};
const plan = {
  concept: "공개",
  days: Object.fromEntries(
    campaign3.schedule.map((slot) => [
      slot.key,
      {
        feed: { imagePrompt: "상품 사진", caption: slot.key },
        ...(slot.story ? { storyPrompt: "세로 사진" } : {}),
      },
    ]),
  ),
};
const slots = dropWeekImageSlots(plan, product, "2027-01-02");
let authenticated = true;
let imageFails = false;
let generated = 0;
let uploaded = 0;
let rows = [];
let runStatus = "processing";
function reset() {
  authenticated = true;
  imageFails = false;
  generated = 0;
  uploaded = 0;
  runStatus = "processing";
  rows = slots.map((meta) => ({
    id: crypto.randomUUID(),
    run_id: runId,
    kind: "image",
    status: "pending",
    meta: { ...meta },
    storage_path: null,
    created_at: "2026-09-10T00:00:00Z",
  }));
}
globalThis.dropWeekTestClient = {
  auth: {
    async getUser() {
      return { data: { user: authenticated ? { id: "owner" } : null }, error: null };
    },
  },
  storage: {
    from() {
      return {
        async upload(path) {
          assert.ok(rows.some((row) => row.storage_path === path && row.status === "processing"));
          uploaded++;
          return { error: null };
        },
        async createSignedUrl(path) {
          return { data: { signedUrl: `https://example.com/${path}` }, error: null };
        },
      };
    },
  },
  from(table) {
    const filters = [];
    let update;
    let insert;
    const query = {
      select() {
        return query;
      },
      eq(key, value) {
        filters.push((row) => (key === "brands.user_id" ? value === "owner" : row[key] === value));
        return query;
      },
      in(key, values) {
        filters.push((row) => values.includes(row[key]));
        return query;
      },
      order() {
        return query;
      },
      update(value) {
        update = value;
        return query;
      },
      insert(value) {
        insert = value;
        return query;
      },
      async maybeSingle() {
        const response = execute();
        return { ...response, data: response.data?.[0] ?? null };
      },
      async single() {
        return query.maybeSingle();
      },
      then(resolve, reject) {
        return Promise.resolve(execute()).then(resolve, reject);
      },
    };
    function execute() {
      if (insert) {
        const values = Array.isArray(insert) ? insert : [insert];
        for (const value of values) {
          if (value.meta.retryOf && rows.some((row) => row.meta.retryOf === value.meta.retryOf))
            return { data: null, error: { code: "23505" } };
          rows.push({ ...value, id: crypto.randomUUID(), created_at: new Date().toISOString() });
        }
        return { data: [], error: null };
      }
      const source =
        table === "runs" ? [{ id: runId, campaign_key: "drop_week", status: runStatus }] : rows;
      const matched = source.filter((row) => filters.every((match) => match(row)));
      if (update)
        for (const row of matched) {
          Object.assign(row, update);
          if (table === "runs") runStatus = row.status;
        }
      return { data: matched.map((row) => ({ ...row })), error: null };
    }
    return query;
  },
};
globalThis.dropWeekGenerateTest = async () => {
  generated++;
  if (imageFails) throw new Error("test provider failure");
  return Buffer.from("test image");
};
registerHooks({
  resolve(specifier, context, next) {
    const stubs = {
      "@/lib/supabase/server":
        "export async function createSessionWriter(){return globalThis.dropWeekTestClient} export const createSessionReader=createSessionWriter",
      "@/lib/agents/drop-week/generate-image":
        "export const generateDropWeekImage=globalThis.dropWeekGenerateTest",
      "@/lib/log": "export const log={error(){}}",
      "./campaign-3":
        "export async function createCampaign3Plan(){throw new Error('unexpected planning')}",
    };
    if (stubs[specifier])
      return {
        url: `data:text/javascript,${encodeURIComponent(stubs[specifier])}`,
        shortCircuit: true,
      };
    if (specifier.startsWith("@/"))
      return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return next(specifier, context);
  },
});
const { generateCampaign3Asset, getCampaign3Result, retryCampaign3Asset, finishCampaign3Images } =
  await import("./data/campaign-3-images.ts");

test("연도를 넘는 게시 일정도 피드 7·스토리 3·캡션 7개로 만든다", () => {
  assert.equal(slots.length, 10);
  assert.equal(slots.filter((s) => s.caption).length, 7);
  assert.deepEqual(
    slots.filter((s) => s.format === "story").map((s) => s.date),
    ["2026-12-30", "2027-01-02", "2027-01-05"],
  );
});
test("로그인 없음과 다른 run의 요청은 생성 전에 차단한다", async () => {
  reset();
  authenticated = false;
  await assert.rejects(generateCampaign3Asset(runId, rows[0].id));
  authenticated = true;
  await assert.rejects(generateCampaign3Asset(crypto.randomUUID(), rows[0].id));
  assert.equal(generated, 0);
});
test("동시에 같은 장을 요청해도 생성·업로드는 한 번만 실행한다", async () => {
  reset();
  const id = rows[0].id;
  await Promise.all([generateCampaign3Asset(runId, id), generateCampaign3Asset(runId, id)]);
  assert.equal(generated, 1);
  assert.equal(uploaded, 1);
  assert.equal(rows[0].status, "done");
  assert.ok((await getCampaign3Result(runId)).assets[0].imageUrl);
});
test("실패 재시도는 새 행이며 이전 완료 이미지를 보존한다", async () => {
  reset();
  await generateCampaign3Asset(runId, rows[0].id);
  imageFails = true;
  const failedId = rows[1].id;
  await generateCampaign3Asset(runId, failedId);
  assert.equal(rows[1].status, "failed");
  await Promise.all([retryCampaign3Asset(runId, failedId), retryCampaign3Asset(runId, failedId)]);
  assert.equal(rows.length, 11);
  assert.equal(rows[1].status, "failed");
  assert.equal(rows[0].status, "done");
  assert.equal((await getCampaign3Result(runId)).assets[1].status, "pending");
});
test("열 장 생성 뒤 재조회해도 결과와 완료 상태가 유지된다", async () => {
  reset();
  await finishCampaign3Images(runId);
  assert.equal(generated, 10);
  assert.equal(uploaded, 10);
  assert.equal(runStatus, "done");
  assert.ok(
    (await getCampaign3Result(runId)).assets.every(
      (asset) => asset.status === "done" && asset.imageUrl,
    ),
  );
  await finishCampaign3Images(runId);
  assert.equal(generated, 10);
});

test("중단된 작업은 DB 시작 시각을 기준으로 실패 처리해 재시도할 수 있다", async () => {
  reset();
  rows[0].status = "processing";
  rows[0].meta.startedAt = new Date(Date.now() - 181_000).toISOString();
  const result = await getCampaign3Result(runId);
  assert.equal(result.assets[0].status, "failed");
  assert.ok(result.assets[0].meta.error);
  await retryCampaign3Asset(runId, rows[0].id);
  assert.equal((await getCampaign3Result(runId)).assets[0].status, "pending");
});
