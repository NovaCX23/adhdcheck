import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  transpilePackages: ["@adhdcheck/contracts", "@adhdcheck/game", "@adhdcheck/scoring", "@adhdcheck/sensors"],
  partialPrefetching: true,
  // Stripe return URLs use /dashboard (docs/02 FR-45); the parent area is /parent. The query string is kept.
  async redirects() {
    return [{ source: "/dashboard", destination: "/parent", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
