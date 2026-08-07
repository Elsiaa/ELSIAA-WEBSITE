# ELSIAA — Business Card Reference

Everything below is taken from the live site, not retyped. Sources: `app/src/routes/team.tsx`, `app/src/routes/locations.tsx`, `app/src/components/ConsultOptions.tsx`.

Last pulled: 7 August 2026.

---

## 1. People

| # | Name | Title | Location | Email |
|---|------|-------|----------|-------|
| 1 | Yisrael Krug | Founder & CEO | New York | yisrael@elsiaa.com |
| 2 | David Heimowitz | Co-Founder & CTO | New Jersey | davidh@elsiaa.com |
| 3 | Jacob Rubelow | Partner & Chief Operating Officer | New York | jacob@elsiaa.com |
| 4 | Chaim Lieberman | Chief Executive Director of EU | Antwerp | chaim@elsiaa.com |
| 5 | Izzy Eisenberg | Director, California Business | Los Angeles | izzy@elsiaa.com |
| 6 | David Spivak | Director of Social Media | New York / Jerusalem | dovids@elsiaa.com |
| 7 | Ynon Azulai | AI & Technology Expert | Jerusalem / Tel Aviv | **⚠ none on file** |
| 8 | Dr. Edward Margolin, MD, FRCSC, Dipl. ABO | Healthcare Advisor | University of Toronto | drmargolin@elsiaa.com |

### Notes before you print

- **Ynon Azulai has no email anywhere on the site.** He is the only person without one. You'll need to decide his address before his card can be made.
- **David Spivak's mailbox is `dovids@`, not `davids@`.** His name displays as "David" but the address uses the Dovid spelling. This is easy to get wrong on a card — worth double-checking with him.
- **Dr. Margolin's full postnominals** are `MD, FRCSC, Dipl. ABO`. On a card you may want just "Dr. Edward Margolin, MD" with the rest on the reverse — the full string is long for a single line.
- **Dr. Margolin is an advisor**, not staff, and his location is an institution (University of Toronto), not an ELSIAA office. His card probably shouldn't carry an office address.
- **Izzy Eisenberg's title** reads "Director, California Business" on the site. If the card should say "Director of California Operations" or similar, change it in both places so they don't diverge.

---

## 2. Company details for the reverse of every card

| Field | Value |
|-------|-------|
| Company | ELSIAA |
| Full name | Eternal Lions Solutions Innovation Automation Alliance |
| Website | elsiaa.com |
| General email | info@elsiaa.com |
| Customer service | 1-888-915-5531 |
| Emergency line | 443-651-9097 |
| Tagline in use | AI Done Better |

---

## 3. Offices and desk emails

Each office has its own address. Use the desk email matching the person's city.

| City | Country | Desk email | Timezone |
|------|---------|-----------|----------|
| New York *(HQ)* | United States | ny@elsiaa.com | Eastern |
| Los Angeles | United States | la@elsiaa.com | Pacific |
| London | United Kingdom | euInfo@elsiaa.com | Greenwich |
| Geneva | Switzerland | euInfo@elsiaa.com | Central European |
| Antwerp | Belgium | euInfo@elsiaa.com | Central European |
| Tel Aviv | Israel | isr@elsiaa.com | Israel |

Regional US offices also listed on the site: **Baltimore**, **Montvale**, **Kingston** (150 James St, Pennsylvania).

Desk hours: **11:00–17:00 local time**, Monday to Friday. Visits by appointment.

> **⚠ No street addresses exist yet.** Every office on the site currently reads *"Street address to be confirmed."* Only Kingston has one (150 James St). If the cards are meant to carry a physical address, that information doesn't exist anywhere in the project yet and has to come from you.

---

## 4. Logo files

Both are in `app/public/assets/`:

| File | Size | Use |
|------|------|-----|
| `elsiaa-lion.png` | 1024 × 1024 | **Use this one for print.** |
| `elsiaa-lion-192.png` | 192 × 192 | Web favicon only — too small to print. |

> **⚠ Both are PNG, not vector.** At 1024px the large file prints cleanly up to roughly 3.4 inches at 300 dpi, which covers a standard 3.5 × 2 inch card *if the logo stays small on it*. If you want the lion large, or want it foil-stamped, embossed, or printed at any size above about 3 inches, **you need an SVG or AI/EPS version** — there is no vector logo in the project. A printer will ask for one.

### Brand colours

| Colour | Hex | Where it's used |
|--------|-----|-----------------|
| ELSIAA green | `#1e6b3c` | Primary. Buttons, links, accents. |
| Bright green | `#2e9e58` | Secondary accent, status dots. |
| Near-black | `#111111` | All body text. |
| Off-white | `#F5F5F3` | Alternating section backgrounds. |

Note the site's near-black is `#111111`, not pure black — worth matching so cards sit alongside the site.

### Typeface

**Libre Franklin** — the whole site is set in it (`styles.css:173`, falling back to the system sans only if it fails to load).

It's a free Google Font, so your printer can download and embed it at no cost: <https://fonts.google.com/specimen/Libre+Franklin>. The site uses **Semibold** for names and headings and **Regular** for body text, so ask for those two weights.

---

## 5. Copy-paste block

Plain text, one person per block, for pasting straight into a design tool.

```
Yisrael Krug
Founder & CEO
New York
yisrael@elsiaa.com

David Heimowitz
Co-Founder & CTO
New Jersey
davidh@elsiaa.com

Jacob Rubelow
Partner & Chief Operating Officer
New York
jacob@elsiaa.com

Chaim Lieberman
Chief Executive Director of EU
Antwerp
chaim@elsiaa.com

Izzy Eisenberg
Director, California Business
Los Angeles
izzy@elsiaa.com

David Spivak
Director of Social Media
New York / Jerusalem
dovids@elsiaa.com

Ynon Azulai
AI & Technology Expert
Jerusalem / Tel Aviv
[EMAIL NEEDED]

Dr. Edward Margolin, MD, FRCSC, Dipl. ABO
Healthcare Advisor
University of Toronto
drmargolin@elsiaa.com
```

Reverse side, same on every card:

```
ELSIAA — AI Done Better
elsiaa.com
info@elsiaa.com
1-888-915-5531
```

---

## 6. Before sending to the printer

1. **Ynon Azulai's email** — doesn't exist yet.
2. **Confirm `dovids@` spelling** with David Spivak.
3. **Street addresses** — none are on file. Decide whether cards carry one.
4. **Vector logo** — get an SVG or EPS made if the lion prints larger than ~3 inches.

Typeface is settled: **Libre Franklin**, Regular + Semibold, free from Google Fonts.
