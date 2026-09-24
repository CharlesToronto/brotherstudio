import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "immobiliervalaisan.ch",
        pathname: "/data/files/**",
      },
    ],
  },
  outputFileTracingExcludes: {
    "/*": ["public/uploads/**"],
  },
};

export default nextConfig;
