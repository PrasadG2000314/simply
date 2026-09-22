import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // Proxy /api requests to local backend server (port 5000) during local development
    if (process.env.NODE_ENV === "development") {
      const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:5000";
      return [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: "/health",
          destination: `${backendUrl}/health`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;

