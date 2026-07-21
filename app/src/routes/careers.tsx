import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "We are hiring. Designers, engineers, and sales — pick your door and apply in under a minute.",
      },
      { property: "og:title", content: "Careers — ELSIAA" },
      { property: "og:description", content: "We are hiring. Press one." },
      { property: "og:image", content: "/assets/og_cover.png" },
    ],
  }),
  component: Careers,
});

/* ---------- reveal on scroll ---------- */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(22px)",
        transition: `opacity .7s ease ${delay}s, transform .7s cubic-bezier(.2,.8,.2,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const ROLES = [
  {
    id: "Designers",
    img: "/assets/role_designer.jpg",
    line: "Interfaces, identities, films — the empire's face.",
  },
  {
    id: "Engineers",
    img: "/assets/role_engineer.jpg",
    line: "Software, automation, AI — the machinery beneath.",
  },
  {
    id: "Sales",
    img: "/assets/role_sales.jpg",
    line: "Rooms, relationships, revenue — the front line.",
  },
] as const;
type RoleId = (typeof ROLES)[number]["id"];

function Careers() {
  const [role, setRole] = useState<RoleId | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const pick = (r: RoleId) => {
    setRole(r);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  return (
    <main className="min-h-screen bg-[#FBFBFA] text-[#111111]">
      <SiteNav />
      <Hero />
      {/* three doors */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Press one
          </p>
          <h2
            className="mt-2 text-2xl font-semibold tracking-[-0.035em] md:text-4xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Three doors in.
          </h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {ROLES.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.08}>
              <button
                onClick={() => pick(r.id)}
                className={`group block w-full overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                  role === r.id
                    ? "border-[#1e6b3c] shadow-[0_16px_40px_rgba(30,107,60,0.18)]"
                    : "border-black/[0.07] hover:border-black/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
                }`}
              >
                <div className="h-[150px] w-full overflow-hidden">
                  <img
                    src={r.img}
                    alt={r.id}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                </div>
                <div className="flex items-center justify-between bg-white p-4">
                  <div>
                    <h3
                      className="text-[15px] font-semibold"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {r.id}
                    </h3>
                    <p className="mt-1 text-[12px] leading-snug text-[#111111]/50">
                      {r.line}
                    </p>
                  </div>
                  <span
                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-full border transition-all duration-300 ${
                      role === r.id
                        ? "border-[#1e6b3c] bg-[#1e6b3c] text-white"
                        : "border-black/15 text-[#111111]/60 group-hover:border-black/40"
                    }`}
                  >
                    →
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>
      {/* apply */}
      <div ref={formRef}>
        <ApplyForm role={role} />
      </div>
      <footer className="border-t border-black/[0.06] py-10 text-center">
        <p
          className="text-[11px] tracking-[0.2em] text-[#111111]/35 uppercase"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          בעזרת ה׳ נעשה ונצליח
        </p>
      </footer>
    </main>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[62vh] items-end overflow-hidden bg-[#0c0c0c] text-white">
      <img
        src="/assets/office_premium_v1.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/30 to-[#0c0c0c]/60" />
      <div className="relative mx-auto w-full max-w-5xl px-6 pt-40 pb-14 md:pb-20">
        <p
          className="text-[10px] tracking-[0.32em] text-[#2e9e58] uppercase"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Careers
        </p>
        <h1
          className="mt-3 max-w-2xl text-[11vw] leading-[1.0] font-semibold tracking-[-0.04em] sm:text-5xl md:text-6xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          We are hiring.
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
          Designers, engineers, sales. Pick your door — the application takes
          under a minute.
        </p>
      </div>
    </section>
  );
}

/* ---------- the application — dead simple, perfect ---------- */
function ApplyForm({ role }: { role: RoleId | null }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );
  const fileInput = useRef<HTMLInputElement>(null);

  const valid =
    first.trim() &&
    last.trim() &&
    number.trim().length >= 7 &&
    /.+@.+\..+/.test(email);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  const submit = async () => {
    if (!valid || state === "sending") return;
    setState("sending");
    try {
      const fd = new FormData();
      fd.append("_subject", `ELSIAA Application — ${role ?? "General"} — ${first} ${last}`);
      fd.append("Role", role ?? "General");
      fd.append("First name", first);
      fd.append("Last name", last);
      fd.append("Phone", number);
      fd.append("Email", email);
      fd.append("_template", "table");
      fd.append("_captcha", "false");
      if (file) fd.append("attachment", file, file.name);
      const res = await fetch("https://formsubmit.co/ajax/isya@elsiaa.com", {
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
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1e6b3c] text-white">
            ✓
          </span>
          <h3
            className="mt-5 text-xl font-semibold tracking-[-0.02em]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Application submitted
          </h3>
          <p className="mt-2 text-[14px] text-[#111111]/55">
            We have it{role ? ` — ${role}` : ""}. You'll hear from us at{" "}
            <span className="font-medium text-[#111111]">{email}</span>.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 pb-24">
      <div className="rounded-2xl border border-black/[0.07] bg-white p-6 md:p-10">
        <div className="flex items-baseline justify-between gap-4">
          <h3
            className="text-lg font-semibold tracking-[-0.02em] md:text-2xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Apply{role ? ` — ${role}` : ""}
          </h3>
          <span
            className="text-[10px] tracking-[0.22em] text-[#111111]/40 uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Under a minute
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" value={first} onChange={setFirst} autoComplete="given-name" />
          <Field label="Last name" value={last} onChange={setLast} autoComplete="family-name" />
          <Field label="Number" value={number} onChange={setNumber} type="tel" autoComplete="tel" />
          <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
        </div>

        {/* resume — drag or add */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => fileInput.current?.click()}
          className={`mt-4 flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed p-6 transition-all duration-200 ${
            drag
              ? "border-[#1e6b3c] bg-[#1e6b3c]/[0.05]"
              : file
                ? "border-[#1e6b3c]/50 bg-[#1e6b3c]/[0.04]"
                : "border-black/15 hover:border-black/30"
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
                <span className="font-medium text-[#111111]">Drag your resume here</span>
                <span className="text-[#111111]/45"> — or tap to add</span>
              </>
            )}
          </p>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <button
          onClick={submit}
          disabled={!valid || state === "sending"}
          className={`mt-6 w-full rounded-full px-6 py-4 text-[12px] font-semibold tracking-[0.24em] uppercase transition-all duration-300 md:w-auto md:min-w-[220px] ${
            valid
              ? "bg-[#111111] text-white hover:bg-[#1e6b3c]"
              : "cursor-not-allowed bg-black/[0.06] text-[#111111]/35"
          }`}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {state === "sending" ? "Sending…" : "Apply →"}
        </button>
        {state === "error" && (
          <p className="mt-3 text-[13px] text-[#E53E3E]">
            Something broke on the way — try once more, or email{" "}
            <a className="underline" href="mailto:isya@elsiaa.com">
              isya@elsiaa.com
            </a>
            .
          </p>
        )}
      </div>
    </section>
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
      <span
        className="text-[10px] tracking-[0.22em] text-[#111111]/45 uppercase"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {label}
      </span>
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
