import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import OpenAI from "openai";

let failure;
let calls = [];
const timing = () => ({ runStartedAt: Date.now(), imagesStartedAt: Date.now(), index: 0 });
const realClient = new OpenAI({ apiKey: "test-only" });
globalThis.imageProviderTestClient = realClient;
realClient.responses.create = async (body, options) => {
  calls.push({ body, options, at: Date.now() });
  if (failure) throw failure;
  if ((options?.timeout ?? 75000) < 120000) throw new OpenAI.APIConnectionTimeoutError();
  return {
    output: [{ type: "image_generation_call", result: Buffer.from("image").toString("base64") }],
  };
};
registerHooks({
  resolve(s, c, n) {
    if (s === "openai" && c.parentURL?.endsWith("/providers/openai.ts"))
      return {
        url:
          "data:text/javascript," +
          encodeURIComponent(
            `import OpenAI from ${JSON.stringify(import.meta.resolve("openai"))}; export default class extends OpenAI { constructor(){ super({apiKey:'test-only'}); return globalThis.imageProviderTestClient; } }`,
          ),
        shortCircuit: true,
      };
    if (s === "@/lib/env")
      return {
        url: "data:text/javascript,export function getProviderApiKey(){return 'test-only'}",
        shortCircuit: true,
      };
    if (s === "@/lib/log")
      return {
        url: "data:text/javascript,export const log={info(){},error(){}}",
        shortCircuit: true,
      };
    if (s.startsWith("@/")) return n(new URL(`../${s.slice(2)}.ts`, import.meta.url).href, c);
    return n(s, c);
  },
});
const { generateCampaignImage } = await import("./providers/openai.ts");
const context = { requestId: "request", runId: "run", assetId: "asset" };
test("2분 걸리는 이미지는 텍스트 요청 제한으로 중단하지 않는다", async () => {
  calls = [];
  failure = undefined;
  assert.equal(
    (await generateCampaignImage("prompt", [], false, context, timing())).toString(),
    "image",
  );
  assert.equal(calls.length, 1);
});
test("시간 초과·잔액 부족·요청 한도를 구별하고 자동 재생성하지 않는다", async () => {
  for (const [error, message] of [
    [new OpenAI.APIConnectionTimeoutError(), /시간/],
    [
      new OpenAI.RateLimitError(429, { code: "insufficient_quota" }, "quota", new Headers()),
      /잔액|사용 한도/,
    ],
    [
      new OpenAI.RateLimitError(429, { code: "rate_limit_exceeded" }, "rate", new Headers()),
      /요청/,
    ],
  ]) {
    calls = [];
    failure = error;
    await assert.rejects(generateCampaignImage("prompt", [], false, context, timing()), (e) =>
      message.test(e.cause),
    );
    assert.equal(calls.length, 1);
  }
});
test("이미지 API 실패 원인을 숨기지 않는다", async () => {
  calls = [];
  failure = new OpenAI.APIError(
    400,
    { message: "invalid_image_url" },
    "Could not process image",
    new Headers(),
  );
  await assert.rejects(generateCampaignImage("prompt", [], false, context, timing()), (e) =>
    /Could not process image|invalid_image_url/.test(e.cause),
  );
  assert.equal(calls.length, 1);
});
test("11장을 분당 2장 이하로 요청하고 마지막 요청도 서버 종료 전에 끝낸다", async (t) => {
  calls = [];
  failure = undefined;
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 0 });
  const pending = Array.from({ length: 11 }, (_, index) =>
    generateCampaignImage("prompt", [], false, context, {
      runStartedAt: 0,
      imagesStartedAt: 0,
      index,
    }),
  );
  await Promise.resolve();
  assert.equal(calls.length, 2);
  t.mock.timers.tick(61000);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls.length, 4);
  t.mock.timers.tick(61000);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls.length, 6);
  t.mock.timers.tick(61000);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls.length, 8);
  t.mock.timers.tick(61000);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls.length, 10);
  t.mock.timers.tick(61000);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.all(pending);
  assert.equal(calls.length, 11);
  assert.ok(calls.every((call) => call.at + call.options.timeout <= 770000));
});
