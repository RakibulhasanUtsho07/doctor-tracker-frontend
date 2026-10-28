import type { NextConfig } from "next";
import { getSecurityHeaders } from "./scripts/security-headers.mjs";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Keep static/PPR rendering while removing production's inline-script CSP exception.
    sri: {
      algorithm: "sha256",
    },
  },
  async headers() {
    return getSecurityHeaders();
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
