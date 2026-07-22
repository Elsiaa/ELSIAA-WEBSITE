import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../../components/SiteNav";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({ meta: [{ title: "Privacy — ELSIAA" }, { name: "robots", content: "noindex" }] }),
  component: Privacy,
});

const mono = { fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" } as const;

function Privacy() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />
      <article className="mx-auto max-w-2xl px-6 pt-40 pb-20 md:pt-44">
        <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>Legal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>Privacy.</h1>
        <p className="mt-5 rounded-xl border border-black/[0.07] bg-white p-5 text-[14px] leading-relaxed text-[#111111]/70">
          <span className="font-semibold text-[#111111]">The short version:</span> we collect only what you give us
          — your name, contact details, and what you tell us about your project. We use it to do the work and to
          reach you about it. We don't sell it, rent it, or hand it to advertisers. Ever.
        </p>
        <div className="mt-8 space-y-6 text-[14.5px] leading-[1.85] text-[#111111]/70" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
          <p><strong className="text-[#111111]">What we collect.</strong> Information you submit through our booking, application, and contact forms: names, email addresses, phone numbers, resumes, and the content of your messages. Standard technical logs (pages visited, device type) for keeping the site working.</p>
          <p><strong className="text-[#111111]">How we use it.</strong> To respond to you, deliver engagements, process applications, send confirmations you requested, and improve the site. Payment details are handled by our payment processor and never stored on our systems.</p>
          <p><strong className="text-[#111111]">Who sees it.</strong> The ELSIAA team, and the service providers that make the site run (hosting, email delivery, payments) — each bound to use your information only to provide their service to us.</p>
          <p><strong className="text-[#111111]">Your choices.</strong> Ask us what we hold about you, ask us to correct it, or ask us to delete it: <a className="underline" href="mailto:isya@elsiaa.com">isya@elsiaa.com</a>. We answer these personally.</p>
          <p><strong className="text-[#111111]">Retention.</strong> We keep engagement records as long as the law and good bookkeeping require, and delete the rest when it stops being useful.</p>
          <p className="text-[13px] text-[#111111]/45">Effective July 2026. If we change this policy, the date changes with it.</p>
        </div>
      </article>
    </main>
  );
}
