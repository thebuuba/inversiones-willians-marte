import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";
import { getAllowedDevOrigins } from "./src/lib/mobile-network";

const allowedDevOrigins = getAllowedDevOrigins(
  process.env.NEXT_PUBLIC_MOBILE_BASE_URL,
  networkInterfaces(),
);

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
};

export default nextConfig;
