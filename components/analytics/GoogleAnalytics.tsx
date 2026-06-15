import Script from "next/script";
import { GA_ID } from "@/lib/site";

/**
 * GA4 loader (§8.2). No-ops when NEXT_PUBLIC_GA_ID is unset, so local/dev traffic
 * never pollutes production analytics. PII-safe: never pass names/answers/IDs as params.
 */
export function GoogleAnalytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
