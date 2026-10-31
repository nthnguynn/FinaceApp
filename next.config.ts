import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  allowedDevOrigins: [
    "localhost",
    "localhost:3005",
    "127.0.0.1",
    "127.0.0.1:3005",
    "192.168.1.223",
    "192.168.1.223:3005",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3005",
        "127.0.0.1:3005",
        "192.168.1.223:3005",
        "192.168.1.223",
      ],
    },
  },
};

export default nextConfig;
