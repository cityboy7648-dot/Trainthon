import assert from "node:assert/strict";
import test from "node:test";

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
