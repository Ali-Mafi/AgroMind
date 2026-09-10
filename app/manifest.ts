import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "AgroMind", short_name: "AgroMind", description: "AgroMind", start_url: "/dashboard", display: "standalone", background_color: "#f7faf5", theme_color: "#237a45", icons: [{ src: "/logo/agromind-logo.png", sizes: "512x512", type: "image/png" }] };
}
