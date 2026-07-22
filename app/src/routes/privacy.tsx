import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { SiteFooter } from "../components/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — ELSIAA · AI Done Better" },
      {
        name: "description",
        content: "How ELSIAA collects, uses, and protects the information you share with us.",
      },
      { property: "og:title", content: "Privacy Policy — ELSIAA" },
      { property: "og:image", content: "https://elsiaa.higgsfield.app/assets/og_cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/privacy" }],
  }),
  component: PrivacyPage,
});

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "'Inter', sans-serif" } as const;

const SECTIONS: Array<{ h: string; body: string[] }> = [
  {
    h: "What we collect",
    body: [
      "When you book a call, request a quote, apply to a role, or contact us, we collect the information you choose to share: your name, email address, company details, and the description of your project. If you purchase from the ELSIAA Store, we additionally process the order and shipping details needed to fulfil it.",
      "Like most websites, our infrastructure records basic technical logs (IP address, browser type, pages visited) used for security and to keep the site running reliably.",
    ],
  },
  {
    h: "How we use it",
    body: [
      "We use your information to respond to your inquiry, scope and deliver the work you engage us for, process orders, and — only if you ask us to — keep you updated about ELSIAA. We do not sell your personal information, and we do not share it with third parties except the service providers required to operate this site and deliver our services (such as hosting, email, and payment processing), each bound to use it only on our behalf.",
    ],
  },
  {
    h: "Client work and confidentiality",
    body: [
      "Materials you share with us for a project — data, documents, credentials, business processes — are treated as confidential, used only to deliver the engagement, and covered by the terms of your service agreement. Where an engagement involves AI systems, we do not use your private data to train models for other clients.",
    ],
  },
  {
    h: "Retention and your rights",
    body: [
      "We keep personal information only as long as needed for the purposes above or as required by law. You may request a copy of the information we hold about you, ask us to correct it, or ask us to delete it by emailing isya@elsiaa.com. We respond to every request.",
    ],
  },
  {
    h: "Cookies",
    body: [
      "This site works without advertising or tracking cookies. Any cookies used are strictly functional — required for the site and client portal to operate.",
    ],
  },
  {
    h: "Changes and contact",
    body: [
      "If this policy changes, the updated version will be posted on this page with a new effective date. Questions about privacy at ELSIAA can be sent any time to isya@elsiaa.com.",
    ],
  },
];

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-6 pt-36 pb-20 md:pt-44">
        <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
          Legal
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>
          Privacy Policy.
        </h1>
        <p className="mt-4 text-[13px] text-[#111111]/45" style={inter}>
          Effective July 22, 2026
        </p>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
          ELSIAA ("we", "us") respects the information you trust us with. This
          page explains, plainly, what we collect through this website and how
          we use it.
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
