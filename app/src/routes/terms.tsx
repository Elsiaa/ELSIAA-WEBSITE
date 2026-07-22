import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { SiteFooter } from "../components/SiteFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — ELSIAA · AI Done Better" },
      {
        name: "description",
        content: "The terms that govern use of the ELSIAA website, store, and client engagements.",
      },
      { property: "og:title", content: "Terms of Service — ELSIAA" },
      { property: "og:image", content: "https://elsiaa.higgsfield.app/assets/og_cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/terms" }],
  }),
  component: TermsPage,
});

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "'Inter', sans-serif" } as const;

const SECTIONS: Array<{ h: string; body: string[] }> = [
  {
    h: "Using this site",
    body: [
      "By using the ELSIAA website you agree to these terms. The site's content — text, graphics, designs, code, and media — belongs to ELSIAA or its licensors and may not be reproduced or used commercially without our written permission.",
    ],
  },
  {
    h: "Consultations and engagements",
    body: [
      "Booking a strategy call, sprint, or advisory engagement through this site expresses intent to engage; each engagement is governed by the written agreement or statement of work confirmed by email before work begins. Prices listed on this site are indicative and confirmed at booking. The free introductory call carries no obligation on either side.",
    ],
  },
  {
    h: "Client work",
    body: [
      "Unless a signed agreement says otherwise: you retain ownership of the materials you provide, ELSIAA retains ownership of its pre-existing tools and know-how, and deliverables transfer to you on full payment. Both sides keep each other's non-public information confidential.",
    ],
  },
  {
    h: "The Store",
    body: [
      "Store orders are confirmed by email. Prices are in U.S. dollars. If an item arrives damaged or wrong, write to isya@elsiaa.com within 14 days and we will replace it or refund you.",
    ],
  },
  {
    h: "No warranties on site content",
    body: [
      "Content on this site — including industry statistics and insights — is provided for general information and may change without notice. It is not professional advice for your specific situation; that is what an engagement is for.",
    ],
  },
  {
    h: "Liability",
    body: [
      "To the fullest extent permitted by law, ELSIAA's liability arising from use of this website is limited to the amount you paid us through it. Nothing in these terms limits liability that cannot lawfully be limited.",
    ],
  },
  {
    h: "Changes and contact",
    body: [
      "We may update these terms; the current version always lives at this page. Questions can be sent to isya@elsiaa.com.",
    ],
  },
];

function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-6 pt-36 pb-20 md:pt-44">
        <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
          Legal
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>
          Terms of Service.
        </h1>
        <p className="mt-4 text-[13px] text-[#111111]/55" style={inter}>
          Effective July 22, 2026
        </p>
        <div className="mt-12 space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.h}>
              <h2 className="text-[17px] font-semibold tracking-[-0.02em]" style={inter}>
                {s.h}
              </h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 text-[14.5px] leading-relaxed text-[#111111]/60" style={inter}>
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
