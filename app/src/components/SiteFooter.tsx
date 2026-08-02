/*
  ELSIAA site footer — the page's proper ending.
  Wordmark, division/company/client link columns, direct contact, the six
  cities, and the legal line (copyright · privacy · terms). Ink on white,
  mono microcopy — same voice as the rest of the site.
*/

const mono = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
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
      { label: "Why ELSIAA", href: "/why-elsiaa" },
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
      { label: "Sign in", href: "/portal/sign-in" },
      { label: "Search", href: "/search" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
 <footer className="bg-white text-[#111111]">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:gap-16">
          {/* brand + direct */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="group flex items-center gap-3" aria-label="ELSIAA — home">
              <img src="/assets/elsiaa-lion.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
              <span
                className="text-[15px] font-bold text-[#111111]"
                style={inter}
              >
                ELSIAA
              </span>
            </a>
            <p className="mt-1.5 text-[13px] text-[#111111]/55" style={mono}>
              — AI Done Better
            </p>
            <p className="mt-1 text-[12.5px] text-[#111111]/45" style={mono}>
              ELSIAA — pronounced “ell-see-yuh”
            </p>
            <p className="mt-2 text-[12.5px] leading-snug text-[#111111]/50" style={mono}>
              <b className="font-semibold text-[#1e6b3c]">E</b>ternal{" "}
              <b className="font-semibold text-[#1e6b3c]">L</b>ions ·{" "}
              <b className="font-semibold text-[#1e6b3c]">S</b>olutions ·{" "}
              <b className="font-semibold text-[#1e6b3c]">I</b>nnovation ·{" "}
              <b className="font-semibold text-[#1e6b3c]">A</b>utomation ·{" "}
              <b className="font-semibold text-[#1e6b3c]">A</b>lliance
            </p>
            <p className="mt-3 max-w-xs text-[13px] leading-snug text-[#111111]/60" style={inter}>
              Design, automation, software, and consultation — four divisions,
              one standard.
            </p>
            <a
              href="mailto:info@elsiaa.com"
              className="mt-3 inline-block text-[13px] font-semibold text-[#1e6b3c] hover:underline"
              style={inter}
            >
              info@elsiaa.com
            </a>
            <p className="mt-2.5 text-[12.5px] leading-snug text-[#111111]/50" style={mono}>
              New York · London · Geneva · Antwerp · Tel Aviv · Los Angeles
            </p>
          </div>

          {/* link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-[13px] text-[#1e6b3c] " style={mono}>
                {col.title}
              </p>
              <ul className="mt-3 space-y-2">
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
        <div className="mt-8 flex flex-col md:mt-12 items-start justify-between gap-4 border-t border-black/[0.06] pt-6 md:flex-row md:items-center">
          <p className="text-[13px] text-[#111111]/55" style={inter}>
            © {new Date().getFullYear()} ELSIAA. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              href="/legal/privacy"
              className="text-[13px] text-[#111111]/55  transition-colors hover:text-[#1e6b3c]"
              style={mono}
            >
              Privacy Policy
            </a>
            <a
              href="/legal/terms"
              className="text-[13px] text-[#111111]/55  transition-colors hover:text-[#1e6b3c]"
              style={mono}
            >
              Terms of Service
            </a>
            <span className="text-[13px] text-[#111111]/50 " style={mono}>
              24/7 Support
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
