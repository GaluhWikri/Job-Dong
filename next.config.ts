import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse memakai pdfjs-dist (worker + dynamic require) — harus di-load
  // sebagai module Node asli, bukan di-bundle Turbopack/webpack.
  serverExternalPackages: ["pdf-parse"],
  // Indikator dev Next (bulatan "N") tampak seperti elemen UI yang rusak — matikan.
  devIndicators: false,
};

export default nextConfig;
