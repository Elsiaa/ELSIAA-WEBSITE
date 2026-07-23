import { useMemo, useState } from "react";

/*
  QuoteWizard — the project-quote questionnaire.
  A potential client walks through a few focused questions; on submit the
  answers are distilled into an executive brief, stored for the ELSIAA team,
  and the client sees a confirmation with their own copy of the brief.
*/

const mono = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;

const TYPES = ["Design", "Automation", "Software", "Consultation"];
const BUDGETS = [
  "Under $1,000",
  "$1,000 – $5,000",
  "$5,000 – $15,000",
  "$15,000 – $50,000",
  "$50,000+",
  "Not sure yet",
];
const TIMELINES = [
  "ASAP",
  "Within a month",
  "1–3 months",
  "3–6 months",
  "Flexible",
];

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] text-[#111111] placeholder:text-[#111111]/50 outline-none transition-colors focus:border-[#1e6b3c]";
const chipCls = (on: boolean) =>
  `rounded-full border px-5 py-2.5 text-[13px] font-medium transition-all ${
    on
      ? "border-[#1e6b3c] bg-[#1e6b3c] text-white"
      : "border-black/12 bg-white text-[#111111]/70 hover:border-[#1e6b3c]/50"
  }`;

export function QuoteWizard() {
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ summary: string } | null>(null);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [audience, setAudience] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");

  const steps = useMemo(
    () => [
      {
        title: "Who are we talking to?",
        valid: name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email),
      },
      { title: "What do you need built?", valid: projectTypes.length > 0 },
      { title: "Tell us about the project.", valid: description.trim().length >= 20 },
      { title: "The practical side.", valid: true },
      { title: "Review & send.", valid: true },
    ],
    [name, email, projectTypes, description],
  );

  const toggleType = (t: string) =>
    setProjectTypes((p) =>
      p.includes(t) ? p.filter((x) => x !== t) : [...p, t],
    );

  const submit = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name, company, email, phone, projectTypes,
          description, features, audience, budget, timeline, notes,
        }),
      });
      const data = (await res.json()) as { ok: boolean; summary?: string };
      if (!data.ok) throw new Error("bad");
      setDone({ summary: data.summary ?? "" });
    } catch {
      setError("Something went wrong sending your request — please try again.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-black/[0.07] bg-white p-8 md:p-10">
        <p className="text-[13px] text-[#1e6b3c] " style={mono}>
          Request received
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] md:text-3xl" style={inter}>
          Thank you, {name.split(" ")[0]}. We're on it.
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#111111]/55" style={inter}>
          Your project brief is with the ELSIAA team. Expect a personal
          response with a quote within one business day. Here's the brief we
          captured:
        </p>
        <blockquote className="mt-6 rounded-xl border-l-2 border-[#1e6b3c] bg-[#FBFBFA] p-5 text-[14px] leading-relaxed text-[#111111]/75" style={inter}>
          {done.summary}
        </blockquote>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-8 md:p-10">
      {/* progress */}
      <div className="flex items-center gap-2">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-[#1e6b3c]" : "bg-black/[0.08]"
            }`}
          />
        ))}
      </div>
      <p className="mt-6 text-[13px] text-[#1e6b3c] " style={mono}>
        Step {step + 1} of {steps.length}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl" style={inter}>
        {steps[step].title}
      </h2>

      <div className="mt-7 space-y-4">
        {step === 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <input className={inputCls} style={inter} placeholder="Your name *" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={inputCls} style={inter} placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input className={inputCls} style={inter} type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={inputCls} style={inter} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-[14px] text-[#111111]/60" style={inter}>
              Pick every division your project touches.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {TYPES.map((t) => (
                <button key={t} type="button" onClick={() => toggleType(t)} className={chipCls(projectTypes.includes(t))} style={inter}>
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <textarea
              className={`${inputCls} min-h-[130px] resize-y`}
              style={inter}
              placeholder="Describe what you want built — the more detail, the sharper the quote. *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <textarea
              className={`${inputCls} min-h-[90px] resize-y`}
              style={inter}
              placeholder="Must-have features or deliverables (optional)"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
            />
            <input
              className={inputCls}
              style={inter}
              placeholder="Who is it for — your audience or users? (optional)"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-[13px] tracking-[0.1em] text-[#111111]/55 " style={mono}>Budget range</p>
            <div className="flex flex-wrap gap-2.5">
              {BUDGETS.map((b) => (
                <button key={b} type="button" onClick={() => setBudget(budget === b ? "" : b)} className={chipCls(budget === b)} style={inter}>{b}</button>
              ))}
            </div>
            <p className="mt-4 text-[13px] tracking-[0.1em] text-[#111111]/55 " style={mono}>Timeline</p>
            <div className="flex flex-wrap gap-2.5">
              {TIMELINES.map((t) => (
                <button key={t} type="button" onClick={() => setTimeline(timeline === t ? "" : t)} className={chipCls(timeline === t)} style={inter}>{t}</button>
              ))}
            </div>
            <textarea
              className={`${inputCls} mt-4 min-h-[80px] resize-y`}
              style={inter}
              placeholder="Anything else we should know? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </>
        )}

        {step === 4 && (
          <div className="space-y-3 text-[14px] leading-relaxed text-[#111111]/70" style={inter}>
            <p><span className="font-semibold text-[#111111]">Contact:</span> {name}{company ? ` · ${company}` : ""} · {email}{phone ? ` · ${phone}` : ""}</p>
            <p><span className="font-semibold text-[#111111]">Divisions:</span> {projectTypes.join(", ")}</p>
            <p><span className="font-semibold text-[#111111]">Project:</span> {description}</p>
            {features && <p><span className="font-semibold text-[#111111]">Key needs:</span> {features}</p>}
            {audience && <p><span className="font-semibold text-[#111111]">Audience:</span> {audience}</p>}
            {(budget || timeline) && (
              <p><span className="font-semibold text-[#111111]">Logistics:</span> {[budget, timeline].filter(Boolean).join(" · ")}</p>
            )}
            {notes && <p><span className="font-semibold text-[#111111]">Notes:</span> {notes}</p>}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-[13px] text-red-600" style={inter}>{error}</p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={`text-[13px]  transition-opacity ${step === 0 ? "pointer-events-none opacity-0" : "text-[#111111]/60 hover:text-[#111111]"}`}
          style={mono}
        >
          ← Back
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            disabled={!steps[step].valid}
            onClick={() => setStep((s) => s + 1)}
            className="rounded-full bg-[#1e6b3c] px-8 py-3.5 text-[13px] font-bold text-white  transition-all enabled:hover:bg-[#175530] disabled:cursor-not-allowed disabled:opacity-30"
            style={mono}
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            disabled={sending}
            onClick={submit}
            className="rounded-full bg-[#1e6b3c] px-8 py-3.5 text-[13px] font-bold text-white  transition-all enabled:hover:bg-[#175530] disabled:opacity-50"
            style={mono}
          >
            {sending ? "Sending…" : "Send my request"}
          </button>
        )}
      </div>
    </div>
  );
}
