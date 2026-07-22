import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../../components/SiteNav";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({ meta: [{ title: "Terms — ELSIAA" }, { name: "robots", content: "noindex" }] }),
  component: Terms,
});

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;

function Terms() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />
      <article className="mx-auto max-w-2xl px-6 pt-40 pb-20 md:pt-44">
        <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>Legal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]" style={{ fontFamily: "'Inter', sans-serif" }}>Terms.</h1>
        <p className="mt-5 rounded-xl border border-black/[0.07] bg-white p-5 text-[14px] leading-relaxed text-[#111111]/70">
          <span className="font-semibold text-[#111111]">The short version:</span> browse freely, book honestly,
          and don't misuse the site. Client engagements are governed by their own signed agreements — these terms
          cover the website itself.
        </p>
        <div className="mt-8 space-y-6 text-[14.5px] leading-[1.85] text-[#111111]/70" style={{ fontFamily: "'Inter', sans-serif" }}>
          <p><strong className="text-[#111111]">Use of the site.</strong> The site and its content — text, films, graphics, the lion — belong to ELSIAA LLC. You may browse and share links; you may not scrape, republish, or pass our work off as your own.</p>
          <p><strong className="text-[#111111]">Bookings and payments.</strong> Introductory calls are free. Paid consultations are billed as listed at the time of booking; card checkout is processed by our payment provider. Reschedule or cancel by email up to 24 hours before your slot for a full refund of any prepayment.</p>
          <p><strong className="text-[#111111]">Client work.</strong> Every engagement is governed by its signed agreement — scope, deliverables, ownership, and confidentiality live there, and that document controls if it differs from anything here.</p>
          <p><strong className="text-[#111111]">No warranties on the site.</strong> The website is provided as-is. We work hard to keep it accurate and available, but statistics cited from third-party research are theirs, and we may update content at any time.</p>
          <p><strong className="text-[#111111]">Liability.</strong> To the extent the law allows, ELSIAA LLC is not liable for indirect damages arising from use of this website. Nothing here limits liability that cannot lawfully be limited.</p>
          <p><strong className="text-[#111111]">Questions.</strong> <a className="underline" href="mailto:isya@elsiaa.com">isya@elsiaa.com</a>.</p>
          <p className="text-[13px] text-[#111111]/45">Effective July 2026 · ELSIAA LLC.</p>
        </div>
      </article>
    </main>
  );
}
