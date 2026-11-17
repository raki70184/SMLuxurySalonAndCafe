/**
 * Conversion tracking + lead attribution (single source of truth).
 *
 *  - trackEvent()            GA4 event, no-op when GA4 isn't loaded (dev / no VITE_GA4_ID).
 *  - trackContactClick()     click_to_call / whatsapp_click / instagram_click / email_click.
 *  - installClickTracking()  one document-level listener that classifies every
 *                            tel: / wa.me / instagram / mailto link on the site, so
 *                            individual components don't each need wiring.
 *  - captureAttribution()    remembers how the visitor arrived (Google Ads gclid,
 *                            utm_* tags, landing page, referrer) for 90 days.
 *  - getAttribution()        what the contact form sends along with each lead.
 *
 * SSR-safe: nothing touches `window` at module top (prerender runs in Puppeteer).
 * In GA4, mark generate_lead / click_to_call / whatsapp_click as key events and
 * import them into Google Ads (Goals → Conversions → Import → GA4).
 */

export type ContactChannel = "call" | "whatsapp" | "instagram" | "email";

const CHANNEL_EVENT: Record<ContactChannel, string> = {
  call: "click_to_call",
  whatsapp: "whatsapp_click",
  instagram: "instagram_click",
  email: "email_click",
};

/** Query params we keep. gbraid/wbraid are Google's iOS-privacy variants of gclid. */
const ATTRIBUTION_PARAMS = [
  "gclid",
  "gbraid",
  "wbraid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

type AttributionParam = (typeof ATTRIBUTION_PARAMS)[number];

export type Attribution = Partial<Record<AttributionParam, string>> & {
  landing_page?: string;
  referrer?: string;
  first_seen?: string;
};

const STORAGE_KEY = "smluxe_attribution";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // Google Ads' default click-conversion window

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

export function trackContactClick(channel: ContactChannel, location: string): void {
  trackEvent(CHANNEL_EVENT[channel], {
    contact_channel: channel,
    link_location: location,
    page_path: window.location.pathname,
  });
}

function channelForHref(href: string): ContactChannel | null {
  const h = href.trim().toLowerCase();
  if (h.startsWith("tel:")) return "call";
  if (h.startsWith("mailto:")) return "email";
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|(www\.)?whatsapp\.com)\//.test(h)) return "whatsapp";
  if (/^https?:\/\/(www\.)?instagram\.com\//.test(h)) return "instagram";
  return null;
}

/** Nearest meaningful region of the page, so reports can tell footer vs contact-page clicks. */
function locationFor(el: Element): string {
  const tagged = el.closest<HTMLElement>("[data-track-location]");
  if (tagged?.dataset.trackLocation) return tagged.dataset.trackLocation;
  if (el.closest("footer, .footer")) return "footer";
  if (el.closest("nav, header")) return "header";
  return "page";
}

let clickTrackingInstalled = false;

export function installClickTracking(): void {
  if (clickTrackingInstalled || typeof document === "undefined") return;
  clickTrackingInstalled = true;
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as Element | null;
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const channel = channelForHref(link.getAttribute("href") || "");
      if (channel) trackContactClick(channel, locationFor(link));
    },
    { capture: true, passive: true },
  );
}

function readStored(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    const age = Date.now() - new Date(parsed.first_seen || 0).getTime();
    return age >= 0 && age < MAX_AGE_MS ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Call once per page load. A new ad click / tagged link replaces what we had
 * (last paid touch wins, as in Google Ads); otherwise the first organic landing
 * is kept so returning visitors still show where they originally came from.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const qs = new URLSearchParams(window.location.search);
    const fromUrl: Attribution = {};
    for (const key of ATTRIBUTION_PARAMS) {
      const v = qs.get(key);
      if (v) fromUrl[key] = v.slice(0, 200);
    }
    const hasTags = Object.keys(fromUrl).length > 0;
    if (!hasTags && readStored()) return;

    let referrer = "";
    if (document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (ref.host !== window.location.host) referrer = ref.origin + ref.pathname;
      } catch {
        /* ignore malformed referrer */
      }
    }
    const record: Attribution = {
      ...fromUrl,
      landing_page: window.location.pathname,
      referrer,
      first_seen: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* storage blocked (private mode etc.): attribution is best-effort */
  }
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  return readStored() ?? {};
}

/** One human-readable line for the salon's sheet/email, e.g. "Google Ads · campaign: diwali". */
export function describeSource(a: Attribution): string {
  if (a.gclid || a.gbraid || a.wbraid) {
    return `Google Ads${a.utm_campaign ? ` · campaign: ${a.utm_campaign}` : ""}`;
  }
  if (a.utm_source) {
    return [a.utm_source, a.utm_medium, a.utm_campaign].filter(Boolean).join(" / ");
  }
  if (a.referrer) {
    try {
      const host = new URL(a.referrer).host;
      if (/(^|\.)google\./.test(host)) return "Google search / Maps (organic)";
      return `Referral: ${host}`;
    } catch {
      return `Referral: ${a.referrer}`;
    }
  }
  return "Direct / organic";
}
