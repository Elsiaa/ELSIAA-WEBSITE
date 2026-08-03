import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StoreShell, F } from "../components/StoreShell";
import { useCart } from "../lib/cart";
import { bySlug } from "../lib/merch";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout · ELSIAA Merch" },
      { name: "description", content: "Secure checkout — ELSIAA Merch." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const field =
  "w-full rounded-xl border border-black/[0.12] bg-white px-4 py-3.5 text-[15px] text-[#111111] outline-none transition-colors placeholder:text-[#111111]/35 focus:border-[#1e6b3c]";

function CheckoutBody() {
  const { lines, subtotal, clear } = useCart();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", address: "", city: "", country: "", postal: "", notes: "", card: "", exp: "", cvc: "" });
  const [ship, setShip] = useState<"standard" | "express">("standard");
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState("");

  const shipping = ship === "express" ? 25 : 0;
  const total = subtotal + shipping;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email);
  const valid = f.name.trim() && emailOk && f.address.trim() && f.city.trim() && f.country.trim() && f.postal.trim() && f.card.replace(/\s/g, "").length >= 12 && f.exp.trim() && f.cvc.trim().length >= 3;

  const pay = () => {
    if (!valid || paying) { setErr("Fill in the required fields to place your order."); return; }
    setErr("");
    setPaying(true);
    const order = {
      number: `EL-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: f.name, email: f.email, ship, shipping, subtotal, total,
      lines: lines.map((l) => ({ ...l, name: bySlug(l.slug)?.name ?? l.slug, price: bySlug(l.slug)?.price ?? 0 })),
      placed: new Date().toISOString(),
    };
    setTimeout(() => {
      try { sessionStorage.setItem("elsiaa-last-order", JSON.stringify(order)); } catch { /* ignore */ }
      clear();
      nav({ to: "/order-confirmation" });
    }, 1400);
  };

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-16 text-center" style={F}>
        <h1 className="text-[24px] font-semibold text-[#111111]">Nothing to check out — yet.</h1>
        <a href="/store" className="mt-6 inline-flex min-h-[50px] items-center rounded-full bg-[#111111] px-8 text-[15px] font-semibold text-white hover:opacity-85">Browse the store →</a>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-[1fr_380px] md:py-16" style={F}>
      {/* form */}
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#111111]">Checkout</h1>

        <h2 className="mt-8 text-[15px] font-semibold text-[#111111]">Shipping</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className={field} placeholder="Full name" value={f.name} onChange={set("name")} autoComplete="name" />
          <input className={field} placeholder="Email" type="email" value={f.email} onChange={set("email")} autoComplete="email" />
          <input className={field} placeholder="Phone (optional)" value={f.phone} onChange={set("phone")} autoComplete="tel" inputMode="tel" />
          <input className={field} placeholder="Address" value={f.address} onChange={set("address")} autoComplete="street-address" />
          <input className={field} placeholder="City" value={f.city} onChange={set("city")} autoComplete="address-level2" />
          <div className="grid grid-cols-2 gap-3">
            <input className={field} placeholder="Country" value={f.country} onChange={set("country")} autoComplete="country-name" />
            <input className={field} placeholder="Postal code" value={f.postal} onChange={set("postal")} autoComplete="postal-code" />
          </div>
        </div>

        <h2 className="mt-8 text-[15px] font-semibold text-[#111111]">Shipping method</h2>
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
          {([["standard", "Standard — Free", "5–8 business days"], ["express", "Express — $25", "1–2 business days"]] as const).map(([k, label, note]) => (
            <button
              key={k}
              onClick={() => setShip(k)}
              aria-pressed={ship === k}
              className={`flex-1 rounded-2xl border p-4 text-left transition-all ${ship === k ? "border-[#1e6b3c] bg-[#1e6b3c]/[0.05]" : "border-black/[0.12] hover:border-black/30"}`}
            >
              <p className="text-[14px] font-semibold text-[#111111]">{label}</p>
              <p className="mt-0.5 text-[13px] text-[#111111]/50">{note}</p>
            </button>
          ))}
        </div>

        <h2 className="mt-8 text-[15px] font-semibold text-[#111111]">Payment</h2>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <input className={field} placeholder="Card number" value={f.card} onChange={set("card")} inputMode="numeric" autoComplete="cc-number" />
          <div className="grid grid-cols-2 gap-3">
            <input className={field} placeholder="MM / YY" value={f.exp} onChange={set("exp")} inputMode="numeric" autoComplete="cc-exp" />
            <input className={field} placeholder="CVC" value={f.cvc} onChange={set("cvc")} inputMode="numeric" autoComplete="cc-csc" />
          </div>
        </div>
        <p className="mt-2 text-[12.5px] text-[#111111]/40">Encrypted checkout · You'll receive an email confirmation.</p>

        <h2 className="mt-8 text-[15px] font-semibold text-[#111111]">Order notes <span className="font-normal text-[#111111]/40">(optional)</span></h2>
        <textarea className={`${field} mt-3 min-h-[90px] resize-y`} placeholder="Anything we should know — gift note, delivery instructions…" value={f.notes} onChange={set("notes")} />

        {err && <p className="mt-4 text-[14px] text-red-600">{err}</p>}
        <button
          onClick={pay}
          disabled={paying}
          className={`mt-7 flex min-h-[54px] w-full items-center justify-center rounded-full text-[15.5px] font-semibold transition-all ${valid && !paying ? "bg-[#111111] text-white hover:opacity-85" : "bg-black/[0.07] text-[#111111]/40"}`}
        >
          {paying ? "Processing…" : `Pay Securely — $${total}`}
        </button>
      </div>

      {/* summary */}
      <aside className="md:sticky md:top-24 md:h-fit">
        <div className="rounded-3xl border border-black/[0.08] bg-[#fafaf8] p-6">
          <h2 className="text-[15px] font-semibold text-[#111111]">Order summary</h2>
          <div className="mt-4 flex flex-col gap-3.5">
            {lines.map((l) => {
              const p = bySlug(l.slug);
              if (!p) return null;
              return (
                <div key={`${l.slug}-${l.size}`} className="flex items-center gap-3">
                  <img src={p.img} alt={p.name} className="h-14 w-11 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-[13.5px] font-medium text-[#111111]">{p.name}</p>
                    <p className="text-[12.5px] text-[#111111]/45">{l.size} × {l.qty}</p>
                  </div>
                  <span className="text-[13.5px] text-[#111111]/70">${p.price * l.qty}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-col gap-1.5 border-t border-black/[0.07] pt-4 text-[13.5px]">
            <div className="flex justify-between text-[#111111]/60"><span>Subtotal</span><span>${subtotal}</span></div>
            <div className="flex justify-between text-[#111111]/60"><span>Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping}`}</span></div>
            <div className="mt-1 flex justify-between text-[16px] font-semibold text-[#111111]"><span>Total</span><span>${total}</span></div>
          </div>
        </div>
        <a href="/cart" className="mt-3 block text-center text-[13px] text-[#111111]/50 hover:text-[#111111]">← Edit cart</a>
      </aside>
    </section>
  );
}

function CheckoutPage() {
  return (
    <StoreShell>
      <CheckoutBody />
    </StoreShell>
  );
}
