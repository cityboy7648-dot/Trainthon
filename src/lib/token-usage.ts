import { tokenUsageSchema, type TokenUsage } from "@/lib/types";

export function emptyTokenUsage(): TokenUsage {
  return { inputTokens: 0, outputTokens: 0, calls: 0 };
}

export function addTokenUsage(left: TokenUsage, right: TokenUsage): TokenUsage {
  return {
    inputTokens: left.inputTokens + right.inputTokens,
    outputTokens: left.outputTokens + right.outputTokens,
    calls: left.calls + right.calls,
  };
}

export function tokenUsageFromProfile(profile: unknown): TokenUsage {
  if (typeof profile !== "object" || profile === null || !("usage" in profile)) {
    return emptyTokenUsage();
  }
  const parsed = tokenUsageSchema.safeParse(profile.usage);
  return parsed.success ? parsed.data : emptyTokenUsage();
}
