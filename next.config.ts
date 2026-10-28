import type { NextConfig } from "next";
import { getSecurityHeaders } from "./scripts/security-headers.mjs";

const nextConfig: NextConfig = {
  // Request nonces and PPR-generated static shells are incompatible. The HTML route
  // is made request-dynamic in app/page.tsx so Next can nonce every generated script.
  async headers() {
    return getSecurityHeaders({ includeCsp: false });
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
