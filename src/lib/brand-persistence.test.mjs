import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

let owner = "user-a";
let rows = [];
let failWrite = false;
globalThis.brandPersistenceTestClient = {
  auth: { getUser: async () => ({ data: { user: owner ? { id: owner } : null } }) },
  from() {
    const filters = [];
    let record;
    let operation;
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
      insert(value) {
        operation = "insert";
        record = value;
        return query;
      },
      update(value) {
        operation = "update";
        record = value;
        return query;
      },
      async maybeSingle() {
        return {
          data: rows.find((row) => filters.every(([key, value]) => row[key] === value)) ?? null,
          error: null,
        };
      },
      then(resolve, reject) {
        return Promise.resolve({
          data: rows.filter((row) => filters.every(([key, value]) => row[key] === value)),
          error: null,
        }).then(resolve, reject);
      },
      async single() {
        if (failWrite) return { data: null, error: { message: "denied" } };
        if (operation === "insert") rows.push({ id: String(rows.length), ...record });
        else
          Object.assign(
            rows.find((row) => filters.every(([key, value]) => row[key] === value)),
            record,
          );
        return { data: { id: "saved" }, error: null };
      },
    };
    return query;
  },
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const stubs = {
      "@/lib/supabase/server":
        "export async function createSessionReader() { return globalThis.brandPersistenceTestClient; }",
      "@/lib/data/session":
        "export async function getSessionUser() { return (await globalThis.brandPersistenceTestClient.auth.getUser()).data.user; }",
      "@/lib/env": "export const isPreviewAnalysis = false;",
      "@/lib/agents/brand-analysis/analyze-brand":
        "export async function analyzeBrand() { throw new Error('unexpected paid analysis'); }",
    };
    if (stubs[specifier])
      return {
        url: `data:text/javascript,${encodeURIComponent(stubs[specifier])}`,
        shortCircuit: true,
      };
    if (specifier.startsWith("@/"))
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return nextResolve(specifier, context);
  },
});

test("브랜드는 계정별로 저장되고 재접속 후 복원되며 다른 계정에는 보이지 않는다", async () => {
  const { persistBrandProfile, getSavedBrandProfile, getBrandProfile } =
    await import("./data/brand-profile.ts");
  const profile = {
    name: "Saved brand",
    tagline: null,
    industry: null,
    logo_url: null,
    palette: [],
    font_feel: null,
    voice: null,
    mood_keywords: [],
    products: [],
    target_audience: null,
    source_url: "https://example.com/",
    analyzed_at: "2026-09-09T00:00:00.000Z",
  };
  await persistBrandProfile(profile);
  const { getCurrentUserUsage } = await import("./data/usage.ts");
  assert.deepEqual(await getCurrentUserUsage(), {
    ok: true,
    usage: { brandCount: 1, inputTokens: 0, outputTokens: 0 },
  });
  await persistBrandProfile(profile, { inputTokens: 12, outputTokens: 3, calls: 1 });
  assert.deepEqual(await getCurrentUserUsage(), {
    ok: true,
    usage: { brandCount: 1, inputTokens: 12, outputTokens: 3 },
  });
  owner = null;
  assert.equal(await getSavedBrandProfile(), null);
  await assert.rejects(getBrandProfile(profile.source_url));
  owner = "user-b";
  assert.equal(await getSavedBrandProfile(), null);
  await persistBrandProfile({ ...profile, name: "Other brand" });
  assert.deepEqual(await getCurrentUserUsage(), {
    ok: true,
    usage: { brandCount: 1, inputTokens: 0, outputTokens: 0 },
  });
  owner = "user-a";
  assert.deepEqual(await getCurrentUserUsage(), {
    ok: true,
    usage: { brandCount: 1, inputTokens: 12, outputTokens: 3 },
  });
  assert.equal((await getSavedBrandProfile()).name, "Saved brand");
  assert.equal((await getBrandProfile(profile.source_url)).name, "Saved brand");
  await persistBrandProfile({ ...profile, name: "Edited brand" });
  assert.equal(rows.length, 2);
  assert.equal((await getSavedBrandProfile()).name, "Edited brand");
  failWrite = true;
  await assert.rejects(persistBrandProfile(profile));
});
