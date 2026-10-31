import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker build bật standalone (xem Dockerfile); chạy thường thì dùng `next start`
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
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
