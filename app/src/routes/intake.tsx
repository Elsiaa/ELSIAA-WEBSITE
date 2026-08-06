import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { IntakeOS } from "../components/intake-os";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      /* hidden from navigation: not in the menu, footer, sitemap or search. */
      { name: "robots", content: "noindex, follow" },
      { title: "Intake OS — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Intake OS is ELSIAA's voice intake product: a phone line that understands a caller in plain language, matches them to the right specialist, and books the appointment — shown full-stack, front end and back end.",
      },
      { property: "og:title", content: "Intake OS — ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/intake") }],
  }),
  component: IntakePage,
});

const mono = { fontFamily: "var(--font-sans)" } as const;
const inter = { fontFamily: "var(--font-sans)" } as const;

const STACK = [
  [
    "Listen",
    "Streaming speech-to-text with barge-in — the caller can interrupt mid-sentence, like a real call. English and Russian, detected automatically.",
  ],
  [
    "Understand",
    "Clinical NLU maps plain, non-clinical language to symptom concepts. “Splits into two” becomes binocular diplopia — matched on meaning, not keywords.",
  ],
  [
    "Decide",
    "Deterministic routing rules score each specialist against the extracted concepts. Below the confidence threshold, it asks one clarifying question instead of guessing.",
  ],
  [
    "Act",
    "On a confirmed match it holds the slot, writes the intake note, and texts the confirmation — every side effect logged and reversible.",
  ],
];

const SPEC: Array<[string, string]> = [
  ["Languages", "English + Russian, auto-detected, switchable mid-call"],
  ["Latency", "Sub-second turns · barge-in supported"],
  ["Routing", "Deterministic rules, human-auditable — not a black box"],
  ["Safety", "Never books below the confidence threshold — asks instead"],
  ["Connections", "Calendar · EHR / intake · SMS · CRM"],
  ["Handoff", "Escalates to a human with full context on request"],
];

function IntakePage() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-32 pb-9 md:pt-40 md:pb-16">
        <Reveal>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>
              Product · Voice
            </p>
            <span
              className="rounded-full border border-[#1e6b3c]/30 px-2.5 py-0.5 text-[13px] font-bold text-[#1e6b3c] "
              style={mono}
            >
              Playable
            </span>
          </div>
          <h1
            className="mt-5 max-w-4xl font-semibold tracking-[-0.045em]"
            style={{ ...inter, fontSize: "clamp(2.5rem, 5.5vw, 4.75rem)", lineHeight: 0.99 }}
          >
            Intake OS — the line that
            <br />
            routes itself.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-[#111111]/60" style={inter}>
            A clinic with several specialists gets calls from patients who don't know which doctor
            they need. Intake OS answers, understands the symptom in plain language, matches the
            caller to the right specialist, and books it — and when it isn't sure, it asks instead
            of guessing. Below, you're seeing the whole thing: the caller's line, and the system
            underneath.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#console"
              className="rounded-full bg-[#1e6b3c] px-7 py-3.5 text-[13px] font-bold text-white  transition-all hover:bg-[#111111]"
              style={mono}
            >
              Run a call ↓
            </a>
            <a
              href="https://plumbing.demo.elsiaa.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#111111]/20 px-7 py-3.5 text-[13px] font-bold text-[#111111]  transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
              style={mono}
            >
              Open the live voice demo ↗
            </a>
          </div>
        </Reveal>
      </section>

      {/* the console */}
      <section id="console" className="scroll-mt-20 bg-[#F5F5F3] px-6 py-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl" style={inter}>
              Front end and back end, on one screen.
            </h2>
            <p
              className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60"
              style={inter}
            >
              Pick a call and run it. The left pane is what the caller experiences. The right pane
              is the runtime — transcription, the clinical NLU, the routing decision with its
              confidence, and every action it takes. Nothing is scripted theatre; each step is the
              actual shape of the pipeline.
            </p>
            <p className="mt-2 text-[13px] tracking-[0.04em] text-[#111111]/40" style={mono}>
              Names and data shown are illustrative — the routing behavior is real.
            </p>
          </Reveal>
          <div className="mt-8">
            <IntakeOS />
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="bg-white px-6 py-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>
              How it works
            </p>
            <h2
              className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl"
              style={inter}
            >
              Four stages. One of them is knowing when to stop.
            </h2>
          </Reveal>
          <div className="mt-9 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STACK.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.06}>
                <div className="border-t border-black/10 pt-4">
                  <span className="text-[13px] text-[#1e6b3c]" style={mono}>
                    {String(i + 1)}
                  </span>
                  <h3 className="mt-2 text-[17px] font-semibold tracking-[-0.02em]" style={inter}>
                    {t}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#111111]/60" style={inter}>
                    {d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* worked example + spec */}
      <section className="bg-[#F5F5F3] px-6 py-10 md:py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>
              Why it holds up
            </p>
            <h2
              className="mt-3 text-2xl font-semibold tracking-[-0.03em] md:text-3xl"
              style={inter}
            >
              It matches on meaning, not keywords.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#111111]/65" style={inter}>
              A caller says “my vision kind of splits into two when I'm reading in the evening” —
              never using the phrase “double vision.” A keyword system misses it entirely. Intake OS
              recognizes the symptom pattern and books with the neuro-ophthalmologist — because it
              understood what the caller meant.
            </p>
            <p
              className="mt-4 border-l-2 border-[#1e6b3c] pl-5 text-[15px] leading-relaxed font-medium text-[#111111]/80"
              style={inter}
            >
              And when a caller is vague, it doesn't take the next open slot to fill the silence. It
              asks one more question. A wrong booking wastes two appointments — the patient's and
              the clinic's.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
              <div className="border-b border-black/[0.06] px-5 py-3">
                <p className="text-[13px] text-[#111111]/45 " style={mono}>
                  Spec sheet
                </p>
              </div>
              <div className="divide-y divide-black/[0.06]">
                {SPEC.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[1fr_1.5fr] gap-3 px-5 py-3.5">
                    <span className="text-[13px] tracking-[0.08em] text-[#111111]/45 " style={mono}>
                      {k}
                    </span>
                    <span className="text-[13.5px] text-[#111111]/80" style={inter}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#F5F5F3] px-6 py-10 text-[#111111] md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-4xl font-semibold tracking-[-0.045em] md:text-6xl" style={inter}>
              Put it on your line.
            </h2>
            <p
              className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-[#111111]/60"
              style={inter}
            >
              Intake OS is built to your specialists, your rules, and your systems — then measured
              against the front desk it replaces before it ever answers a real call.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/contact"
                className="rounded-full bg-[#1e6b3c] px-9 py-4 text-[13px] font-bold text-white  transition-all hover:bg-[#111111] hover:text-white"
                style={mono}
              >
                Book a strategy call →
              </a>
              <a
                href="https://plumbing.demo.elsiaa.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-black/15 px-8 py-4 text-[13px] font-bold text-[#111111]  transition-all hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
                style={mono}
              >
                Open the live demo ↗
              </a>
            </div>
            <p className="mt-8 text-[13px] text-[#111111]/45 " style={mono}>
              <a
                href="/clients"
                className="underline-offset-2 hover:text-[#111111]/70 hover:underline"
              >
                Fully insured builds ↗
              </a>{" "}
              · Six cities · One standard
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
