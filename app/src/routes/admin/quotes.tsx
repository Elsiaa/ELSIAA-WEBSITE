import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/*
  ELSIAA backend — quote requests dashboard.
  Access-key protected (the key never ships to the browser; it's checked
  server-side on every request). Lists every submission with its executive
  brief, expandable full answers, and a status workflow.
*/

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "'Inter', sans-serif" } as const;

export const Route = createFileRoute("/admin/quotes")({
  head: () => ({
    meta: [
      { title: "Quote Requests — ELSIAA Backend" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminQuotes,
});

type Quote = {
  id: string;
  created_at: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  project_types: string;
  description: string;
  features: string;
  audience: string;
  budget: string;
  timeline: string;
  notes: string;
  summary: string;
  status: string;
};

const STATUSES = ["new", "reviewed", "quoted", "won", "closed"];
const statusColor: Record<string, string> = {
  new: "bg-[#1e6b3c] text-white",
  reviewed: "bg-amber-500 text-white",
  quoted: "bg-blue-600 text-white",
  won: "bg-emerald-600 text-white",
  closed: "bg-black/30 text-white",
};

function AdminQuotes() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (k: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quotes", { headers: { "x-admin-key": k } });
      if (res.status === 401) {
        setError("Wrong access key.");
        setAuthed(false);
        return;
      }
      const data = (await res.json()) as { ok: boolean; quotes: Quote[] };
      if (!data.ok) throw new Error("bad");
      setQuotes(data.quotes);
      setAuthed(true);
      try { sessionStorage.setItem("els_admin_key", k); } catch { /* private mode */ }
    } catch {
      setError("Could not load quote requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("els_admin_key");
      if (saved) {
        setKey(saved);
        void load(saved);
      }
    } catch { /* private mode */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = async (id: string, status: string) => {
    setQuotes((qs) => qs.map((q) => (q.id === id ? { ...q, status } : q)));
    await fetch("/api/quotes", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ id, status }),
    });
  };

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0c0c0c] px-6">
        <div className="w-full max-w-sm">
          <p className="text-[10px] tracking-[0.32em] text-[#2e9e58] uppercase" style={mono}>
            ELSIAA Backend
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white" style={inter}>
            Quote requests
          </h1>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(key)}
            placeholder="Access key"
            className="mt-6 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-white placeholder:text-white/30 outline-none focus:border-[#2e9e58]"
            style={inter}
          />
          {error && <p className="mt-3 text-[13px] text-red-400" style={inter}>{error}</p>}
          <button
            onClick={() => load(key)}
            disabled={loading || !key}
            className="mt-4 w-full rounded-full bg-[#1e6b3c] py-3.5 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all enabled:hover:bg-[#2e9e58] disabled:opacity-40"
            style={mono}
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFBFA] px-6 py-12 text-[#111111]">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
              ELSIAA Backend
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]" style={inter}>
              Quote requests
            </h1>
          </div>
          <p className="text-[13px] text-[#111111]/50" style={inter}>
            {quotes.length} request{quotes.length === 1 ? "" : "s"}
          </p>
        </div>

        {quotes.length === 0 && (
          <p className="mt-16 text-center text-[15px] text-[#111111]/45" style={inter}>
            No quote requests yet. Share the form:{" "}
            <span className="font-medium text-[#1e6b3c]">elsiaa.higgsfield.app/quote</span>
          </p>
        )}

        <div className="mt-8 space-y-4">
          {quotes.map((q) => (
            <div key={q.id} className="rounded-2xl border border-black/[0.07] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-[17px] font-semibold" style={inter}>
                    {q.name}{q.company ? ` · ${q.company}` : ""}
                  </h2>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] uppercase ${statusColor[q.status] ?? "bg-black/20 text-white"}`} style={mono}>
                    {q.status}
                  </span>
                </div>
                <p className="text-[12px] text-[#111111]/45" style={mono}>
                  {new Date(q.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
              <p className="mt-1 text-[13px] text-[#1e6b3c]" style={mono}>
                {q.project_types} · {q.email}{q.phone ? ` · ${q.phone}` : ""}
              </p>
              <blockquote className="mt-4 rounded-xl border-l-2 border-[#1e6b3c] bg-[#FBFBFA] p-4 text-[14px] leading-relaxed text-[#111111]/75" style={inter}>
                {q.summary}
              </blockquote>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setOpen(open === q.id ? null : q.id)}
                  className="text-[11px] tracking-[0.2em] text-[#111111]/50 uppercase hover:text-[#111111]"
                  style={mono}
                >
                  {open === q.id ? "Hide full answers ↑" : "Full answers ↓"}
                </button>
                <div className="flex gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(q.id, s)}
                      className={`rounded-full border px-3 py-1 text-[10px] tracking-[0.12em] uppercase transition-all ${
                        q.status === s
                          ? "border-[#1e6b3c] bg-[#1e6b3c] text-white"
                          : "border-black/10 text-[#111111]/50 hover:border-[#1e6b3c]/50"
                      }`}
                      style={mono}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {open === q.id && (
                <div className="mt-4 space-y-2 border-t border-black/[0.06] pt-4 text-[14px] leading-relaxed text-[#111111]/70" style={inter}>
                  <p><span className="font-semibold text-[#111111]">Project:</span> {q.description}</p>
                  {q.features && <p><span className="font-semibold text-[#111111]">Key needs:</span> {q.features}</p>}
                  {q.audience && <p><span className="font-semibold text-[#111111]">Audience:</span> {q.audience}</p>}
                  {q.budget && <p><span className="font-semibold text-[#111111]">Budget:</span> {q.budget}</p>}
                  {q.timeline && <p><span className="font-semibold text-[#111111]">Timeline:</span> {q.timeline}</p>}
                  {q.notes && <p><span className="font-semibold text-[#111111]">Notes:</span> {q.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
