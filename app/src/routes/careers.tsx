import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
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
        transform: on ? "none" : "translateY(26px)",
        transition: `opacity 0.9s cubic-bezier(0.2,0.65,0.25,1) ${delay}s, transform 0.9s cubic-bezier(0.2,0.65,0.25,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const ROLES = [
  {
    key: "Designers",
    img: "/assets/work_illustration.jpg",
    line: "Taste is the job. You see the pixel that's wrong from across the room.",
  },
  {
    key: "Engineers",
    img: "/assets/laptop_premium_v1.jpg",
    line: "You ship. Clean systems, real products, no excuses between you and live.",
  },
  {
    key: "Sales",
    img: "/assets/work_ad.jpg",
    line: "You open doors and keep promises. The empire grows through you.",
  },
] as const;

type RoleKey = (typeof ROLES)[number]["key"];

function Careers() {
  const [role, setRole] = useState<RoleKey | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const ready = first.trim() && last.trim() && number.trim() && email.trim() && role;

  const complete = () => {
    if (!ready) return;
    const subject = encodeURIComponent(`Application — ${role} · ${first} ${last}`);
    const body = encodeURIComponent(
      `New application for ELSIAA\n\nRole: ${role}\nName: ${first} ${last}\nPhone: ${number}\nEmail: ${email}\nResume: ${resumeName ?? "attach to this email"}\n\n(Please attach your resume to this email before sending.)`,
    );
    window.location.href = `mailto:isya@elsiaa.com?subject=${subject}&body=${body}`;
    setToast(true);
    window.setTimeout(() => setToast(false), 5000);
  };

  const onFile = (f: File | undefined | null) => {
    if (f) setResumeName(f.name);
  };

  return (
    <main className="min-h-screen bg-[#F5F5F3] text-[#111111]">
      <SiteNav />

      {/* ---- hero: background in use + we are hiring + press one ---- */}
      <section className="relative flex min-h-[92svh] flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16">
        <div className="absolute inset-0">
          <img
            src="/assets/office_premium_v1.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c0f0d]/85 via-[#0c0f0d]/70 to-[#F5F5F3]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl text-center">
          <Reveal>
            <p
              className="text-[10px] tracking-[0.32em] text-[#2e9e58] uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Careers
            </p>
            <h1
              className="mt-4 text-5xl font-semibold tracking-[-0.04em] text-white md:text-7xl"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              We are hiring.
            </h1>
            <p
              className="mt-3 text-base text-white/60 md:text-lg"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Press one.
            </p>
          </Reveal>

          {/* ---- the three doors ---- */}
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {ROLES.map((r, i) => (
              <Reveal key={r.key} delay={0.08 * i}>
                <button
                  onClick={() => setRole(r.key)}
                  className={`group relative w-full overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 ${
                    role === r.key
                      ? "border-[#2e9e58] shadow-[0_30px_70px_-30px_rgba(46,158,88,0.65)]"
                      : "border-white/10 hover:border-white/35"
                  }`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#111]">
                    <img
                      src={r.img}
                      alt={r.key}
                      className={`h-full w-full object-cover transition-all duration-700 ${
                        role === r.key ? "scale-[1.04]" : "opacity-80 group-hover:opacity-100"
                      }`}
                    />
                  </div>
                  <div className="bg-[#0c0f0d]/90 p-5 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <h2
                        className="text-lg font-semibold tracking-[-0.02em] text-white"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {r.key}
                      </h2>
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${
                          role === r.key
                            ? "bg-[#2e9e58] text-white"
                            : "border border-white/25 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </div>
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed text-white/50"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {r.line}
                    </p>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <button
              onClick={scrollToForm}
              className={`mt-10 inline-flex items-center gap-2 rounded-full px-10 py-4 text-[12px] font-bold tracking-[0.22em] uppercase transition-all duration-300 ${
                role
                  ? "bg-[#2e9e58] text-white shadow-[0_20px_50px_-16px_rgba(46,158,88,0.7)] hover:bg-[#1e6b3c]"
                  : "border border-white/30 text-white/70 hover:border-white hover:text-white"
              }`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Apply <span aria-hidden>→</span>
            </button>
          </Reveal>
        </div>
      </section>

      {/* ---- the application: perfect, easy, fast ---- */}
      <section ref={formRef} className="px-6 pt-8 pb-28">
        <div className="mx-auto max-w-xl">
          <Reveal>
            <p
              className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              The application
            </p>
            <h2
              className="mt-3 text-3xl font-semibold tracking-[-0.035em] md:text-4xl"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              One minute. Nothing else.
            </h2>
            <p
              className="mt-2 text-[15px] text-[#111111]/50"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {role
                ? `Applying as: ${role}.`
                : "Pick a door above, then four fields and you're in."}
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-8 space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              <div className="grid grid-cols-2 gap-4">
                <input
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-xl border border-black/10 bg-white px-5 py-4 text-[15px] outline-none transition-all placeholder:text-black/30 focus:border-[#1e6b3c] focus:ring-2 focus:ring-[#1e6b3c]/15"
                />
                <input
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                  placeholder="Last name"
                  className="w-full rounded-xl border border-black/10 bg-white px-5 py-4 text-[15px] outline-none transition-all placeholder:text-black/30 focus:border-[#1e6b3c] focus:ring-2 focus:ring-[#1e6b3c]/15"
                />
              </div>
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Phone number"
                type="tel"
                className="w-full rounded-xl border border-black/10 bg-white px-5 py-4 text-[15px] outline-none transition-all placeholder:text-black/30 focus:border-[#1e6b3c] focus:ring-2 focus:ring-[#1e6b3c]/15"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full rounded-xl border border-black/10 bg-white px-5 py-4 text-[15px] outline-none transition-all placeholder:text-black/30 focus:border-[#1e6b3c] focus:ring-2 focus:ring-[#1e6b3c]/15"
              />

              {/* drag / add resume */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  onFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => fileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300 ${
                  dragOver
                    ? "border-[#2e9e58] bg-[#2e9e58]/5"
                    : resumeName
                      ? "border-[#1e6b3c] bg-white"
                      : "border-black/15 bg-white hover:border-[#1e6b3c]/50"
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                {resumeName ? (
                  <>
                    <span className="text-[15px] font-semibold text-[#1e6b3c]">✓ {resumeName}</span>
                    <span className="mt-1 text-[12px] text-black/40">Tap to replace</span>
                  </>
                ) : (
                  <>
                    <span className="text-[15px] font-semibold">Drag your resume here</span>
                    <span className="mt-1 text-[12px] text-black/40">or tap to add · PDF or Word</span>
                  </>
                )}
              </div>

              <button
                onClick={complete}
                disabled={!ready}
                className={`w-full rounded-full py-4.5 text-[12px] font-bold tracking-[0.24em] uppercase transition-all duration-300 ${
                  ready
                    ? "bg-[#1e6b3c] py-4 text-white shadow-[0_20px_50px_-16px_rgba(30,107,60,0.6)] hover:bg-[#2e9e58]"
                    : "cursor-not-allowed bg-black/8 py-4 text-black/30"
                }`}
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Complete
              </button>
              <p className="text-center text-[12px] text-black/35">
                Completing opens your email with the application addressed to us — attach your
                resume there and send.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- closing ---- */}
      <section className="bg-[#0c0f0d] px-6 py-20 text-center">
        <p
          className="text-[11px] tracking-[0.3em] text-white/40 uppercase"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Antwerp · Geneva · London · Tel Aviv · New York
        </p>
        <p
          className="mt-6 text-2xl text-white/90 italic"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Omnia possibilia.
        </p>
        <p className="mt-3 text-[15px] text-[#2e9e58]" style={{ fontFamily: "'Inter', sans-serif" }}>
          בעזרת ה׳ נעשה ונצליח
        </p>
      </section>

      {/* ---- application submitted toast ---- */}
      <div
        className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ${
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-full bg-[#1e6b3c] px-7 py-4 text-white shadow-[0_24px_60px_-16px_rgba(30,107,60,0.8)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#1e6b3c]">
            ✓
          </span>
          <span className="text-[13px] font-semibold tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
            Application submitted
          </span>
        </div>
      </div>
    </main>
  );
}
