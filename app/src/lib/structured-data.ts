import { absoluteUrl } from "./site-url";
import { SOCIAL_PROFILES } from "./social";

/**
 * JSON-LD graphs, built once at module load.
 *
 * Every value here has to be independently checkable against the live site.
 * Deliberately absent, because the facts do not exist yet:
 *
 *   telephone     — OFFICE_PHONE is still the 1-888-000-0000 placeholder
 *   address       — all six offices read "Street address to be confirmed"
 *   aggregateRating / review — no verified client reviews exist
 *
 * Adding any of those as invented data is worse than omitting them: Google
 * treats fabricated structured data as spam, and a wrong address or phone in
 * a knowledge panel is a real-world support problem. Fill them in as the
 * facts land.
 */

const SITE = absoluteUrl("/");
const ORG_ID = `${absoluteUrl("/")}#organization`;

/** Cities ELSIAA states it operates in — matches /locations exactly. */
const CITIES = ["New York", "Los Angeles", "London", "Geneva", "Antwerp", "Tel Aviv"];

const organization = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "ELSIAA",
  alternateName: "Eternal Lions Solutions Innovation Automation Alliance",
  url: SITE,
  logo: {
    "@type": "ImageObject",
    url: absoluteUrl("/assets/elsiaa-lion-192.png"),
    width: 192,
    height: 192,
  },
  image: absoluteUrl("/assets/og_cover.png"),
  description:
    "ELSIAA designs, builds, and maintains AI systems, software, and brand for businesses — design, automation, software, and consultation.",
  email: "info@elsiaa.com",
  /* Only profiles ELSIAA actually controls — sourced from the same list the
     footer renders, so the two can never disagree. */
  sameAs: SOCIAL_PROFILES.map((p) => p.url),
  areaServed: CITIES.map((name) => ({ "@type": "City", name })),
  knowsAbout: [
    "Artificial intelligence",
    "Business process automation",
    "Web design",
    "Software development",
    "Brand and social media",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "info@elsiaa.com",
      availableLanguage: ["English", "Hebrew", "French", "German", "Spanish", "Russian"],
    },
  ],
};

const website = {
  "@type": "WebSite",
  "@id": `${SITE}#website`,
  url: SITE,
  name: "ELSIAA",
  publisher: { "@id": ORG_ID },
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

/** Homepage graph: who the company is, and how to search the site. */
export const HOME_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [organization, website],
});

/** A service page — `name`/`description` must match the visible copy. */
export function serviceJsonLd(opts: { name: string; description: string; path: string }) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    provider: { "@id": ORG_ID },
    areaServed: CITIES.map((name) => ({ "@type": "City", name })),
  });
}
