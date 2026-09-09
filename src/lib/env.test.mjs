import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";

test("배포에서는 미리보기 환경변수가 켜져도 예시 캠페인을 사용하지 않는다", () => {
  for (const mode of ["production", "development"]) {
    const result = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "--input-type=module",
        "-e",
        "const {isCampaignPreview}=await import('./src/lib/env.ts'); process.stdout.write(String(isCampaignPreview))",
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          NODE_ENV: mode,
          NEXT_PUBLIC_PREVIEW_ANALYSIS: "1",
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "test",
        },
      },
    );
    assert.equal(result, mode === "development" ? "true" : "false");
  }
});

test("프론트 화면 실행은 백엔드 제공자 API 키를 요구하지 않는다", async () => {
  const previousOpenAiKey = process.env.OPENAI_API_KEY;
  const previousFirecrawlKey = process.env.FIRECRAWL_API_KEY;
  const previousSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  delete process.env.OPENAI_API_KEY;
  delete process.env.FIRECRAWL_API_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

  try {
    await assert.doesNotReject(import("./env.ts?frontend-only"));
  } finally {
    if (previousOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousOpenAiKey;

    if (previousFirecrawlKey === undefined) delete process.env.FIRECRAWL_API_KEY;
    else process.env.FIRECRAWL_API_KEY = previousFirecrawlKey;

    if (previousSupabaseUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousSupabaseUrl;

    if (previousSupabaseAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousSupabaseAnonKey;
  }
});
