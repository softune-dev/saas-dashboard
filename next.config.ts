import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default 'auto' evicts cached Turbopack data from memory under
    // pressure, then reloads it from disk on the next request — cheap on a
    // laptop, but on a dev machine with RAM to spare it just adds latency
    // back in. 'false' keeps everything hot for the life of the process.
    turbopackMemoryEviction: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Cloudinary — where category/product/hero image uploads live (see
        // app/media.py). One hostname serves every cloud account, scoped by
        // path segment, so no per-account config is needed here.
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
