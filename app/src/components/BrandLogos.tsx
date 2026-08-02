import { Reveal } from "./Reveal";

/*
  Why brands chose ELSIAA — homepage trust section.
  The client logos from the Designs page, running as a continuous carousel,
  under three concrete reasons brands picked ELSIAA to implement AI.
  Marquee pauses on hover; reduced motion gets a static wrapped grid.
*/

export const CLIENT_LOGOS: Array<[string, string, string]> = [
  ["/assets/logos/mr_bins.png", "Mr. Bins", "h-7"],
  ["/assets/logos/dialog_healthcare.png", "Dialog Healthcare", "h-5"],
  ["/assets/logos/first_medcare.png", "First Medcare Inc", "h-8"],
  ["/assets/logos/excelsior.png", "Excelsior Healthcare Solutions", "h-6"],
  ["/assets/logos/hiddenlight.png", "HiddenLight ABA", "h-6"],
  ["/assets/logos/beyond_autism.png", "Beyond Autism Services", "h-10"],
  ["/assets/logos/kore_autism.png", "Kore Autism Services", "h-8"],
  ["/assets/logos/hidden_talents.png", "Hidden Talents ABA", "h-8"],
  ["/assets/logos/diet_fantasy.png", "The Diet Fantasy", "h-8"],
  ["/assets/logos/aaa.png", "AAA", "h-8"],
  ["/assets/logos/uoft_ophtho.png", "University of Toronto — Dept. of Ophthalmology & Visual Sciences", "h-5"],
  ["/assets/logos/neuro_strabismus.png", "Neuro-Ophthalmology & Strabismus Fellowship — Division of Neurology", "h-6"],
];

const mono = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;

const REASONS: Array<{ title: string; body: string }> = [
  {
    title: "It shipped, and it worked.",
    body: "Working software in their business in weeks — not a deck, not a pilot that stalls before it reaches production.",
  },
  {
    title: "Their data stayed theirs.",
    body: "Hardened, tested, insured builds — and client data is never used to train models for anyone else. In healthcare, that's the whole conversation.",
  },
  {
    title: "Held to a higher standard.",
    body: "Healthcare groups and university departments chose ELSIAA because the work meets an academic and clinical bar — not a startup's.",
  },
];

function LogoRow() {
  return (
    <div className="relative mt-10 w-full overflow-hidden">
      <style>{`
        @keyframes elsiaa-home-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .elsiaa-home-marquee { animation: elsiaa-home-marquee 38s linear infinite; }
        .elsiaa-home-marquee:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .elsiaa-home-marquee { animation: none; flex-wrap: wrap; justify-content: center; row-gap: 2rem; width: 100%; }
          .elsiaa-home-marquee > [data-dup="1"] { display: none; }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
      <div className="elsiaa-home-marquee flex w-max items-center gap-16 pr-16">
        {[0, 1].map((dup) =>
          CLIENT_LOGOS.map(([src, alt, h]) => (
            <img
              key={`${src}-${dup}`}
              data-dup={dup}
              src={src}
              alt={dup === 0 ? alt : ""}
              aria-hidden={dup === 1 || undefined}
              className={`${h} w-auto flex-none opacity-90 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-100`}
              loading="lazy"
            />
          )),
        )}
      </div>
    </div>
  );
}

export function WhyBrandsChose() {
  return (
 <section className="relative overflow-hidden bg-white py-16 md:py-24" aria-label="Why brands chose ELSIAA">
      {/* subtle brand watermark — the ELSIAA lion, barely there */}
      <img
        src="/assets/elsiaa-lion.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-16 hidden w-[360px] opacity-[0.035] select-none md:block lg:-right-8 lg:w-[440px]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <h2
            className="max-w-2xl text-2xl font-semibold tracking-[-0.035em] text-[#111111] md:text-4xl"
            style={inter}
          >
            Why brands chose ELSIAA to implement AI.
          </h2>
          <p className="mt-3 max-w-xl text-[15px] text-[#111111]/60" style={inter}>
            The brands on this wall took AI from idea to production with one
            team. Here's what decided it.
          </p>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          {REASONS.map((r, i) => (
            <Reveal key={r.title} delay={0.05 + i * 0.05}>
              <div className="h-full rounded-2xl border border-black/[0.07] bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1e6b3c]/35">
                <p className="text-[13px] text-[#1e6b3c] " style={mono}>
                  0{i + 1}
                </p>
                <h3 className="mt-2.5 text-[16px] font-semibold tracking-[-0.02em] text-[#111111]" style={inter}>
                  {r.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#111111]/55" style={inter}>
                  {r.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <Reveal delay={0.1}>
        <LogoRow />
      </Reveal>
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
            <a
              href="/why-elsiaa"
              className="inline-flex min-h-[50px] items-center rounded-full bg-[#1e6b3c] px-7 text-[15px] font-semibold text-white transition-all hover:bg-[#111111]"
              style={mono}
            >
              Why ELSIAA →
            </a>
            <a
              href="/designs"
              className="text-[13px] text-[#1e6b3c] hover:underline"
              style={mono}
            >
              See the work behind the logos ↗
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
