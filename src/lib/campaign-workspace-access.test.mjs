import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

let authenticated = false;
let filters = [];
let writes = 0;
globalThis.workspaceClient = {
  auth: {
    async getUser() {
      return { data: { user: authenticated ? { id: "caller" } : null } };
    },
  },
  from() {
    const query = {
      select() {
        return query;
      },
      eq(key, value) {
        filters.push([key, value]);
        return query;
      },
      order() {
        return query;
      },
      limit() {
        return query;
      },
      upsert() {
        writes++;
        return query;
      },
      async maybeSingle() {
        return { data: null, error: null };
      },
    };
    return query;
  },
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only")
      return { url: "data:text/javascript,export {}", shortCircuit: true };
    if (specifier === "@/lib/supabase/server")
      return {
        url: "data:text/javascript,export async function createSessionReader(){return globalThis.workspaceClient}",
        shortCircuit: true,
      };
    if (specifier.startsWith("@/"))
      return next(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return next(specifier, context);
  },
});
const { ownedCampaign, createSavedCampaign } = await import("./data/campaign-workspace.ts");
const id = "b287625f-65d0-435e-b1fd-55b5c7e912ab";
test("비로그인 상세 조회와 캠페인 생성을 거부한다", async () => {
  authenticated = false;
  await assert.rejects(ownedCampaign(id), (error) => error.code === "auth");
  await assert.rejects(
    createSavedCampaign({ requestId: id, key: "signature_grid" }),
    (error) => error.code === "auth",
  );
  assert.equal(writes, 0);
});
test("다른 소유자의 캠페인은 명시적 사용자 필터로 차단한다", async () => {
  authenticated = true;
  filters = [];
  await assert.rejects(ownedCampaign(id), (error) => error.code === "not_found");
  assert.ok(filters.some(([key, value]) => key === "brands.user_id" && value === "caller"));
});
test("브랜드가 없거나 변조한 캠페인 입력으로는 서버에 저장하지 않는다", async () => {
  authenticated = true;
  writes = 0;
  await assert.rejects(createSavedCampaign({ requestId: id, key: "signature_grid" }));
  await assert.rejects(
    createSavedCampaign({ requestId: id, key: "signature_grid", user_id: "admin" }),
  );
  await assert.rejects(createSavedCampaign({ requestId: id, key: "unapproved" }));
  assert.equal(writes, 0);
});
