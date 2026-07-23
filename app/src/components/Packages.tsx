/*
  Packages — the carefully displayed list of what ELSIAA offers.
  Grouped by division; hairline rows, price on the right, everything
  quotable through /quote. The three consultation engagements keep their
  real prices.
*/

const mono = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;

type Pkg = { name: string; blurb: string; price: string };
type Group = { division: string; items: Pkg[] };

const GROUPS: Group[] = [
  {
    division: "Design",
    items: [
      { name: "Brand Identity", blurb: "Logo, palette, type, and the rules that hold it together.", price: "Quote" },
      { name: "Website Design", blurb: "A site engineered to be believed — designed, built, shipped.", price: "Quote" },
      { name: "Product & Campaign Imagery", blurb: "One phone photo in, a full campaign out.", price: "Quote" },
      { name: "App & Dashboard Design", blurb: "Interfaces your users don't need a manual for.", price: "Quote" },
    ],
  },
  {
    division: "Automation",
    items: [
      { name: "Workflow Automation", blurb: "Sales, operations, finance — running while you sleep.", price: "Quote" },
      { name: "AI Chatbots & Agents", blurb: "Front-line answers and back-office hands, around the clock.", price: "Quote" },
      { name: "CRM & Pipeline Automation", blurb: "Every lead followed up, every stage tracked, automatically.", price: "Quote" },
    ],
  },
  {
    division: "Software",
    items: [
      { name: "MVP Build", blurb: "First wireframe to live product, fast.", price: "Quote" },
      { name: "Custom Web Application", blurb: "SaaS, internal tools, client portals — built to spec.", price: "Quote" },
      { name: "Mobile Apps", blurb: "iOS and Android, one codebase, store-ready.", price: "Quote" },
    ],
  },
  {
    division: "Consultation",
    items: [
      { name: "Basic — one session", blurb: "A 1-on-1 strategy call plus a written action plan in 48h.", price: "$350" },
      { name: "Sprint — two weeks", blurb: "We don't just advise; we implement the first fix with you.", price: "$1,850" },
      { name: "Advisory — monthly", blurb: "ELSIAA as your standing technology counsel.", price: "Custom" },
    ],
  },
];

export function Packages() {
  return (
    <div>
      {GROUPS.map((g) => (
        <div key={g.division} className="mt-10 first:mt-0">
          <p className="text-[13px] text-[#1e6b3c] " style={mono}>
            {g.division}
          </p>
          <ul className="mt-3 divide-y divide-black/[0.06] border-y border-black/[0.06]">
            {g.items.map((p) => (
              <li key={p.name}>
                <a
                  href={p.price === "Quote" ? "/quote" : "/contact"}
                  className="group flex items-baseline justify-between gap-6 py-4 transition-colors hover:bg-[#FBFBFA]"
                >
                  <div className="min-w-0">
                    <h3 className="text-[15.5px] font-semibold tracking-[-0.01em] text-[#111111]" style={inter}>
                      {p.name}
                    </h3>
                    <p className="mt-0.5 text-[13.5px] text-[#111111]/60" style={inter}>
                      {p.blurb}
                    </p>
                  </div>
                  <span
                    className="flex-none text-[13px] font-medium text-[#1e6b3c] transition-transform group-hover:translate-x-0.5"
                    style={mono}
                  >
                    {p.price === "Quote" ? "Get a quote →" : p.price}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
