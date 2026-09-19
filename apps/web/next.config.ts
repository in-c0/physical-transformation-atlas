import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
  transpilePackages: ["@pta/schema", "@pta/graph", "@pta/physics"],
  typedRoutes: false,
};

export default nextConfig;
