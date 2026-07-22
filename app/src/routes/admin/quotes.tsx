import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/*
  ELSIAA backend — one dashboard, three streams:
  Quotes (project-quote briefs), Meetings (Contact Us slot requests),
  Orders (merch store). Access-key protected; the key is checked
  server-side on every request and never ships in the bundle.
*/

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "'Inter', sans-serif" } as const;

export const Route = createFileRoute("/admin/quotes")({
  head: () => ({
    meta: [
      { title: "ELSIAA Backend" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDash,
});

type Quote = {
  id: string; created_at: string; name: string; company: string; email: string;
  phone: string; project_types: string; description: string; features: string;
  audience: string; budget: string; timeline: string; notes: string;
  summary: string; status: string;
};
type Meeting = {
  id: string; created_at: string; name: string; email: string; company: string;
  slot_date: string; slot_time: string; topic: string; status: string;
};
type Order = {
  id: string; created_at: string; name: string; email: string; address: string;
  items: string; total: number; status: string;
};

const Q_STATUSES = ["new", "reviewed", "quoted", "won", "closed"];
const M_STATUSES = ["requested", "confirmed", "done", "declined"];
const O_STATUSES = ["new", "invoiced", "paid", "shipped", "closed"];

const badge: Record<string, string> = {
  new: "bg-[#1e6b3c] text-white",
  requested: "bg-[#1e6b3c] text-white",
  reviewed: "bg-amber-500 text-white",
  confirmed: "bg-blue-600 text-white",
  invoiced: "bg-amber-500 text-white",
  quoted: "bg-blue-600 text-white",
  paid: "bg-emerald-600 text-white",
  won: "bg-emerald-600 text-white",
  done: "bg-emerald-600 text-white",
  shipped: "bg-blue-600 text-white",
  declined: "bg-black/30 text-white",
  closed: "bg-black/30 text-white",
};

function StatusRow({
  current, options, onPick,
}: { current: string; options: string[]; onPick: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((s) => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className={`rounded-full border px-3 py-1 text-[10px] tracking-[0.12em] uppercase transition-all ${
            current === s
              ? "border-[#1e6b3c] bg-[#1e6b3c] text-white"
              : "border-black/10 text-[#111111]/50 hover:border-[#1e6b3c]/50"
          }`}
          style={mono}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function AdminDash() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"quotes" | "meetings" | "orders">("quotes");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (k: string) => {
    setLoading(true);
    setError("");
    try {
      const h = { "x-admin-key": k };
      const [rq, rm, ro] = await Promise.all([
        fetch("/api/quotes", { headers: h }),
        fetch("/api/meetings", { headers: h }),
        fetch("/api/orders", { headers: h }),
      ]);
      if (rq.status === 401) {
        setError("Wrong access key.");
        setAuthed(false);
        return;
      }
      const dq = (await rq.json()) as { ok: boolean; quotes: Quote[] };
      const dm = (await rm.json()) as { ok: boolean; meetings: Meeting[] };
      const dor = (await ro.json()) as { ok: boolean; orders: Order[] };
      setQuotes(dq.quotes ?? []);
      setMeetings(dm.meetings ?? []);
      setOrders(dor.orders ?? []);
      setAuthed(true);
      try { sessionStorage.setItem("els_admin_key", k); } catch { /* private mode */ }
    } catch {
      setError("Could not load the backend data.");
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

  const post = (path: string, id: string, status: string) =>
    fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ id, status }),
    });

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0c0c0c] px-6">
        <div className="w-full max-w-sm">
          <p className="text-[10px] tracking-[0.32em] text-[#2e9e58] uppercase" style={mono}>
            ELSIAA Backend
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white" style={inter}>
            Quotes · Meetings · Orders
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

  const tabs = [
    { id: "quotes" as const, label: `Quotes (${quotes.length})` },
    { id: "meetings" as const, label: `Meetings (${meetings.length})` },
    { id: "orders" as const, label: `Orders (${orders.length})` },
  ];

  return (
    <main className="min-h-screen bg-[#FBFBFA] px-6 py-12 text-[#111111]">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
          ELSIAA Backend
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-5 py-2.5 text-[12px] font-semibold transition-all ${
                tab === t.id
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-black/10 bg-white text-[#111111]/60 hover:border-black/30"
              }`}
              style={inter}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => load(key)}
            className="ml-auto text-[11px] tracking-[0.2em] text-[#111111]/45 uppercase hover:text-[#111111]"
            style={mono}
          >
            ↻ Refresh
          </button>
        </div>

        {/* QUOTES */}
        {tab === "quotes" && (
          <div className="mt-8 space-y-4">
            {quotes.length === 0 && (
              <p className="mt-12 text-center text-[15px] text-[#111111]/45" style={inter}>
                No quote requests yet. Share: elsiaa.higgsfield.app/quote
              </p>
            )}
            {quotes.map((q) => (
              <div key={q.id} className="rounded-2xl border border-black/[0.07] bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[17px] font-semibold" style={inter}>
                      {q.name}{q.company ? ` · ${q.company}` : ""}
                    </h2>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] uppercase ${badge[q.status] ?? "bg-black/20 text-white"}`} style={mono}>
                      {q.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#111111]/45" style={mono}>{fmtWhen(q.created_at)}</p>
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
                  <StatusRow
                    current={q.status}
                    options={Q_STATUSES}
                    onPick={(s) => {
                      setQuotes((qs) => qs.map((x) => (x.id === q.id ? { ...x, status: s } : x)));
                      void post("/api/quotes", q.id, s);
                    }}
                  />
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
        )}

        {/* MEETINGS */}
        {tab === "meetings" && (
          <div className="mt-8 space-y-4">
            {meetings.length === 0 && (
              <p className="mt-12 text-center text-[15px] text-[#111111]/45" style={inter}>
                No meeting requests yet. They arrive from the Contact Us calendar.
              </p>
            )}
            {meetings.map((m) => (
              <div key={m.id} className="rounded-2xl border border-black/[0.07] bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[17px] font-semibold" style={inter}>
                      {m.name}{m.company ? ` · ${m.company}` : ""}
                    </h2>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] uppercase ${badge[m.status] ?? "bg-black/20 text-white"}`} style={mono}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#111111]/45" style={mono}>{fmtWhen(m.created_at)}</p>
                </div>
                <p className="mt-1 text-[13px] text-[#1e6b3c]" style={mono}>
                  Wants: {m.slot_date} at {m.slot_time} · {m.email}
                </p>
                {m.topic && (
                  <p className="mt-3 text-[14px] leading-relaxed text-[#111111]/70" style={inter}>
                    {m.topic}
                  </p>
                )}
                <div className="mt-4">
                  <StatusRow
                    current={m.status}
                    options={M_STATUSES}
                    onPick={(s) => {
                      setMeetings((ms) => ms.map((x) => (x.id === m.id ? { ...x, status: s } : x)));
                      void post("/api/meetings", m.id, s);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div className="mt-8 space-y-4">
            {orders.length === 0 && (
              <p className="mt-12 text-center text-[15px] text-[#111111]/45" style={inter}>
                No merch orders yet. Share the store: elsiaa.higgsfield.app/store
              </p>
            )}
            {orders.map((o) => {
              let items: { name: string; size: string; qty: number; price: number }[] = [];
              try { items = JSON.parse(o.items); } catch { /* legacy */ }
              return (
                <div key={o.id} className="rounded-2xl border border-black/[0.07] bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-[17px] font-semibold" style={inter}>{o.name}</h2>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] uppercase ${badge[o.status] ?? "bg-black/20 text-white"}`} style={mono}>
                        {o.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#111111]/45" style={mono}>{fmtWhen(o.created_at)}</p>
                  </div>
                  <p className="mt-1 text-[13px] text-[#1e6b3c]" style={mono}>
                    ${o.total} · {o.email}
                  </p>
                  <ul className="mt-3 space-y-1 text-[14px] text-[#111111]/70" style={inter}>
                    {items.map((it, i) => (
                      <li key={i}>
                        {it.qty}× {it.name} — size {it.size} (${it.price})
                      </li>
                    ))}
                  </ul>
                  {o.address && (
                    <p className="mt-2 text-[13px] text-[#111111]/50" style={inter}>Ship to: {o.address}</p>
                  )}
                  <div className="mt-4">
                    <StatusRow
                      current={o.status}
                      options={O_STATUSES}
                      onPick={(s) => {
                        setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status: s } : x)));
                        void post("/api/orders", o.id, s);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
