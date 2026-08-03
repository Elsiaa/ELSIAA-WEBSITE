import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

const SANS =
  "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Build production-grade AI systems that set the standard. ELSIAA hires people who take ownership, think clearly, and deliver work that lasts.",
      },
      { property: "og:title", content: "Careers — ELSIAA" },
      { property: "og:description", content: "Build production-grade AI systems that set the standard." },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/careers") }],
  }),
  component: Careers,
});



const ROLES: Array<[string, string]> = [
  ["Design", "Websites, apps, and brand work for our clients."],
  ["Engineering", "The software and AI systems we build and keep running."],
  ["Client & Sales", "Talking to new clients and scoping their projects."],
  ["Legal & Ops", "Contracts, billing, and keeping the company organized."],
];





function Careers() {
  const formRef = useRef<HTMLDivElement>(null);

  return (
    <main className="min-h-screen bg-[#FBFBFA] text-[#111111]" style={{ fontFamily: SANS }}>
      <SiteNav />
      <Hero />

      {/* Open roles */}
 <section className="mx-auto max-w-5xl px-6 py-8 text-center md:py-12">
        <Reveal>
          <p className="text-[13px] font-bold text-[#1e6b3c]">Open roles</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.035em] md:text-3xl">
            Four areas. Pick the one that fits.
          </h2>
        </Reveal>
        <div className="mt-8 divide-y divide-black/[0.07] border-y border-black/[0.07]">
          {ROLES.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.04}>
              <div className="py-5">
                <h3 className="text-[16px] font-semibold tracking-[-0.015em]">{t}</h3>
                <p className="text-[14.5px] leading-relaxed text-[#111111]/60">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-5 text-[13.5px] text-[#111111]/55">
          Full-time and some part-time. Remote, hybrid, or in one of our offices.
        </p>
      </section>

      {/* Application */}
      <div ref={formRef}>
        <ApplyForm />
      </div>

      {/* legal + offices */}
 <footer className="px-6 py-8 text-center">
        <p className="mx-auto max-w-2xl text-[13px] leading-relaxed text-[#111111]/55">
          ELSIAA is an equal opportunity employer. We evaluate candidates on merit, capability, and alignment with our standards.
        </p>
        <p className="mt-3 text-[12.5px] text-[#111111]/45">
          New York · Los Angeles · London · Geneva · Antwerp · Tel Aviv
        </p>
        <p className="mt-2 text-[12.5px] text-[#111111]/40">בעזרת ה׳ נעשה ונצליח</p>
      </footer>
    </main>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[50vh] items-end overflow-hidden bg-[#0c0c0c] text-white">
      <img
        src="/assets/careers_hero_v2.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/40 to-[#0c0c0c]/60" />
      <div className="relative mx-auto w-full max-w-5xl px-6 pt-36 pb-10 text-center md:pb-14">
        <p className="text-[13px] font-bold text-[#2e9e58]">Careers</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-4xl leading-[1.03] font-semibold tracking-[-0.04em] sm:text-5xl md:text-6xl">
          Careers at ELSIAA
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-white/70 md:text-[17px]">
          We build websites, apps, and AI systems for businesses, and we look after
          them once they're live. The company works out of six offices across three
          continents, and we're hiring in four areas.
        </p>

      </div>
    </section>
  );
}

/* ---------- the application — functional, human-written only ---------- */
function ApplyForm() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [positions, setPositions] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [arrangement, setArrangement] = useState("");
  const [commitment, setCommitment] = useState("");
  const [essay, setEssay] = useState("");
  const [aiFlag, setAiFlag] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const fileInput = useRef<HTMLInputElement>(null);

  const words = essay.trim() ? essay.trim().split(/\s+/).length : 0;

  /* human-writing check — flags the obvious machine patterns */
  const looksAi = (t: string) => {
    const text = t.toLowerCase();
    const tells = ["as an ai", "i am thrilled to", "i am excited to apply", "delve into", "in today's fast-paced", "leverage my skill", "passionate about leveraging", "utilize my expertise", "dynamic and results-driven", "proven track record of success", "esteemed organization", "furthermore, ", "moreover, ", "in conclusion,"];
    let hits = 0;
    for (const p of tells) if (text.includes(p)) hits++;
    const sentences = t.split(/[.!?]+/).map((x) => x.trim().split(/\s+/).length).filter((n) => n > 2);
    if (sentences.length >= 6) {
      const mean = sentences.reduce((a, b) => a + b, 0) / sentences.length;
      const variance = sentences.reduce((a, b) => a + (b - mean) ** 2, 0) / sentences.length;
      if (variance < 9 && mean > 14) hits++; /* eerily uniform long sentences */
    }
    return hits >= 2;
  };

  const valid =
    first.trim() &&
    last.trim() &&
    number.trim().length >= 7 &&
    /.+@.+\..+/.test(email) &&
    positions.length > 0 &&
    country.trim() &&
    arrangement &&
    commitment &&
    words >= 250 &&
    !aiFlag;

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  const submit = async () => {
    if (state === "sending") return;
    if (looksAi(essay)) {
      setAiFlag(true);
      return;
    }
    if (!valid) return;
    setState("sending");
    try {
      const fd = new FormData();
      fd.append("_subject", `ELSIAA Application — ${positions.join(", ")} — ${first} ${last}`);
      fd.append("First name", first);
      fd.append("Last name", last);
      fd.append("Phone", number);
      fd.append("Email", email);
      fd.append("Areas of interest", positions.join(", "));
      fd.append("Location", country);
      fd.append("Arrangement", arrangement);
      fd.append("Commitment", commitment);
      fd.append("Statement", essay);
      fd.append("_template", "table");
      fd.append("_captcha", "false");
      if (file) fd.append("attachment", file, file.name);
      const res = await fetch("https://formsubmit.co/ajax/info@elsiaa.com", {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-2xl border border-[#1e6b3c]/30 bg-[#1e6b3c]/[0.06] p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1e6b3c] text-white">✓</span>
          <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">Application submitted</h3>
          <p className="mt-2 text-[14px] text-[#111111]/55">
            Received. Every application is reviewed by the team — you'll hear from us at{" "}
            <span className="font-medium text-[#111111]">{email}</span>.
          </p>
        </div>
      </section>
    );
  }

  return (
 <section className="mx-auto max-w-5xl px-6 pb-16 pt-8 md:pt-12">
      <div className="rounded-2xl border border-black/[0.07] bg-white p-6 md:p-12 lg:flex lg:gap-14">
        {/* identity rail */}
        <div className="lg:w-[240px] lg:flex-none">
          <span className="text-[13px] text-[#111111]/55">Application</span>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] md:text-3xl">Apply to ELSIAA</h3>
          <p className="mt-3 hidden text-[13px] leading-relaxed text-[#111111]/60 lg:block">
            Areas of interest, a short statement in your own words, and your résumé. Every application is reviewed by the team.
          </p>
        </div>

        <div className="mt-6 lg:mt-0 lg:min-w-0 lg:flex-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name" value={first} onChange={setFirst} autoComplete="given-name" />
            <Field label="Last name" value={last} onChange={setLast} autoComplete="family-name" />
            <Field label="Phone" value={number} onChange={setNumber} type="tel" autoComplete="tel" />
            <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
          </div>

          {/* areas of interest */}
          <div className="mt-6">
            <span className="text-[13px] text-[#111111]/55">Areas of interest — select all that apply</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Design", "Engineering", "Client Engagement & Sales", "Legal", "Business Operations"].map((p) => {
                const on = positions.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPositions((cur) => (on ? cur.filter((x) => x !== p) : [...cur, p]))}
                    className={`rounded-full border px-4 py-2 text-[12.5px] font-medium transition-all duration-200 ${
                      on ? "border-[#1e6b3c] bg-[#1e6b3c] text-white" : "border-black/15 bg-white text-[#111111]/70 hover:border-black/35"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* location + arrangement + commitment */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Location" value={country} onChange={setCountry} autoComplete="country-name" />
            <Choice label="Work arrangement" value={arrangement} onChange={setArrangement} options={["Remote", "Hybrid", "On-site"]} />
            <Choice label="Commitment" value={commitment} onChange={setCommitment} options={["Full-time", "Part-time"]} />
          </div>

          {/* statement */}
          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-[#111111]/55">
                In 250–400 words, why you want to join ELSIAA and the specific contribution you'd make.
              </span>
              <span className={`flex-none text-[13px] tabular-nums ${words >= 250 ? "text-[#1e6b3c]" : "text-[#111111]/55"}`}>
                {words} / 250
              </span>
            </div>
            <textarea
              value={essay}
              onChange={(e) => {
                setEssay(e.target.value);
                if (aiFlag) setAiFlag(false);
              }}
              rows={8}
              className="mt-2 w-full rounded-xl border border-black/10 bg-[#FBFBFA] px-4 py-3.5 text-[15px] leading-relaxed outline-none transition-colors focus:border-[#1e6b3c]"
              placeholder="Please write in your own words."
            />
            <p className="mt-1.5 text-[11.5px] text-[#111111]/55">
              Written by you, not by AI — machine-written answers are detected and disqualified.
            </p>
            {aiFlag && (
              <p className="mt-2 rounded-lg border border-[#E53E3E]/30 bg-[#E53E3E]/[0.05] px-4 py-3 text-[13px] text-[#E53E3E]">
                This reads machine-written. Rewrite it in your own voice — tell us something only you could say.
              </p>
            )}
          </div>

          {/* résumé */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => fileInput.current?.click()}
            className={`mt-4 flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed p-6 transition-all duration-200 ${
              drag ? "border-[#1e6b3c] bg-[#1e6b3c]/[0.05]" : file ? "border-[#1e6b3c]/50 bg-[#1e6b3c]/[0.04]" : "border-black/15 hover:border-black/30"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={file ? "#1e6b3c" : "#666"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-[13px] text-[#111111]/60">
              {file ? (
                <span className="font-medium text-[#1e6b3c]">{file.name}</span>
              ) : (
                <>
                  <span className="font-medium text-[#111111]">Drag your résumé here</span>
                  <span className="text-[#111111]/55"> — or click to upload</span>
                </>
              )}
            </p>
            <input ref={fileInput} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          <button
            onClick={submit}
            disabled={!valid || state === "sending"}
            className={`mt-6 w-full rounded-full px-6 py-4 text-[13px] font-semibold transition-all duration-300 md:w-auto md:min-w-[220px] ${
              valid ? "bg-[#111111] text-white hover:bg-[#1e6b3c]" : "cursor-not-allowed bg-black/[0.06] text-[#111111]/50"
            }`}
          >
            {state === "sending" ? "Sending…" : "Submit application →"}
          </button>
          {state === "error" && (
            <p className="mt-3 text-[13px] text-[#E53E3E]">
              Something broke on the way — try once more, or email{" "}
              <a className="underline" href="mailto:info@elsiaa.com">info@elsiaa.com</a>.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Choice({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <span className="text-[13px] text-[#111111]/55">{label}</span>
      <div className="mt-1.5 flex gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`flex-1 rounded-xl border px-2 py-3 text-[12.5px] font-medium transition-all duration-200 ${
              value === o ? "border-[#1e6b3c] bg-[#1e6b3c] text-white" : "border-black/10 bg-[#FBFBFA] text-[#111111]/65 hover:border-black/30"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[13px] text-[#111111]/55">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-black/10 bg-[#FBFBFA] px-4 py-3.5 text-[15px] outline-none transition-colors focus:border-[#1e6b3c]"
      />
    </label>
  );
}
