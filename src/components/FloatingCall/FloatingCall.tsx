import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Phone } from "lucide-react";
import styles from "./FloatingCall.module.css";
import { trackContactClick } from "../../lib/tracking";

type Content = {
  brand: string;
  description: string;
  phone: string; // human readable
  telHref: string; // tel:+91...
};

const formatTel = (num: string) => num.replace(/[^+\d]/g, "");

// Plain lookup, NOT a hook — it calls nothing from React. It was named
// `usePageContent`, which made eslint treat it as a hook and (correctly) flag
// the call inside useMemo below as a rules-of-hooks violation.
const getPageContent = (pathname: string): Content => {
  const baseNumber = "+91 93472 38248"; // Salon primary
  const tel = `tel:${formatTel(baseNumber)}`;

  const map: Record<string, Omit<Content, "telHref">> = {
    "/": {
      brand: "SM Luxury Salon",
      description:
        "We honor your uniqueness with authentic, natural-looking transformations.",
      phone: baseNumber,
    },
    "/about": {
      brand: "About SM",
      description: "Personalized care, crafted around you.",
      phone: baseNumber,
    },
    "/services": {
      brand: "Signature Services",
      description: "Ready to book? Speak to our experts now.",
      phone: baseNumber,
    },
    "/gallery": {
      brand: "The Art of Beauty",
      description: "Like what you see? Let's create your look.",
      phone: baseNumber,
    },
    "/contact": {
      brand: "Let's Connect",
      description: "Prefer a call? We’re happy to help.",
      phone: baseNumber,
    },
    "/cafe": {
      brand: "The Beauty Cafe",
      description: "Order a brew or ask about our cafe services.",
      phone: baseNumber,
    },
  };

  const pick = map[pathname] ?? map["/"];
  return { ...pick, telHref: tel };
};

const FloatingCall: React.FC = () => {
  const { pathname } = useLocation();
  const content = useMemo(() => getPageContent(pathname), [pathname]);
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className={styles.backdrop} onClick={() => setOpen(false)} />
      )}

      {/* Floating Button */}
      <div className={styles.fabWrapper} aria-hidden={open ? "true" : "false"}>
        <div className={styles.pulseRing} />
        <button
          className={styles.fabButton}
          aria-label="Call salon"
          onClick={() => setOpen(true)}
        >
          <Phone className={styles.icon} />
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className={styles.modalCard} role="dialog" aria-modal="true">
          <button
            className={styles.close}
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
          <div className={styles.brand}>{content.brand}</div>
          <p className={styles.desc}>{content.description}</p>
          <div className={styles.number} data-track-location="floating_call">
            <a href={content.telHref}>{content.phone}</a>
          </div>
          <div className={styles.actions}>
            <button
              className={styles.actionBtn}
              onClick={() => {
                trackContactClick("call", "floating_call");
                window.location.href = content.telHref;
              }}
            >
              Call Now
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => {
                trackContactClick("whatsapp", "floating_call");
                window.open(
                  `https://wa.me/${formatTel(content.phone)}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            >
              WhatsApp
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingCall;
