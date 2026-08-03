import { useState } from "react";

/*
  Quote — single-page smart form. No wizard, no "Step 1 of 5".
  Three required fields + one free-text brief + optional budget.
  Posts the same payload shape /api/quote already accepts.
*/
const SANS =
  "var(--font-sans)";

const TYPES = ["Automation", "Software", "Design", "Consultation"];
const BUDGETS = ["Under $5k", "$5k–$15k", "$15k–$50k", "$50k+", "Not sure yet"];

export function QuoteWizard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const valid = name.trim() && validEmail && description.trim().length >= 10;

  const toggleType = (t: string) =>
    setProjectTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const submit = async () => {
    if (!valid || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name, company, email, phone: "",
          projectTypes: projectTypes.length ? projectTypes : ["Not specified"],
          description, features: "", audience: "", budget, timeline: "", notes: "",
        }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (!data.ok) throw new Error("bad");
      setDone(true);
    } catch {
      setError("Something went wrong — please try again, or email info@elsiaa.com.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl border border-black/[0.07] bg-white p-8 md:p-10" style={{ fontFamily: SANS }}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e6b3c] text-xl text-white">✓</span>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] md:text-3xl">
          Thank you, {name.split(" ")[0]}. We're on it.
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#111111]/60">
          Your brief is with the team. Expect a personal response with a quote
          within one business day.
        </p>
        <a href="/" className="mt-6 inline-block text-[14px] font-medium text-[#1e6b3c] hover:underline">
          ← Back to the site
        </a>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-black/[0.12] bg-white px-4 py-3.5 text-[16px] text-[#111111] outline-none transition-colors placeholder:text-[#111111]/35 focus:border-[#1e6b3c]";

  return (
    <div className="rounded-3xl border border-black/[0.07] bg-white p-6 md:p-10" style={{ fontFamily: SANS }}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input className={field} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <input className={field} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
      </div>
      <input className={`${field} mt-4`} placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />

      <p className="mt-6 text-[14px] font-medium text-[#111111]/70">What do you need? <span className="font-normal text-[#111111]/40">(optional)</span></p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggleType(t)}
            className={`min-h-[44px] rounded-full border px-5 text-[14px] font-medium transition-all ${
              projectTypes.includes(t)
                ? "border-[#1e6b3c] bg-[#1e6b3c] text-white"
                : "border-black/[0.14] text-[#111111]/70 hover:border-black/35"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="mt-6 text-[14px] font-medium text-[#111111]/70">What do you want automated or built?</p>
      <textarea
        className={`${field} mt-2.5 min-h-[120px] resize-y`}
        placeholder="e.g. Our front desk misses 40% of calls — we want an AI receptionist that books patients into the right doctor's calendar."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <p className="mt-6 text-[14px] font-medium text-[#111111]/70">Budget <span className="font-normal text-[#111111]/40">(optional)</span></p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {BUDGETS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBudget(budget === b ? "" : b)}
            className={`min-h-[44px] rounded-full border px-4 text-[13.5px] font-medium transition-all ${
              budget === b ? "border-[#1e6b3c] bg-[#1e6b3c]/[0.08] text-[#1e6b3c]" : "border-black/[0.14] text-[#111111]/60 hover:border-black/35"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-[14px] text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!valid || sending}
        className={`mt-7 flex min-h-[52px] w-full items-center justify-center rounded-full text-[15.5px] font-semibold transition-all ${
          valid ? "bg-[#1e6b3c] text-white hover:opacity-90" : "bg-black/[0.06] text-[#111111]/35"
        }`}
      >
        {sending ? "Sending…" : "Get my quote →"}
      </button>
      <p className="mt-3 text-center text-[13px] text-[#111111]/45">
        Personal response within one business day. No spam, ever.
      </p>
    </div>
  );
}
