import type { NextConfig } from "next";

const nextConfig: NextConfig =
  process.env.PAGES_EXPORT === "true"
    ? {
        output: "export",
        basePath: "/talkie",
        trailingSlash: true,
      }
    : {};

export default nextConfig;
