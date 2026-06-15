import type { Metadata } from "next";
import { StudyApp } from "@/components/study/StudyApp";

// The interactive app is a client shell with no public content to index; keep crawl
// focused on the landing page (§8 — private/app routes stay noindex).
export const metadata: Metadata = {
  title: "Study",
  robots: { index: false, follow: false },
};

export default function StudyPage() {
  return <StudyApp />;
}
