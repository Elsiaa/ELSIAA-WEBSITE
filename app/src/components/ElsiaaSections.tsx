const SERVICES = [
  {
    title: "AI implementation",
    body: "We take the technology everyone talks about and wire it into how your business actually runs.",
  },
  {
    title: "Web development",
    body: "Websites engineered like products, not brochures. Fast, precise, built to convert.",
  },
  {
    title: "Automation systems",
    body: "The repetitive work disappears. Your team gets its hours back.",
  },
  {
    title: "Browser automation",
    body: "Agents that operate the web the way your best operator would, around the clock.",
  },
  {
    title: "Enterprise web",
    body: "Internal platforms, portals, and infrastructure that hold up under real load.",
  },
  {
    title: "Strategy",
    body: "A clear map from where you are to what AI makes possible, without the jargon.",
  },
] as const;

const CITIES = [
  "ANTWERP",
  "GENEVA",
  "LONDON",
  "TEL AVIV",
  "NEW YORK",
  "NEW JERSEY",
  "LOS ANGELES",
  "MARYLAND",
  "PENNSYLVANIA",
] as const;

export function ElsiaaSections() {
  return (
    <>
      {/* Services */}
      <section id="services" className="bg-white px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium  text-[#1e6b3c]">
            What we actually do
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-[#111111] md:text-5xl">
            The gap between AI and your business. We are the bridge.
          </h2>
          <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 md:grid-cols-3">
            {SERVICES.map((s) => (
              <article
                key={s.title}
                className="group bg-white p-8 transition-colors duration-300 hover:bg-[#f4faf6]"
              >
                <h3 className="text-lg font-semibold text-[#111111]">
                  {s.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
                  {s.body}
                </p>
                <div className="mt-6 h-px w-8 bg-neutral-300 transition-all duration-300 group-hover:w-16 group-hover:bg-[#2e9e58]" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-[#0d0f0e] px-6 py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              AI done better.
            </h2>
            <p className="mt-3 max-w-md text-neutral-400">
              Tell us what slows your business down. We will show you what
              happens when it stops.
            </p>
          </div>
          <a
            href="/contact"
            className="inline-block rounded-xl bg-[#1e6b3c] px-10 py-4 text-base font-semibold text-white shadow-[0_8px_30px_rgba(30,107,60,0.35)] transition-transform duration-200 hover:-translate-y-1 hover:bg-[#2e9e58]"
          >
            Get in touch
          </a>
        </div>
      </section>

      {/* Footer register */}
      <footer className="bg-[#0d0f0e] px-6 pb-12 pt-4">
        <div className="mx-auto max-w-6xl border-t border-white/10 pt-10">
          <div className="flex flex-col items-center gap-6 text-center">
            <p
              className="text-2xl italic text-neutral-300"
              style={{ fontFamily: "Cormorant Garamond, Georgia, serif" }}
            >
              Omnia possibilia
            </p>
            <p
              className="text-[13px] text-neutral-500"
              style={{ fontFamily: "IBM Plex Mono, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              {CITIES.join("  ·  ")}
            </p>
            <p className="text-xs text-neutral-600">
              © {new Date().getFullYear()} ELSIAA — Eternal Lions Solutions
              Innovation Automation Alliance
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
