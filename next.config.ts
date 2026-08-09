import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Each project under app/(page_routes) was written independently; keep builds
  // unblocked by lint/type noise coming from the imported legacy code.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
