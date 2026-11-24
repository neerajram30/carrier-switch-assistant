import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@astryxdesign/core",
    "@astryxdesign/charts",
    "@astryxdesign/theme-neutral",
  ],
  experimental: {
    optimizePackageImports: [
      "@astryxdesign/core",
      "@astryxdesign/charts",
      "lucide-react",
    ],
  },
  turbopack: {},
};

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
});

export default withAnalyzer(nextConfig);
