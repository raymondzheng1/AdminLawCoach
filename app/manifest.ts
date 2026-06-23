import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Web app manifest (§19.2). Installed icon opens straight into the app
 * (`start_url: /study`). Icons + colors are the handoff brand set. Same-origin,
 * so the §6.6 CSP (default-src 'self') covers manifest-src and the icon img-src.
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
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
