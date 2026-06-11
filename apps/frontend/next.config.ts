import type { NextConfig } from "next";

function getMobileDevOrigin() {
  const mobileBaseUrl = process.env.NEXT_PUBLIC_MOBILE_BASE_URL;
  if (!mobileBaseUrl) return undefined;

  try {
    return new URL(mobileBaseUrl).host;
  } catch {
    return undefined;
  }
}

const mobileDevOrigin = getMobileDevOrigin();

const nextConfig: NextConfig = {
  ...(mobileDevOrigin ? { allowedDevOrigins: [mobileDevOrigin] } : {}),
};

export default nextConfig;
