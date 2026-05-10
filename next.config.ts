import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  outputFileTracingExcludes: {
    "/*": ["public/uploads/**"],
  },
};

export default nextConfig;
