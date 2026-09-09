import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().trim().pipe(z.url()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
});

const providerApiKeySchema = z.string().trim().min(1);

export const env = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export const isProduction = process.env.NODE_ENV === "production";
export const isPreviewAnalysis = process.env.NEXT_PUBLIC_PREVIEW_ANALYSIS === "1";
export const isCampaignPreview = !isProduction && isPreviewAnalysis;

export function getProviderApiKey(name: "OPENAI_API_KEY" | "FIRECRAWL_API_KEY"): string {
  return providerApiKeySchema.parse(process.env[name]);
}
