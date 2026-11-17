import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureAttribution, installClickTracking } from "../../lib/tracking";

/**
 * Visitor analytics: Google Analytics 4 + Cloudflare Web Analytics.
 *
 * Both are activated only when their env vars are present, so the same code
 * runs in dev/preview/prod without spurious requests when the IDs aren't set.
 *
 *   VITE_GA4_ID            e.g. "G-XXXXXXXXXX"
 *   VITE_CF_BEACON_TOKEN   e.g. "abc123def456…"
 *
 * Set both in Netlify env vars (Site → Build & deploy → Environment) and
 * locally in .env (gitignored). Both ship to the client by design.
 */
const GA4_ID = import.meta.env.VITE_GA4_ID as string | undefined;
const CF_TOKEN = import.meta.env.VITE_CF_BEACON_TOKEN as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Inject GA4 + Cloudflare beacon scripts once, then forward route changes to GA4. */
export const Analytics: React.FC = () => {
  const { pathname, search } = useLocation();

  // One-time script injection on first mount in the browser.
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Lead attribution + call/WhatsApp/Instagram click events (src/lib/tracking.ts).
    captureAttribution();
    installClickTracking();

    if (GA4_ID && !document.getElementById("ga4-loader")) {
      const loader = document.createElement("script");
      loader.id = "ga4-loader";
      loader.async = true;
      loader.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
      document.head.appendChild(loader);

      const init = document.createElement("script");
      init.id = "ga4-init";
      init.text = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA4_ID}', {
  send_page_view: false,
  anonymize_ip: true,
  cookie_flags: 'SameSite=None;Secure'
});
`;
      document.head.appendChild(init);
    }

    if (CF_TOKEN && !document.getElementById("cf-beacon")) {
      const beacon = document.createElement("script");
      beacon.id = "cf-beacon";
      beacon.defer = true;
      beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
      beacon.setAttribute("data-cf-beacon", JSON.stringify({ token: CF_TOKEN }));
      document.head.appendChild(beacon);
    }
  }, []);

  // Send a GA4 page_view on every client-side route change. The initial view
  // is also covered because pathname is set on first render.
  useEffect(() => {
    if (!GA4_ID || typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: pathname + (search || ""),
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, search]);

  return null;
};
