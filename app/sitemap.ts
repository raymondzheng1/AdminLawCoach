import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Stable lastModified (a content-update constant), not new Date() per request (§8).
const LAST_MODIFIED = new Date("2026-06-16");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE.url}/`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 1 },
    // /study is a private app shell — intentionally excluded (noindex, §8).
  ];
}
