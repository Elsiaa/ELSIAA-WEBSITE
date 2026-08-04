import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

const SANS =
  "var(--font-sans)";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

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

  /* Validation runs on submit and reports per field. The button stays enabled:
     a permanently dead button with no explanation is unusable with a screen
     reader, and gives a sighted user nothing to act on either. */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!first.trim()) e.first = "Enter your first name.";
    if (!last.trim()) e.last = "Enter your last name.";
    if (number.trim().length < 7) e.phone = "Enter a phone number we can reach you on.";
    if (!/.+@.+\..+/.test(email)) e.email = "Enter a valid email address.";
    if (positions.length === 0) e.positions = "Choose at least one area.";
    if (!country.trim()) e.country = "Where are you based?";
    if (!arrangement) e.arrangement = "Pick a work arrangement.";
    if (!commitment) e.commitment = "Pick a commitment.";
    if (words < 250) e.essay = `Your statement is ${words} words — 250 is the minimum.`;
    return e;
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  const submit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (state === "sending") return;

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      /* move the user to the first thing that needs fixing */
      const firstKey = Object.keys(e)[0];
      const el = formRef.current?.querySelector<HTMLElement>(
        `#apply-${firstKey}, [data-field="${firstKey}"]`,
      );
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    if (looksAi(essay)) setAiFlag(true); /* a warning now, not a block */
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

  useEffect(() => {
    if (state === "done") doneRef.current?.focus();
  }, [state]);

  if (state === "done") {
    return (
      <section className="mx-auto max-w-5xl px-6 pb-8 md:pb-24">
        <div
          ref={doneRef}
          role="status"
          tabIndex={-1}
          className="rounded-2xl border border-[#1e6b3c]/30 bg-[#1e6b3c]/[0.06] p-8 text-center focus:outline-none md:p-10"
        >
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
 <section className="mx-auto max-w-5xl px-6 pb-10 md:pb-16 pt-8 md:pt-12">
      <div className="rounded-2xl border border-black/[0.07] bg-white p-6 md:p-12 lg:flex lg:gap-14">
        {/* identity rail */}
        <div className="lg:w-[240px] lg:flex-none">
          <span className="text-[13px] text-[#111111]/55">Application</span>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] md:text-3xl">Apply to ELSIAA</h3>
          <p className="mt-3 hidden text-[13px] leading-relaxed text-[#111111]/60 lg:block">
            Areas of interest, a short statement in your own words, and your résumé. Every application is reviewed by the team.
          </p>
        </div>

        <form ref={formRef} onSubmit={submit} noValidate className="mt-6 lg:mt-0 lg:min-w-0 lg:flex-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="apply-first" label="First name" value={first} onChange={setFirst} autoComplete="given-name" error={errors.first} />
            <Field id="apply-last" label="Last name" value={last} onChange={setLast} autoComplete="family-name" error={errors.last} />
            <Field id="apply-phone" label="Phone" value={number} onChange={setNumber} type="tel" inputMode="tel" autoComplete="tel" error={errors.phone} />
            <Field id="apply-email" label="Email" value={email} onChange={setEmail} type="email" inputMode="email" autoComplete="email" error={errors.email} />
          </div>

          {/* areas of interest */}
          <div className="mt-6">
            <span id="apply-positions-label" className="text-[13px] text-[#111111]/55">
              Areas of interest — select all that apply
            </span>
            <div role="group" aria-labelledby="apply-positions-label" className="mt-2 flex flex-wrap gap-2">
              {["Design", "Engineering", "Client Engagement & Sales", "Legal", "Business Operations"].map((p) => {
                const on = positions.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={on}
                    data-field="positions"
                    onClick={() => setPositions((cur) => (on ? cur.filter((x) => x !== p) : [...cur, p]))}
                    className={`min-h-[44px] rounded-full border px-4 py-2 text-[12.5px] font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c] ${
                      on ? "border-[#1e6b3c] bg-[#1e6b3c] text-white" : "border-black/15 bg-white text-[#111111]/70 hover:border-black/35"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            {errors.positions && <p className="mt-1.5 text-[12.5px] text-[#E53E3E]">{errors.positions}</p>}
          </div>

          {/* location + arrangement + commitment */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field id="apply-country" label="Location" value={country} onChange={setCountry} autoComplete="country-name" error={errors.country} />
            <Choice label="Work arrangement" value={arrangement} onChange={setArrangement} options={["Remote", "Hybrid", "On-site"]} error={errors.arrangement} />
            <Choice label="Commitment" value={commitment} onChange={setCommitment} options={["Full-time", "Part-time"]} error={errors.commitment} />
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
              className="mt-2 w-full rounded-xl border border-black/10 bg-[#FBFBFA] px-4 py-3.5 text-[16px] leading-relaxed transition-colors focus:border-[#1e6b3c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c] md:text-[15px]"
              placeholder="Please write in your own words."
            />
            <p className="mt-1.5 text-[11.5px] text-[#111111]/55">
              Please write this yourself — we read every statement personally.
            </p>
            {aiFlag && (
              <p className="mt-2 rounded-lg border border-[#E53E3E]/30 bg-[#E53E3E]/[0.05] px-4 py-3 text-[13px] text-[#E53E3E]">
                This reads machine-written to us. It won't stop you submitting, but a statement in your own voice lands far better.
              </p>
            )}
          </div>

          {/* résumé — the input stays in the DOM and in the tab order. It was
              previously className="hidden", which measured 0px, so a CV could
              not be attached without a mouse. */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={`mt-4 rounded-xl border border-dashed p-5 transition-all duration-200 ${
              drag ? "border-[#1e6b3c] bg-[#1e6b3c]/[0.05]" : file ? "border-[#1e6b3c]/50 bg-[#1e6b3c]/[0.04]" : "border-black/15"
            }`}
          >
            <label
              htmlFor="apply-resume"
              className="flex min-h-[44px] cursor-pointer flex-wrap items-center justify-center gap-3 text-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={file ? "#1e6b3c" : "#666"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-[13px] text-[#111111]/60">
                {file ? (
                  <span className="font-medium text-[#1e6b3c]">{file.name}</span>
                ) : (
                  <>
                    <span className="font-medium text-[#111111]">Attach your résumé</span>
                    <span className="text-[#111111]/55"> — or drag it here</span>
                  </>
                )}
              </span>
            </label>
            <input
              id="apply-resume"
              ref={fileInput}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mx-auto mt-3 block w-full max-w-full text-[13px] text-[#111111]/70 file:mr-3 file:min-h-[44px] file:cursor-pointer file:rounded-full file:border file:border-black/15 file:bg-white file:px-4 file:text-[13px] file:font-semibold file:text-[#111111] hover:file:border-[#1e6b3c] hover:file:text-[#1e6b3c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c]"
            />
            {/* announced to assistive tech when a file is chosen */}
            <p role="status" className="sr-only">
              {file ? `${file.name} attached` : "No file attached"}
            </p>
          </div>

          <button
            type="submit"
            disabled={state === "sending"}
            className="mt-6 min-h-[52px] w-full rounded-full bg-[#111111] px-6 text-[13px] font-semibold text-white transition-all duration-300 hover:bg-[#1e6b3c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c] disabled:opacity-60 md:w-auto md:min-w-[220px]"
          >
            {state === "sending" ? "Sending…" : "Submit application →"}
          </button>
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="mt-3 text-[13px] text-[#E53E3E]">
              {Object.keys(errors).length} field
              {Object.keys(errors).length === 1 ? "" : "s"} need attention — see the notes above.
            </p>
          )}
          {state === "error" && (
            <p role="alert" className="mt-3 text-[13px] text-[#E53E3E]">
              Something broke on the way — try once more, or email{" "}
              <a className="underline" href="mailto:info@elsiaa.com">info@elsiaa.com</a>.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

function Choice({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  error?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} aria-invalid={error ? true : undefined}>
      <span className="text-[13px] text-[#111111]/55">{label}</span>
      <div className="mt-1.5 flex gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            onClick={() => onChange(o)}
            className={`min-h-[44px] flex-1 rounded-xl border px-2 py-3 text-[12.5px] font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c] ${
              value === o ? "border-[#1e6b3c] bg-[#1e6b3c] text-white" : "border-black/10 bg-[#FBFBFA] text-[#111111]/65 hover:border-black/30"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-[12.5px] text-[#E53E3E]">{error}</p>}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  error,
  inputRef,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  error?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  inputMode?: "text" | "tel" | "email";
}) {
  return (
    <div className="block">
      <label htmlFor={id} className="text-[13px] text-[#111111]/55">
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        type={type}
        inputMode={inputMode}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 w-full rounded-xl border bg-[#FBFBFA] px-4 py-3.5 text-[16px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c] md:text-[15px] ${
          error ? "border-[#E53E3E]" : "border-black/10 focus:border-[#1e6b3c]"
        }`}
      />
      {error && (
        <p id={`${id}-err`} className="mt-1 text-[12.5px] text-[#E53E3E]">
          {error}
        </p>
      )}
    </div>
  );
}
