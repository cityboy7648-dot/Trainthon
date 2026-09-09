import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "deucsyzcrllgnvbxlqlq.supabase.co",
        pathname: "/storage/v1/**",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/api/campaigns/1/runs": ["./reference/campaigns/campaign-1/*.jpg"],
    "/api/campaigns/2/runs": ["./reference/campaigns/campaign-2/*.jpg"],
    "/api/campaigns/5/runs": ["./reference/campaigns/campaign-5/*.jpg"],
    "/api/campaigns/4/runs": ["./reference/campaigns/campaign-4/*.jpg"],
    "/campaigns/new": [
      "./reference/campaigns/campaign-1/*.jpg",
      "./reference/campaigns/campaign-4/*.jpg",
    ],
    "/campaigns": ["./reference/campaigns/campaign-4/*.jpg"],
  },
  distDir: process.env.NEXT_PUBLIC_PREVIEW_ANALYSIS === "1" ? ".next-preview" : ".next",
};

export default nextConfig;
