import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingIncludes: {
    "/api/campaigns/2/runs": ["./reference/campaigns/campaign-2/*.jpg"],
  },
  distDir: process.env.NEXT_PUBLIC_PREVIEW_ANALYSIS === "1" ? ".next-preview" : ".next",
};

export default nextConfig;
