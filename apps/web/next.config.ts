import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@astryxdesign/core",
    "@astryxdesign/charts",
    "@astryxdesign/theme-neutral",
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-dom$": path.resolve(__dirname, "../../node_modules/react-dom"),
      "react$": path.resolve(__dirname, "../../node_modules/react"),
    };
    return config;
  },
};

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
});

export default withAnalyzer(nextConfig);
