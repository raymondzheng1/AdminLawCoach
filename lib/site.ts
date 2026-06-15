/** Single source of truth for site identity / copy used across SEO + UI (§3.3, §8). */
export const SITE = {
  name: "AdminLaw Coach",
  tagline: "Master your administrative-law course — free, no sign-up.",
  description:
    "A free, login-free study companion for one administrative-law course. Ask, practise, and check your work — every answer sourced and pinpointed to your course materials, or it says it isn't covered.",
  // Driven by one env var so moving off *.vercel.app is config, not code (§8).
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://adminlaw-coach.vercel.app").replace(/\/$/, ""),
} as const;

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
