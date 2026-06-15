import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Web app manifest (§19.2). Makes the app installable. `start_url: /study` so the
 * installed icon opens straight to the study app, not the marketing page. Served at
 * /manifest.webmanifest and auto-linked by Next; same-origin, so the §6.6 CSP
 * (default-src 'self') covers manifest-src + the icon img-src with no widening.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: "AdminLaw",
    description: SITE.description,
    start_url: "/study",
    scope: "/",
    display: "standalone",
    theme_color: "#1f3a5f",
    background_color: "#fbfaf7",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
