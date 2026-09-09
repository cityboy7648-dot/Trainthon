"use server";

import { copy } from "@/lib/copy";
import { addTokenUsage, emptyTokenUsage, tokenUsageFromProfile } from "@/lib/token-usage";
import type { UserUsageResult } from "@/lib/types";
import { createSessionReader } from "@/lib/supabase/server";

export async function getCurrentUserUsage(): Promise<UserUsageResult> {
  const supabase = await createSessionReader();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, cause: copy.login.required };
  }

  const { data, error } = await supabase.from("brands").select("profile").eq("user_id", user.id);
  if (error) {
    return { ok: false, cause: copy.sidebar.usageLoadFailed };
  }

  const rows = data ?? [];
  const usage = rows.reduce(
    (total, row) => addTokenUsage(total, tokenUsageFromProfile(row.profile)),
    emptyTokenUsage(),
  );
  return {
    ok: true,
    usage: {
      brandCount: rows.length,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    },
  };
}
