/* ELSIAA Merch — the catalog. One source of truth for listing, product
   pages, cart, and checkout. Slugs are stable — they are URLs. */

export type Category = "day-to-day" | "city-line" | "old-money" | "objects";

export type MerchProduct = {
  slug: string;
  name: string;
  price: number;
  img: string;
  category: Category;
  limited: boolean;
  oneSize: boolean;
  blurb: string;
  description: string;
  material: string;
};

export const CATEGORY_META: Record<Category, { title: string; sub: string; note: string }> = {
  "day-to-day": {
    title: "day-to-day",
    sub: "black / white / grey",
    note: "a line of clothing the creator would wear. cut heavy, branded quietly, never reprinted. three fits — fitted professional, tailored casual, slightly oversized.",
  },
  "city-line": {
    title: "city line",
    sub: "limited",
    note: "europe, new york, los angeles — pop colors, one drop per city.",
  },
  "old-money": {
    title: "old money",
    sub: "oversized",
    note: "oversized, heavyweight, one tiny crest — nothing more.",
  },
  objects: {
    title: "objects",
    sub: "scandinavian minimal",
    note: "the studio, portable. pure white, one mark each.",
  },
};

export const SIZES = ["XS", "S", "M", "L", "XL"] as const;

export const MERCH: MerchProduct[] = [
  {
    slug: "fitted-professional-tee",
    name: "Fitted Professional Tee",
    price: 68,
    img: "/assets/store/dtd_fitted_black.jpg",
    category: "day-to-day",
    limited: false,
    oneSize: false,
    blurb: "Jet black, cut sharp.",
    description:
      "The working uniform. Cut close through the shoulder and chest, long enough to stay tucked or fall clean. Branded once — a tonal lion at the hem — and never louder than that.",
    material: "240gsm combed heavyweight cotton · pre-shrunk · tonal embroidery",
  },
  {
    slug: "tailored-casual-tee",
    name: "Tailored Casual Tee",
    price: 64,
    img: "/assets/store/dtd_tailored_white.jpg",
    category: "day-to-day",
    limited: false,
    oneSize: false,
    blurb: "Clean white, tailored ease.",
    description:
      "Between fitted and relaxed — the tee for every day that matters slightly less. Collar holds its shape for years, not washes.",
    material: "220gsm combed cotton · reinforced ribbed collar · tonal embroidery",
  },
  {
    slug: "relaxed-oversized-tee",
    name: "Relaxed Oversized Tee",
    price: 72,
    img: "/assets/store/dtd_oversized_grey.jpg",
    category: "day-to-day",
    limited: false,
    oneSize: false,
    blurb: "Heather grey, slightly oversized.",
    description:
      "Dropped shoulder, wide body, heavy drape. Oversized by intention, not accident — the fit reads deliberate from across the room.",
    material: "260gsm heavyweight cotton · dropped shoulder · garment-washed",
  },
  {
    slug: "elsiaa-pants",
    name: "ELSIAA Pants",
    price: 118,
    img: "/assets/store/merch_pants.jpg",
    category: "day-to-day",
    limited: false,
    oneSize: false,
    blurb: "Tapered heavyweight fleece.",
    description:
      "The pants for the person who works from anywhere and dresses like it's somewhere. Tapered leg, deep pockets, the lion at the hip in tonal thread.",
    material: "400gsm brushed fleece · tapered leg · tonal hip embroidery",
  },
  {
    slug: "new-york-hoodie",
    name: "New York Hoodie",
    price: 188,
    img: "/assets/store/city_ny_cobalt.jpg",
    category: "city-line",
    limited: true,
    oneSize: false,
    blurb: "Electric cobalt. Where the pride began.",
    description:
      "One drop, one city. Electric cobalt heavyweight fleece with the New York chapter mark. When it's gone, it's gone — we don't reprint cities.",
    material: "450gsm heavyweight fleece · double-lined hood · one drop only",
  },
  {
    slug: "los-angeles-tee",
    name: "Los Angeles Tee",
    price: 148,
    img: "/assets/store/city_la_coral.jpg",
    category: "city-line",
    limited: true,
    oneSize: false,
    blurb: "Sunset coral. West coast chapter.",
    description:
      "Sunset coral for the west coast chapter. Heavy cotton, city mark on the chest, drop number inside the collar.",
    material: "260gsm heavyweight cotton · numbered drop · one run only",
  },
  {
    slug: "london-crewneck",
    name: "London Crewneck",
    price: 178,
    img: "/assets/store/city_ldn_lilac.jpg",
    category: "city-line",
    limited: true,
    oneSize: false,
    blurb: "Pop lilac. The Mayfair run.",
    description:
      "Pop lilac crewneck from the Mayfair run. Structured collar, heavyweight body, the London mark stitched — not printed.",
    material: "420gsm loopback fleece · stitched city mark · one run only",
  },
  {
    slug: "zurich-tee",
    name: "Zürich Tee",
    price: 168,
    img: "/assets/store/city_zrh_swiss.jpg",
    category: "city-line",
    limited: true,
    oneSize: false,
    blurb: "Swiss red, full cross.",
    description:
      "Swiss red, full cross, zero apology. The Zürich drop went crazy the first time — this is the last of it.",
    material: "260gsm heavyweight cotton · numbered drop · final units",
  },
  {
    slug: "tel-aviv-tee",
    name: "Tel Aviv Tee",
    price: 148,
    img: "/assets/store/merch_tlv.jpg",
    category: "city-line",
    limited: true,
    oneSize: false,
    blurb: "Sand heavyweight cotton. The Rothschild drop.",
    description:
      "Sand-toned heavyweight cotton from the Rothschild drop. City mark on the chest, Hebrew chapter line inside the hem.",
    material: "260gsm heavyweight cotton · numbered drop · one run only",
  },
  {
    slug: "old-money-tee-ivory",
    name: "Old Money Tee — Ivory",
    price: 128,
    img: "/assets/store/om_ivory.jpg",
    category: "old-money",
    limited: true,
    oneSize: false,
    blurb: "Oversized, drapey, one tiny crest.",
    description:
      "Ivory, oversized, heavyweight. One tiny crest at the chest and nothing else — restraint is the flex. Drapes like it costs more than it does.",
    material: "300gsm heavyweight cotton · oversized cut · embroidered crest",
  },
  {
    slug: "old-money-tee-navy",
    name: "Old Money Tee — Navy",
    price: 128,
    img: "/assets/store/om_navy.jpg",
    category: "old-money",
    limited: true,
    oneSize: false,
    blurb: "Deep navy, gold-thread crest.",
    description:
      "Deep navy with a gold-thread crest. The shirt that's been quiet since forever. Oversized, heavyweight, zero graphics.",
    material: "300gsm heavyweight cotton · gold-thread crest · oversized cut",
  },
  {
    slug: "black-mug",
    name: "black mug",
    price: 28,
    img: "/assets/store/obj_mug.jpg",
    category: "objects",
    limited: true,
    oneSize: true,
    blurb: "matte ceramic. white mark.",
    description:
      "Matte black ceramic, one white mark. The studio's own mug, made portable. Holds espresso through oat lattes with equal dignity.",
    material: "matte-glazed stoneware · 350ml · dishwasher safe",
  },
  {
    slug: "cap",
    name: "cap",
    price: 48,
    img: "/assets/store/obj_cap.jpg",
    category: "objects",
    limited: true,
    oneSize: true,
    blurb: "unstructured cotton. tonal mark.",
    description:
      "Unstructured six-panel in washed cotton. Tonal lion, brass closure, the kind of cap that gets better for years.",
    material: "washed cotton twill · brass closure · tonal embroidery",
  },
  {
    slug: "tote",
    name: "tote",
    price: 42,
    img: "/assets/store/obj_tote.jpg",
    category: "objects",
    limited: true,
    oneSize: true,
    blurb: "heavyweight canvas.",
    description:
      "Heavyweight natural canvas, one mark, interior pocket. Carries a laptop, a book, and the week's errands without complaint.",
    material: "16oz natural canvas · interior pocket · reinforced handles",
  },
  {
    slug: "beanie",
    name: "beanie",
    price: 44,
    img: "/assets/store/obj_beanie.jpg",
    category: "objects",
    limited: true,
    oneSize: true,
    blurb: "merino rib. woven label.",
    description:
      "Ribbed merino, folded cuff, one woven label. Warm without bulk — the winter version of quiet.",
    material: "100% merino wool · ribbed knit · woven label",
  },
  {
    slug: "socks",
    name: "socks",
    price: 18,
    img: "/assets/store/obj_socks.jpg",
    category: "objects",
    limited: true,
    oneSize: true,
    blurb: "ribbed crew. knitted mark.",
    description:
      "Ribbed crew socks with the mark knitted in — not printed on. Cushioned sole, holds its shape.",
    material: "combed cotton blend · knitted mark · cushioned sole",
  },
  {
    slug: "bottle",
    name: "bottle",
    price: 38,
    img: "/assets/store/obj_bottle.jpg",
    category: "objects",
    limited: true,
    oneSize: true,
    blurb: "brushed steel. etched mark.",
    description:
      "Brushed steel, double-walled, the mark etched — permanent. Keeps cold 24 hours, hot 12.",
    material: "double-wall stainless steel · 750ml · laser-etched mark",
  },
];

export const bySlug = (slug: string) => MERCH.find((p) => p.slug === slug);
export const byCategory = (c: Category) => MERCH.filter((p) => p.category === c);
export const CATEGORY_ORDER: Category[] = ["day-to-day", "city-line", "old-money", "objects"];
