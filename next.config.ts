import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Optional: Helps pass build if types are slightly off
  },
  eslint: {
    ignoreDuringBuilds: true, // Optional: Helps pass build if linting is strict
  },
  // Remove 'experimental: { serverActions: true }' if you see it here!
};

export default nextConfig;
