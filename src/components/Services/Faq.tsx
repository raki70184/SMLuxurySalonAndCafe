import React, { useState } from "react";
import { Helmet } from "react-helmet-async";

/**
 * Frequently asked questions shown at the bottom of the Services page.
 *
 * Rendered visibly AND emitted as FAQPage JSON-LD via Helmet. Google rich
 * results require both: the visible answer must match the schema word-for-word,
 * so changes to one MUST be mirrored in the other (we do that automatically
 * by deriving the schema from this same array).
 */
export interface FaqEntry {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqEntry[] = [
  {
    question: "Where is SM Luxe Salon located?",
    answer:
      "We're at Jain Balaji BigTown Mall, Shop No 304, 3rd Floor, Safilguda, Malkajgiri, Hyderabad — 500047, Telangana. Free mall parking is available.",
  },
  {
    question: "What are your opening hours?",
    answer:
      "We're open all seven days, Monday to Sunday, 11:00 AM – 9:00 PM.",
  },
  {
    question: "Do I need to book an appointment, or can I walk in?",
    answer:
      "Walk-ins are welcome whenever a stylist is free, but to avoid waiting we recommend booking in advance. Call or WhatsApp +91 93472 38248, or use the form on the Contact page.",
  },
  {
    question: "What services do you offer?",
    answer:
      "Hair (cut, colour, balayage, smoothening, keratin, botox, hair spa), bridal and party makeup, lash extensions, manicure and pedicure (classic, gel, acrylic, dip powder, nail art), facials and skin treatments, plus our in-house premium cafe.",
  },
  {
    question: "Which professional brands do you use?",
    answer:
      "We use professional Davines and Voesh products as our primary lines, along with other premium imported brands for hair colour, treatments, manicures and pedicures.",
  },
  {
    question: "Do you do bridal makeup at outside venues?",
    answer:
      "Yes. We take bridal makeup bookings for outside venues across Hyderabad and nearby cities. Get in touch with the date and venue and we'll share a custom quote.",
  },
  {
    question: "Is the cafe open to people who aren't getting salon services?",
    answer:
      "Absolutely — the SM Luxe Cafe is open to everyone during salon hours. Drop in for coffee, a frappe, a sandwich, pizza, pasta or dessert.",
  },
  {
    question: "How do I book an appointment?",
    answer:
      "Three ways: call or WhatsApp +91 93472 38248, fill the form on the Contact page, or DM us on Instagram at @sm.luxe_.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
};

export const ServicesFaq: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(FAQ_JSON_LD)}</script>
      </Helmet>
      <section className="servicesFaq" aria-labelledby="services-faq-heading" style={faqWrap}>
        <h2 id="services-faq-heading" style={faqHeading}>
          Frequently Asked Questions
        </h2>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {FAQ_ITEMS.map((item, idx) => {
            const open = openIdx === idx;
            return (
              <div key={item.question} style={faqItem}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`faq-answer-${idx}`}
                  onClick={() => setOpenIdx(open ? null : idx)}
                  style={{ ...faqButton, color: open ? "#1a1a1a" : "#333" }}
                >
                  <span>{item.question}</span>
                  <span style={{ ...faqChevron, transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
                </button>
                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  style={{ ...faqAnswer, maxHeight: open ? 320 : 0, opacity: open ? 1 : 0 }}
                >
                  <p style={{ margin: "0 0 1rem 0", lineHeight: 1.6, color: "#444" }}>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};

const faqWrap: React.CSSProperties = {
  padding: "4rem 1.5rem 5rem",
  background: "#fafafa",
  marginTop: "3rem",
};

const faqHeading: React.CSSProperties = {
  textAlign: "center",
  fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
  fontWeight: 400,
  letterSpacing: "0.04em",
  marginBottom: "2.5rem",
  color: "#1a1a1a",
};

const faqItem: React.CSSProperties = {
  borderBottom: "1px solid #e4e4e4",
};

const faqButton: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "1.25rem 0.5rem",
  background: "transparent",
  border: "none",
  fontSize: "1.05rem",
  fontWeight: 500,
  textAlign: "left",
  cursor: "pointer",
  fontFamily: "inherit",
};

const faqChevron: React.CSSProperties = {
  fontSize: "1.4rem",
  lineHeight: 1,
  color: "#888",
  transition: "transform 0.25s ease",
  display: "inline-block",
  minWidth: "1.4rem",
  textAlign: "center",
};

const faqAnswer: React.CSSProperties = {
  overflow: "hidden",
  transition: "max-height 0.3s ease, opacity 0.25s ease",
  padding: "0 0.5rem",
};
