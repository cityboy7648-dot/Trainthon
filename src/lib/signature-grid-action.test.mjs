import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
const scheduled = [];
const generated = [];
globalThis.signatureAfter = (callback) => scheduled.push(callback);
globalThis.signatureGenerate = async (id) => generated.push(id);
registerHooks({
  resolve(s, c, n) {
    const stubs = {
      "next/cache": "export function revalidatePath(){}",
      "next/server": "export const after=globalThis.signatureAfter",
      "@/lib/data/campaign-workspace":
        "export async function createSavedCampaign(){return 'run'};export async function getSavedCampaign(){};export async function ownedCampaignAsset(){}",
      "@/lib/agents/signature-grid/generate":
        "export const generateSignatureGrid=globalThis.signatureGenerate",
    };
    if (stubs[s])
      return { url: `data:text/javascript,${encodeURIComponent(stubs[s])}`, shortCircuit: true };
    if (s.startsWith("@/")) return n(new URL(`../${s.slice(2)}.ts`, import.meta.url).href, c);
    return n(s, c);
  },
});
test("캠페인 선택은 빈 자리 저장 뒤 실제 생성 작업도 예약한다", async () => {
  const { selectSavedCampaign } = await import("./data/campaign-workspace-actions.ts");
  assert.deepEqual(await selectSavedCampaign({}), { ok: true, data: "run" });
  assert.equal(scheduled.length, 1);
  assert.deepEqual(generated, []);
  await scheduled[0]();
  assert.deepEqual(generated, ["run"]);
});
