import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security/headers";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false, // hide the "X-Powered-By: Next.js" header
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders(isDev) }];
  },
};

export default nextConfig;
