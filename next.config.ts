import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
