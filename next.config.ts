import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["ffmpeg-static", "ffprobe-static"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Each project under app/(page_routes) was written independently; keep builds
  // unblocked by lint/type noise coming from the imported legacy code.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
