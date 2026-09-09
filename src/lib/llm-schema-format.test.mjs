import assert from "node:assert/strict";
import test from "node:test";
import { zodTextFormat } from "openai/helpers/zod";
import {
  brandAnalysisOutputSchema,
  brandEvidenceSchema,
  campaign4PlanSchema,
  campaignFivePlanSchema,
  campaignTwoPlanSchema,
  signatureGridPlanSchema,
} from "./types.ts";

// OpenAI 구조화 출력이 받는 string format. uri는 없다.
const supported = new Set([
  "date-time",
  "time",
  "date",
  "duration",
  "email",
  "hostname",
  "ipv4",
  "ipv6",
  "uuid",
]);

test("LLM 출력 스키마는 OpenAI가 거절하는 string format을 쓰지 않는다", () => {
  for (const [name, schema] of Object.entries({
    brandAnalysisOutputSchema,
    brandEvidenceSchema,
    campaign4PlanSchema,
    campaignFivePlanSchema,
    campaignTwoPlanSchema,
    signatureGridPlanSchema,
  })) {
    const json = JSON.stringify(zodTextFormat(schema, name).schema);
    const formats = [...json.matchAll(/"format":"([a-z-]+)"/g)].map((match) => match[1]);
    assert.deepEqual(
      formats.filter((format) => !supported.has(format)),
      [],
      `${name}: ${formats.join(",")}`,
    );
  }
});

test("LLM용 주소는 http(s)만 통과한다", () => {
  const shape = signatureGridPlanSchema.shape.posts.element.shape.source_image_urls;
  assert.ok(shape.safeParse(["https://example.com/a.jpg"]).success);
  assert.ok(!shape.safeParse(["ftp://example.com/a.jpg"]).success);
  assert.ok(!shape.safeParse(["not a url"]).success);
});
