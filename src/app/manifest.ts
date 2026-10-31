import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "moniii — Quản lý thu chi",
    short_name: "moniii",
    description: "Lịch chi tiêu, hóa đơn và đồng bộ ngân hàng — sổ thu chi cá nhân dễ thương",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FFF7FA",
    theme_color: "#D32383",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
