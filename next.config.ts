import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ['72.62.121.108'],
  experimental: {
    serverActions: {
      allowedOrigins: ['72.62.121.108', 'web.japprime.id']
    }
  }
};

export default nextConfig;
