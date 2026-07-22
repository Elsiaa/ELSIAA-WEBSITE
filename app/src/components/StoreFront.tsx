import { useMemo, useState } from "react";

/*
  StoreFront — ELSIAA merch, living inside the website.
  Alo-style: quiet luxury, generous whitespace, product first.
  Standard line: the logo tee + pants. Specialty: the City Line —
  location-branded, limited, upscale. Cart + order request; we invoice
  by email.
*/

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "'Inter', sans-serif" } as const;

export type Product = {
  id: string;
  name: string;
  price: number;
  img: string;
  tag: "Standard" | "City Line — Limited";
  blurb: string;
};

export const PRODUCTS: Product[] = [
  { id: "std-tee", name: "ELSIAA Tee", price: 58, img: "/assets/store/merch_tee.jpg", tag: "Standard", blurb: "Heavyweight black. The lion on the chest." },
  { id: "std-pants", name: "ELSIAA Pants", price: 118, img: "/assets/store/merch_pants.jpg", tag: "Standard", blurb: "Tapered heavyweight fleece. The lion at the hip." },
  { id: "city-ny", name: "New York Hoodie", price: 188, img: "/assets/store/merch_ny.jpg", tag: "City Line — Limited", blurb: "Bone heavyweight fleece. Where the pride began." },
  { id: "city-la", name: "Los Angeles Tee", price: 148, img: "/assets/store/merch_la.jpg", tag: "City Line — Limited", blurb: "Stone heavyweight cotton. West coast chapter." },
  { id: "city-ldn", name: "London Crewneck", price: 178, img: "/assets/store/merch_ldn.jpg", tag: "City Line — Limited", blurb: "Forest fleece, cream lion. The Mayfair run." },
  { id: "city-tlv", name: "Tel Aviv Tee", price: 148, img: "/assets/store/merch_tlv.jpg", tag: "City Line — Limited", blurb: "Sand heavyweight cotton. The Rothschild drop." },
];

const SIZES = ["XS", "S", "M", "L", "XL"];
type CartItem = { id: string; name: string; size: string; qty: number; price: number };

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1e6b3c] placeholder:text-[#111111]/30";

function ProductCard({ p, onAdd }: { p: Product; onAdd: (p: Product, size: string) => void }) {
  const [size, setSize] = useState("M");
  const [added, setAdded] = useState(false);
  return (
    <div className="group">
      <div className="overflow-hidden rounded-xl bg-[#F5F4F1]">
        <img
          src={p.img}
          alt={p.name}
          loading="lazy"
          className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
      <div className="mt-3.5 flex items-baseline justify-between">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em]" style={inter}>{p.name}</h3>
        <p className="text-[14px] font-medium text-[#111111]/80" style={mono}>${p.price}</p>
      </div>
      <p className="mt-0.5 text-[12.5px] text-[#111111]/45" style={inter}>{p.blurb}</p>
      {p.tag !== "Standard" && (
        <p className="mt-1 text-[10px] tracking-[0.22em] text-[#1e6b3c] uppercase" style={mono}>Limited</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`h-8 w-8 rounded-md border text-[11px] transition-all ${
                size === s
                  ? "border-[#111111] bg-[#111111] font-semibold text-white"
                  : "border-black/10 text-[#111111]/55 hover:border-black/30"
              }`}
              style={inter}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            onAdd(p, size);
            setAdded(true);
            setTimeout(() => setAdded(false), 1200);
          }}
          className="rounded-full border border-[#111111] px-4 py-2 text-[10.5px] font-bold tracking-[0.18em] uppercase transition-all hover:bg-[#111111] hover:text-white"
          style={mono}
        >
          {added ? "Added ✓" : "Add"}
        </button>
      </div>
    </div>
  );
}

export function StoreFront() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(false);

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const count = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const add = (p: Product, size: string) => {
    setCart((c) => {
      const key = `${p.id}-${size}`;
      const hit = c.find((i) => `${i.id}-${i.size}` === key);
      if (hit)
        return c.map((i) => (`${i.id}-${i.size}` === key ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: p.id, name: p.name, size, qty: 1, price: p.price }];
    });
    setDrawer(true);
  };

  const placeOrder = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, address, items: cart }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (!data.ok) throw new Error("bad");
      setPlaced(true);
    } catch {
      setError("Could not place the order — please try again.");
    } finally {
      setSending(false);
    }
  };

  const standard = PRODUCTS.filter((p) => p.tag === "Standard");
  const city = PRODUCTS.filter((p) => p.tag !== "Standard");

  return (
    <div>
      {/* hero */}
      <div className="overflow-hidden rounded-2xl bg-[#F5F4F1]">
        <img src="/assets/store/merch_hero.jpg" alt="ELSIAA merch" className="w-full object-cover" />
      </div>
      <p className="mt-8 max-w-2xl text-[17px] leading-relaxed text-[#111111]/60" style={inter}>
        Everyone loved our merch and asked where we bought it. So here it is —
        a line of clothing the creator would wear. Cut heavy, branded quietly,
        never reprinted.
      </p>

      {/* standard line */}
      <div className="mt-14">
        <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>The Standard</p>
        <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {standard.map((p) => <ProductCard key={p.id} p={p} onAdd={add} />)}
        </div>
      </div>

      {/* city line */}
      <div className="mt-16">
        <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>The City Line · Limited</p>
        <p className="mt-2 max-w-xl text-[14px] text-[#111111]/50" style={inter}>
          One drop per office. When a city sells out, it's gone.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {city.map((p) => <ProductCard key={p.id} p={p} onAdd={add} />)}
        </div>
      </div>

      {/* cart button */}
      {count > 0 && !drawer && (
        <button
          onClick={() => setDrawer(true)}
          className="fixed right-6 bottom-6 z-40 flex items-center gap-2 rounded-full bg-[#111111] px-6 py-4 text-[11px] font-bold tracking-[0.2em] text-white uppercase shadow-xl transition-transform hover:scale-105"
          style={mono}
        >
          Bag · {count}
        </button>
      )}

      {/* cart drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl md:p-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold" style={inter}>
                {placed ? "Order placed" : checkout ? "Checkout" : `Your bag (${count})`}
              </h3>
              <button onClick={() => setDrawer(false)} className="text-[22px] text-[#111111]/50 hover:text-[#111111]">×</button>
            </div>

            {placed ? (
              <div className="mt-6">
                <p className="text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
                  Thank you, {name.split(" ")[0]}. Your order request is with
                  the ELSIAA team — an invoice and payment link arrive by email
                  shortly. Nothing is charged until you approve it.
                </p>
              </div>
            ) : cart.length === 0 ? (
              <p className="mt-6 text-[14px] text-[#111111]/45" style={inter}>Your bag is empty.</p>
            ) : checkout ? (
              <div className="mt-6 flex flex-1 flex-col gap-3 overflow-y-auto">
                <input className={inputCls} style={inter} placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} />
                <input className={inputCls} style={inter} type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
                <textarea className={`${inputCls} min-h-[90px] resize-y`} style={inter} placeholder="Shipping address" value={address} onChange={(e) => setAddress(e.target.value)} />
                {error && <p className="text-[13px] text-red-600" style={inter}>{error}</p>}
                <div className="mt-auto border-t border-black/[0.07] pt-4">
                  <div className="flex justify-between text-[15px] font-semibold" style={inter}>
                    <span>Total</span><span style={mono}>${total}</span>
                  </div>
                  <button
                    onClick={placeOrder}
                    disabled={sending || !name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)}
                    className="mt-4 w-full rounded-full bg-[#111111] py-4 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all enabled:hover:bg-[#1e6b3c] disabled:opacity-30"
                    style={mono}
                  >
                    {sending ? "Placing…" : "Place order request"}
                  </button>
                  <p className="mt-3 text-center text-[11.5px] text-[#111111]/40" style={inter}>
                    We invoice by email — nothing is charged now.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-1 flex-col overflow-y-auto">
                <ul className="space-y-4">
                  {cart.map((i) => (
                    <li key={`${i.id}-${i.size}`} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14.5px] font-medium" style={inter}>{i.name}</p>
                        <p className="text-[12px] text-[#111111]/45" style={mono}>Size {i.size} · ${i.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCart((c) => c.map((x) => x === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} className="h-7 w-7 rounded-md border border-black/10 text-[14px]">−</button>
                        <span className="w-5 text-center text-[14px]" style={inter}>{i.qty}</span>
                        <button onClick={() => setCart((c) => c.map((x) => x === i ? { ...x, qty: x.qty + 1 } : x))} className="h-7 w-7 rounded-md border border-black/10 text-[14px]">+</button>
                        <button onClick={() => setCart((c) => c.filter((x) => x !== i))} className="ml-1 text-[13px] text-[#111111]/35 hover:text-red-600">✕</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto border-t border-black/[0.07] pt-4">
                  <div className="flex justify-between text-[15px] font-semibold" style={inter}>
                    <span>Total</span><span style={mono}>${total}</span>
                  </div>
                  <button
                    onClick={() => setCheckout(true)}
                    className="mt-4 w-full rounded-full bg-[#111111] py-4 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all hover:bg-[#1e6b3c]"
                    style={mono}
                  >
                    Checkout →
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
