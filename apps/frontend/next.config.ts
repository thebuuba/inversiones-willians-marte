import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { networkInterfaces } from "node:os";
import { getAllowedDevOrigins } from "./src/lib/mobile-network";

initOpenNextCloudflareForDev();

const allowedDevOrigins = getAllowedDevOrigins(
  process.env.NEXT_PUBLIC_MOBILE_BASE_URL,
  networkInterfaces(),
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/login",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
