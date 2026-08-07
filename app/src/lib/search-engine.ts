/*
  ELSIAA search engine.

  Three things the old substring filter could not do:
    1. Typos — "desing", "atomation", "carrers" now resolve, via a
       Damerau-Levenshtein distance that counts a transposition as one edit.
    2. Entities — "ceo" finds Yisrael Krug, "coo" finds Jacob Rubelow,
       "boss"/"owner"/"who runs it" all land on the founder. Every entry
       carries an alias bag that is searched alongside its label.
    3. "Did you mean" — when a word only matched after correction, the nearest
       vocabulary term is offered back, the way a search engine would.

  The index covers the whole public front end: every route, the people, the
  priced services, and every city.
*/

export type Entry = {
  label: string;
  group: string;
  href: string;
  /** alias bag — synonyms, misspellings-in-spirit, and related vocabulary */
  keys?: string;
  /** one line of context shown under the label on the results page */
  desc?: string;
};

export const SEARCH_INDEX: Entry[] = [
  /* ---------------- pages ---------------- */
  { label: "Home", group: "Pages", href: "/", keys: "start homepage main front index landing" },
  {
    label: "Why ELSIAA",
    group: "Pages",
    href: "/why-elsiaa",
    keys: "about us about company reasons why choose trust standard who we are story",
    desc: "Why businesses bring the work to us instead of doing it alone.",
  },
  {
    label: "Services",
    group: "Pages",
    href: "/services",
    keys: "what we do offerings pricing prices cost how much websites apps software",
    desc: "Websites from $750, apps from $10k, backend software from $1,000.",
  },
  {
    label: "Design & our work",
    group: "Pages",
    href: "/designs",
    keys: "designs portfolio showcase work examples case studies before after websites branding",
    desc: "The work itself — live client sites, before and after.",
  },
  {
    label: "Automations",
    group: "Pages",
    href: "/automate",
    keys: "automate automation ai systems agents workflows bots deployments robots",
    desc: "AI systems that run the repetitive work in your business.",
  },
  {
    label: "Clients",
    group: "Pages",
    href: "/clients",
    keys: "customers results proof outcomes who we work with new client onboarding process",
    desc: "Who we work with and what shipping actually changed.",
  },
  {
    label: "Team",
    group: "Pages",
    href: "/team",
    keys: "people leadership staff who works here management founders directors advisors employees",
    desc: "The people behind ELSIAA.",
  },
  {
    label: "Locations",
    group: "Pages",
    href: "/locations",
    keys: "offices where cities addresses countries global international find us near me",
    desc: "Offices across three continents.",
  },
  {
    label: "Careers",
    group: "Pages",
    href: "/careers",
    keys: "jobs hiring apply application employment work here vacancies openings roles recruit resume cv",
    desc: "We're hiring across design, engineering, client work and legal ops.",
  },
  {
    label: "Store",
    group: "Pages",
    href: "/store",
    keys: "shop merch merchandise buy products apparel",
  },
  {
    label: "Social media",
    group: "Pages",
    href: "/social",
    keys: "instagram tiktok linkedin content video posting reels feed marketing ads",
    desc: "Video, content, and brand run end to end.",
  },
  {
    label: "Contact",
    group: "Pages",
    href: "/contact",
    keys: "get in touch reach us talk email phone call message support help enquiry inquiry",
    desc: "Every way to start with ELSIAA.",
  },
  {
    label: "Overview",
    group: "Pages",
    href: "/overview",
    keys: "summary what is elsiaa introduction company overview",
  },

  /* ---------------- the ways in ---------------- */
  {
    label: "Free 20-minute call",
    group: "Start",
    href: "/consultation",
    keys: "free call consultation book talk intro discovery no charge twenty minute chat",
    desc: "Tell us what you're dealing with. No pitch, no charge.",
  },
  /* The "$120 1-hour consult" entry was removed with the option itself: the
     only call ELSIAA offers is the free 20-minute one above. */
  {
    label: "Get a quote",
    group: "Start",
    href: "/quote",
    keys: "quote estimate proposal pricing cost budget how much price request scope",
    desc: "A clear plan and price within three days.",
  },
  {
    label: "Client sign in",
    group: "Start",
    href: "/portal/sign-in",
    keys: "login log in portal account existing client dashboard access sign on",
  },

  /* ---------------- priced services ----------------
     All eight, in the same order and at the same prices as /services. If a
     price moves there it has to move here — a search result quoting a stale
     number is worse than no result. */
  {
    label: "Web Design — from $750",
    group: "Services",
    href: "/services",
    keys: "website web site build design 750 cheap affordable landing page small business",
    desc: "A site built to convert — designed, written, and shipped live.",
  },
  {
    label: "Business Automation — from $1,000",
    group: "Services",
    href: "/services",
    keys: "business automation workflow process back office admin manual tasks 1000",
    desc: "The repetitive work, handed to a system that does not forget.",
  },
  {
    label: "Brand & Social — from $1,500",
    group: "Services",
    href: "/services",
    keys: "brand branding logo identity social media content instagram marketing 1500",
    desc: "The brand and the feed, built as one thing.",
  },
  {
    label: "Browser Automation — from $2,500",
    group: "Services",
    href: "/services",
    keys: "browser automation scraping data entry portal rpa bot web 2500",
    desc: "The clicking, typing, and copying, done by a machine.",
  },
  {
    label: "AI Phone & Chat Agents — from $2,500",
    group: "Services",
    href: "/services",
    keys: "ai phone chat agent voice call answering receptionist bot support intake 2500",
    desc: "Agents that answer, qualify, and book — around the clock.",
  },
  {
    label: "Operational Dashboards — from $3,500",
    group: "Services",
    href: "/services",
    keys: "dashboard reporting analytics kpi metrics operations visibility bi 3500",
    desc: "One screen that tells you what is actually happening.",
  },
  {
    label: "Mobile Apps — from $10k",
    group: "Services",
    href: "/services",
    keys: "app apps mobile ios android application build 10k store release",
    desc: "iOS and Android products, built properly and released to the stores.",
  },
  {
    label: "Custom Platforms — from $12k",
    group: "Services",
    href: "/services",
    keys: "custom platform software saas portal system bespoke backend database api 12k",
    desc: "The system the business runs on, built to fit.",
  },
  {
    label: "Website design & development",
    group: "Services",
    href: "/designs",
    keys: "web ui ux saas ecommerce dashboards frontend",
  },
  {
    label: "UI/UX design",
    group: "Services",
    href: "/designs",
    keys: "interface user experience product design wireframe prototype",
  },
  {
    label: "Mobile app design",
    group: "Services",
    href: "/designs",
    keys: "ios android app interface mobile",
  },
  {
    label: "Branding & logo design",
    group: "Services",
    href: "/designs",
    keys: "brand identity logo packaging print visual",
  },
  {
    label: "3D product renders",
    group: "Services",
    href: "/designs",
    keys: "render product staging commercial imagery visualisation",
  },
  {
    label: "Sales automation",
    group: "Services",
    href: "/automate",
    keys: "outreach crm pipeline leads follow up prospecting",
  },
  {
    label: "Operations automation",
    group: "Services",
    href: "/automate",
    keys: "workflow back office admin scheduling dispatch process",
  },
  {
    label: "Customer support automation",
    group: "Services",
    href: "/automate",
    keys: "support helpdesk chatbot email slack tickets answering",
  },
  {
    label: "Finance automation",
    group: "Services",
    href: "/automate",
    keys: "invoice billing reporting bookkeeping accounting dashboards",
  },
  {
    label: "AI workflow automation",
    group: "Services",
    href: "/automate",
    keys: "ai agents assistants llm gpt copilot integration",
  },

  /* ---------------- the people ---------------- */
  {
    label: "Yisrael Krug — Founder & CEO",
    group: "People",
    href: "/team",
    keys: "ceo chief executive officer founder owner boss head leader in charge runs the company principal israel krug yisroel",
    desc: "Founder & CEO.",
  },
  {
    label: "David Heimowitz — Co-Founder & CTO",
    group: "People",
    href: "/team",
    keys: "cto chief technology officer tech lead engineering head technical co-founder cofounder heimovitz dovid",
    desc: "Co-Founder & CTO.",
  },
  {
    label: "Jacob Rubelow — Partner & COO",
    group: "People",
    href: "/team",
    keys: "coo chief operating officer operations partner legal counsel rubelow yaakov jake",
    desc: "Partner & Chief Operating Officer.",
  },
  {
    label: "Chaim Lieberman — Executive Director & Partner",
    group: "People",
    href: "/team",
    keys: "executive director partner chaim lieberman haim liberman",
    desc: "Executive Director & Partner.",
  },
  {
    label: "Izzy Eisenberg — Director, California Business",
    group: "People",
    href: "/team",
    keys: "director california west coast los angeles business izzy isaac eisenberg",
    desc: "Director, California Business.",
  },
  {
    label: "Ynon Azulai — AI & Technology Expert",
    group: "People",
    href: "/team",
    keys: "ai technology expert engineer machine learning ynon azulai yinon",
    desc: "AI & Technology Expert.",
  },
  {
    label: "Dr. Edward Margolin — Healthcare Advisor",
    group: "People",
    href: "/team",
    keys: "doctor md advisor healthcare medical professor ophthalmology neurology toronto edward margolin",
    desc: "Healthcare Advisor.",
  },
  {
    label: "David Spivak — Director of Social Media",
    group: "People",
    href: "/team",
    /* "dovid"/"dovids" included deliberately: the mailbox is dovids@elsiaa.com
       while the display name is David, so either spelling has to find him. */
    keys: "david dovid dovids spivak social media director content photography linktree instagram marketing email new york jerusalem israel",
    desc: "Runs ELSIAA's social output end to end.",
  },

  /* ---------------- cities ---------------- */
  {
    label: "New York office",
    group: "Locations",
    href: "/locations",
    keys: "nyc new york manhattan usa america united states headquarters hq east coast",
  },
  {
    label: "Los Angeles office",
    group: "Locations",
    href: "/locations",
    keys: "la los angeles california usa america west coast",
  },
  {
    label: "London office",
    group: "Locations",
    href: "/locations",
    keys: "london uk england britain united kingdom europe",
  },
  {
    label: "Geneva office",
    group: "Locations",
    href: "/locations",
    keys: "geneva switzerland swiss geneve europe",
  },
  {
    label: "Antwerp office",
    group: "Locations",
    href: "/locations",
    keys: "antwerp antwerpen belgium belgian flemish europe",
  },
  {
    label: "Tel Aviv office",
    group: "Locations",
    href: "/locations",
    keys: "tel aviv israel israeli middle east",
  },
  {
    label: "Baltimore office",
    group: "Locations",
    href: "/locations",
    keys: "baltimore maryland md usa",
  },
  {
    label: "Montvale office",
    group: "Locations",
    href: "/locations",
    keys: "montvale new jersey nj usa",
  },
  {
    label: "Kingston office",
    group: "Locations",
    href: "/locations",
    keys: "kingston pennsylvania pa usa",
  },

  /* ---------------- careers detail ---------------- */
  {
    label: "Apply — Design",
    group: "Careers",
    href: "/careers",
    keys: "designer design job role hiring apply creative",
  },
  {
    label: "Apply — Engineering",
    group: "Careers",
    href: "/careers",
    keys: "engineer developer software job role hiring apply programmer coder",
  },
  {
    label: "Apply — Client & Sales",
    group: "Careers",
    href: "/careers",
    keys: "sales account client job role hiring apply business development",
  },
  /* "Apply — Legal & Ops" was removed here when the role was removed from
     the careers page, so search can no longer offer a job that isn't open. */

  /* ---------------- client work, by brand name ----------------
     Someone who knows the work by the client's name, not by the service,
     had no way to find it. These match the logo band on /designs. */
  {
    label: "Mr. Bins",
    group: "Our work",
    href: "/designs",
    keys: "mr bins primebins prime bins waste bin cleaning brand website client work rebrand",
    desc: "Brand and site, rebuilt from the ground up.",
  },
  {
    label: "Dialog Healthcare",
    group: "Our work",
    href: "/designs",
    keys: "dialog healthcare medical health client work brand",
  },
  {
    label: "First Medcare Inc",
    group: "Our work",
    href: "/designs",
    keys: "first medcare medical healthcare client work brand",
  },
  {
    label: "Excelsior Healthcare Solutions",
    group: "Our work",
    href: "/designs",
    keys: "excelsior healthcare solutions medical client work brand",
  },
  {
    label: "HiddenLight ABA",
    group: "Our work",
    href: "/designs",
    keys: "hiddenlight hidden light aba autism therapy client work brand",
  },
  {
    label: "Beyond Autism Services",
    group: "Our work",
    href: "/designs",
    keys: "beyond autism services aba therapy client work brand",
  },
  {
    label: "Kore Autism Services",
    group: "Our work",
    href: "/designs",
    keys: "kore autism services aba therapy client work brand",
  },
  {
    label: "Hidden Talents ABA",
    group: "Our work",
    href: "/designs",
    keys: "hidden talents aba autism therapy client work brand",
  },
  {
    label: "The Diet Fantasy",
    group: "Our work",
    href: "/designs",
    keys: "diet fantasy nutrition food brand client work",
  },
  {
    label: "Mitzva App",
    group: "Our work",
    href: "/designs",
    keys: "mitzva app non profit charity nonprofit mobile application live demo",
    desc: "A live non-profit app, embedded on the designs page.",
  },

  /* ---------------- how to reach a human ---------------- */
  {
    label: "Customer service — 1-888-915-5531",
    group: "Start",
    href: "/contact",
    keys: "phone number call customer service support toll free 888 915 5531 speak human talk",
    desc: "The main ELSIAA line.",
  },
  {
    label: "Emergency line — 443-651-9097",
    group: "Start",
    href: "/locations",
    keys: "emergency urgent after hours phone number 443 651 9097 out of hours critical",
    desc: "For urgent issues outside desk hours.",
  },
  {
    label: "Instagram — @elsiaa_ai",
    group: "Start",
    href: "/social",
    keys: "instagram insta social media follow account handle elsiaa_ai",
  },

  /* ---------------- social media services ----------------
     The whole /social offering was unreachable from search — "clipping"
     returned nothing at all. These match the cards on that page. */
  {
    label: "Clipping — one recording, a month of posts",
    group: "Social",
    href: "/social",
    keys: "clipping clips viral short form reels tiktok shorts vertical captions podcast webinar repurpose go viral",
    desc: "One long recording, cut into a month of short-form.",
  },
  {
    label: "Social strategy",
    group: "Social",
    href: "/social",
    keys: "social strategy plan content calendar positioning audience growth",
  },
  {
    label: "Video production",
    group: "Social",
    href: "/social",
    keys: "video production filming shoot camera crew content social",
  },
  {
    label: "Editing",
    group: "Social",
    href: "/social",
    keys: "editing editor post production cut captions colour social video",
  },
  {
    label: "Content & copy",
    group: "Social",
    href: "/social",
    keys: "content copy copywriting captions writing posts social voice",
  },
  {
    label: "Brand setup",
    group: "Social",
    href: "/social",
    keys: "brand setup profile bio handles consistency social accounts",
  },
  {
    label: "Personal brand",
    group: "Social",
    href: "/social",
    keys: "personal brand founder executive thought leadership linkedin face social",
  },
  {
    label: "Meta Ads",
    group: "Social",
    href: "/social",
    keys: "meta ads facebook instagram paid advertising campaigns roas social",
  },
  {
    label: "Google Reviews",
    group: "Social",
    href: "/social",
    keys: "google reviews reputation stars ratings local seo social proof",
  },

  /* ---------------- case studies & method ---------------- */
  {
    label: "Custom dispatch & field service OS",
    group: "Case study",
    href: "/automate",
    keys: "dispatch field service routing logistics operations fleet technicians eta jobs plumbing hvac",
    desc: "One board that takes the job, routes the nearest tech, sends the ETA, and reconciles the ticket.",
  },
  {
    label: "Custom sales & CRM automation layer",
    group: "Case study",
    href: "/automate",
    keys: "sales crm pipeline leads enrichment routing follow up revenue prospecting",
    desc: "Every lead captured, enriched, and routed the moment it lands.",
  },
  {
    label: "Custom finance reconciliation engine",
    group: "Case study",
    href: "/automate",
    keys: "finance reconciliation invoices payments matching month end close bookkeeping",
    desc: "Invoices and payments matched automatically; the close measured in hours, not a week.",
  },
  {
    label: "The build process",
    group: "How we work",
    href: "/automate",
    keys: "process method how it works steps map design build implement prove hand over timeline",
    desc: "Map the real work, design the system, build live, prove results, hand it over running.",
  },
  {
    label: "Client portal",
    group: "Clients",
    href: "/portal",
    keys: "portal workspace project dashboard existing client account files updates",
    desc: "Existing clients — your project workspace.",
  },

  /* ---------------- legal ---------------- */
  {
    label: "Privacy policy",
    group: "Legal",
    href: "/legal/privacy",
    keys: "privacy data gdpr policy personal information",
  },
  {
    label: "Terms of service",
    group: "Legal",
    href: "/legal/terms",
    keys: "terms conditions legal agreement service",
  },
];

/* ------------------------------------------------------------------ */
/* matching                                                            */
/* ------------------------------------------------------------------ */

/** lowercase, strip accents, collapse punctuation to spaces */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  const t = norm(s);
  return t ? t.split(" ") : [];
}

/**
 * Damerau-Levenshtein (optimal string alignment). Unlike plain Levenshtein
 * this counts a swapped pair as a single edit, which is what makes the
 * common typo "desing" → "design" a distance of 1 rather than 2.
 */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const d: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }
  return d[a.length][b.length];
}

/** how far a word of this length is allowed to be wrong */
function tolerance(len: number): number {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 8) return 2;
  return 3;
}

/** every distinct term in the index — the vocabulary "did you mean" draws from */
const VOCAB: string[] = (() => {
  const set = new Set<string>();
  for (const e of SEARCH_INDEX) {
    for (const t of [...tokens(e.label), ...tokens(e.keys ?? ""), ...tokens(e.group)]) {
      if (t.length > 2) set.add(t);
    }
  }
  return [...set];
})();

/** nearest vocabulary term, or null if nothing is close enough */
function nearestTerm(word: string): string | null {
  if (VOCAB.includes(word)) return word;
  const max = tolerance(word.length);
  if (max === 0) return null;
  let best: string | null = null;
  let bestD = max + 1;
  for (const term of VOCAB) {
    if (Math.abs(term.length - word.length) > max) continue;
    const dist = editDistance(word, term);
    if (dist < bestD) {
      bestD = dist;
      best = term;
      if (dist === 1) break;
    }
  }
  return bestD <= max ? best : null;
}

type Field = { list: string[]; weight: number };

/** best score for one query word against one entry; 0 means no match */
function wordScore(fields: Field[], w: string): { score: number; fuzzy: boolean } {
  let best = 0;
  let fuzzy = false;
  const max = tolerance(w.length);
  for (const f of fields) {
    for (const t of f.list) {
      let s = 0;
      let wasFuzzy = false;
      if (t === w) s = 10;
      else if (w.length >= 2 && t.startsWith(w)) s = 7;
      else if (w.length >= 3 && t.includes(w)) s = 4;
      else if (max > 0) {
        const dist = editDistance(w, t);
        if (dist <= max) {
          s = Math.max(1, 6 - dist * 2);
          wasFuzzy = true;
        }
      }
      s *= f.weight;
      if (s > best) {
        best = s;
        fuzzy = wasFuzzy;
      }
    }
  }
  return { score: best, fuzzy };
}

/* A destination page is a better answer than a sub-item that merely mentions
   the same word — "design" should land on the Design page, not on the careers
   row that happens to be titled "Apply — Design". */
const GROUP_BOOST: Record<string, number> = {
  Pages: 6,
  Start: 5,
  People: 4,
  Services: 2,
  Locations: 2,
  /* Client brands rank just under Services: someone typing "Mr. Bins" wants
     the work, but a generic word inside a brand name shouldn't outrank a
     service page. */
  "Our work": 2,
  Social: 2,
  "Case study": 1,
};

export type Hit = { entry: Entry; score: number };
export type SearchResult = { hits: Hit[]; didYouMean: string | null };

/**
 * Rank the index against a query. Every query word must match something
 * (possibly fuzzily) for an entry to survive, so extra words narrow rather
 * than broaden — the behaviour people expect from a search box.
 */
/** filler words that carry no signal in a query like "how much is a website" */
const STOPWORDS = new Set(
  (
    "a an the and or of for to in on at by is are am was were be do does did " +
    "how what who whom whose where when why which that this these those i me my " +
    "we our you your it its can could would should will want need get got have has " +
    "there here about with from as if not no yes please"
  ).split(" "),
);

export function search(query: string, limit = 10): SearchResult {
  const raw = tokens(query);
  if (!raw.length) return { hits: [], didYouMean: null };

  /* Drop filler words, but never everything — a query that is nothing but
     stopwords ("the who") still deserves its literal interpretation. */
  const stripped = raw.filter((w) => !STOPWORDS.has(w));
  const words = stripped.length ? stripped : raw;

  const correctedWords = new Set<string>();

  const rank = (requireAll: boolean): Hit[] => {
    const out: Hit[] = [];
    for (const e of SEARCH_INDEX) {
      const fields: Field[] = [
        { list: tokens(e.label), weight: 3 },
        { list: tokens(e.keys ?? ""), weight: 1.5 },
        { list: tokens(e.group), weight: 1 },
      ];
      let total = 0;
      let matched = 0;
      let ok = true;
      const fuzzyHere: string[] = [];
      for (const w of words) {
        const { score, fuzzy } = wordScore(fields, w);
        if (score === 0) {
          if (requireAll) {
            ok = false;
            break;
          }
          continue;
        }
        matched++;
        total += score;
        if (fuzzy) fuzzyHere.push(w);
      }
      if (!ok || matched === 0) continue;
      // reward covering more of the query, and prefer precise short labels
      total *= matched / words.length;
      total += Math.max(0, 6 - tokens(e.label).length);
      total += GROUP_BOOST[e.group] ?? 0;
      out.push({ entry: e, score: total });
      fuzzyHere.forEach((w) => correctedWords.add(w));
    }
    return out;
  };

  /* Strict first — every word must land, so extra words narrow the result.
     If that finds nothing, fall back to "any word matches", which is what
     rescues conversational queries like "how much is a website". */
  let hits = rank(true);
  if (!hits.length) hits = rank(false);

  hits.sort((a, b) => b.score - a.score);

  /* Offer a correction when a word had to be fuzzed to match, or when the
     query found nothing at all but the vocabulary has something close. */
  let didYouMean: string | null = null;
  const needsHelp = hits.length === 0 || words.some((w) => correctedWords.has(w));
  if (needsHelp) {
    const fixed = words.map((w) => nearestTerm(w) ?? w);
    const joined = fixed.join(" ");
    if (joined !== words.join(" ")) didYouMean = joined;
  }

  return { hits: hits.slice(0, limit), didYouMean };
}
