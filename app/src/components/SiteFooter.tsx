/*
  ELSIAA site footer — the page's proper ending.
  Wordmark, division/company/client link columns, direct contact, the six
  cities, and the legal line (copyright · privacy · terms). Ink on white,
  mono microcopy — same voice as the rest of the site.
*/

const mono = { fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Work",
    links: [
      { label: "Services", href: "/services" },
      { label: "Automate", href: "/automate" },
      { label: "Work", href: "/designs" },
      { label: "Consultation", href: "/consultation" },
      { label: "The Store", href: "/store" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Team", href: "/team" },
      { label: "Careers", href: "/careers" },
      { label: "Locations", href: "/locations" },
      { label: "Insights", href: "/insights" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Clients",
    links: [
      { label: "Clients", href: "/clients" },
      { label: "Get a Quote", href: "/quote" },
      { label: "Book a Call", href: "/contact" },
      { label: "Client Login", href: "/portal" },
      { label: "Search", href: "/search" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-black/[0.08] bg-white text-[#111111]">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:gap-16">
          {/* brand + direct */}
          <div>
            <a href="/" className="group flex items-center gap-3" aria-label="ELSIAA — home">
              <img src="/assets/elsiaa-lion.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
              <span
                className="text-[15px] font-bold tracking-[0.34em] text-[#111111]"
                style={inter}
              >
                ELSIAA
              </span>
            </a>
            <p className="mt-2 text-[10px] tracking-[0.3em] text-[#111111]/55 uppercase" style={mono}>
              — AI Done Better
            </p>
            <p className="mt-3 text-[10px] leading-relaxed tracking-[0.18em] text-[#111111]/50 uppercase" style={mono}>
              <b className="font-semibold text-[#1e6b3c]">E</b>ternal{" "}
              <b className="font-semibold text-[#1e6b3c]">L</b>ions ·{" "}
              <b className="font-semibold text-[#1e6b3c]">S</b>olutions ·{" "}
              <b className="font-semibold text-[#1e6b3c]">I</b>nnovation ·{" "}
              <b className="font-semibold text-[#1e6b3c]">A</b>utomation ·{" "}
              <b className="font-semibold text-[#1e6b3c]">A</b>lliance
            </p>
            <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-[#111111]/60" style={inter}>
              Design, automation, software, and consultation — four divisions,
              one standard.
            </p>
            <a
              href="mailto:isya@elsiaa.com"
              className="mt-5 inline-block text-[13px] font-semibold text-[#1e6b3c] hover:underline"
              style={inter}
            >
              isya@elsiaa.com
            </a>
            <p className="mt-4 text-[10px] leading-relaxed tracking-[0.2em] text-[#111111]/50 uppercase" style={mono}>
              New York · London · Geneva · Antwerp · Tel Aviv · Los Angeles
            </p>
          </div>

          {/* link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-[10px] tracking-[0.3em] text-[#1e6b3c] uppercase" style={mono}>
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={`${col.title}-${l.label}`}>
                    <a
                      href={l.href}
                      className="text-[13.5px] text-[#111111]/65 transition-colors hover:text-[#1e6b3c]"
                      style={inter}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* legal line */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-black/[0.06] pt-6 md:flex-row md:items-center">
          <p className="text-[11px] text-[#111111]/55" style={inter}>
            © {new Date().getFullYear()} ELSIAA. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              href="/legal/privacy"
              className="text-[10px] tracking-[0.22em] text-[#111111]/55 uppercase transition-colors hover:text-[#1e6b3c]"
              style={mono}
            >
              Privacy Policy
            </a>
            <a
              href="/legal/terms"
              className="text-[10px] tracking-[0.22em] text-[#111111]/55 uppercase transition-colors hover:text-[#1e6b3c]"
              style={mono}
            >
              Terms of Service
            </a>
            <span className="text-[10px] tracking-[0.22em] text-[#111111]/50 uppercase" style={mono}>
              24/7 Support
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
