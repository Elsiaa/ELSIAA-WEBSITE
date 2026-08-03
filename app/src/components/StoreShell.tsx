import { CartProvider, useCart } from "../lib/cart";
import { bySlug } from "../lib/merch";

/* StoreShell — the merch store's own chrome. Quiet luxury: white, ink,
   one green accent. Header (wordmark · The Store · direct · quote · cart),
   slide-over cart drawer, toast stack, and the offices footer. */

export const F = { fontFamily: "var(--font-sans)" } as const;

function Header() {
  const { count, setDrawerOpen } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/95 backdrop-blur-sm" style={F}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <a href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-70" aria-label="ELSIAA — home">
          <img src="/assets/elsiaa-lion-192.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="text-[14px] font-bold tracking-[0.24em] text-[#111111]">ELSIAA</span>
        </a>
        <nav className="flex items-center gap-4 md:gap-6">
          <a href="/store" className="text-[13.5px] font-medium text-[#111111] underline-offset-4 hover:underline">The Store</a>
          <a href="mailto:info@elsiaa.com" className="hidden text-[13.5px] text-[#111111]/60 hover:text-[#111111] md:inline">info@elsiaa.com</a>
          <a href="/quote" className="hidden text-[13.5px] font-medium text-[#1e6b3c] hover:underline md:inline">Get a quote →</a>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label={`Cart, ${count} items`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/[0.04]"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 7h12l-1.2 12.2a1.6 1.6 0 0 1-1.6 1.4H8.8a1.6 1.6 0 0 1-1.6-1.4L6 7Z" />
              <path d="M9 7V5.8A3 3 0 0 1 12 3a3 3 0 0 1 3 2.8V7" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#111111] px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

function Drawer() {
  const { lines, subtotal, setQty, remove, drawerOpen, setDrawerOpen } = useCart();
  return (
    <div className={`fixed inset-0 z-50 ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
      <div
        className={`absolute inset-0 bg-black/25 transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={`absolute top-0 right-0 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
        style={F}
        role="dialog"
        aria-label="Cart"
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
          <p className="text-[15px] font-semibold text-[#111111]">Cart</p>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close cart" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[0.04]">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <p className="pt-10 text-center text-[14px] text-[#111111]/50">Your cart is empty — for now.</p>
          ) : (
            lines.map((l) => {
              const p = bySlug(l.slug);
              if (!p) return null;
              return (
                <div key={`${l.slug}-${l.size}`} className="flex gap-4 border-b border-black/[0.05] py-4">
                  <img src={p.img} alt={p.name} className="h-20 w-16 rounded-lg object-cover" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-baseline justify-between gap-3">
                      <a href={`/product/${p.slug}`} className="text-[13.5px] font-medium text-[#111111] hover:underline">{p.name}</a>
                      <span className="text-[13.5px] text-[#111111]/70">${p.price * l.qty}</span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-[#111111]/45">{l.size}</p>
                    <div className="mt-auto flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-black/[0.12]">
                        <button onClick={() => setQty(l.slug, l.size, l.qty - 1)} className="h-8 w-8 text-[15px]" aria-label="Decrease">−</button>
                        <span className="w-6 text-center text-[13px]">{l.qty}</span>
                        <button onClick={() => setQty(l.slug, l.size, l.qty + 1)} className="h-8 w-8 text-[15px]" aria-label="Increase">+</button>
                      </div>
                      <button onClick={() => remove(l.slug, l.size)} className="text-[12.5px] text-[#111111]/45 hover:text-[#111111]">Remove</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {lines.length > 0 && (
          <div className="border-t border-black/[0.06] px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[13.5px] text-[#111111]/60">Subtotal</span>
              <span className="text-[16px] font-semibold text-[#111111]">${subtotal}</span>
            </div>
            <a href="/checkout" className="mt-4 flex min-h-[50px] w-full items-center justify-center rounded-full bg-[#111111] text-[14.5px] font-semibold text-white transition-opacity hover:opacity-85">
              Checkout →
            </a>
            <a href="/cart" onClick={() => setDrawerOpen(false)} className="mt-2.5 block text-center text-[13px] text-[#111111]/55 hover:text-[#111111]">
              View full cart
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}

function Toasts() {
  const { toasts } = useCart();
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2" style={F}>
      {toasts.map((t) => (
        <div key={t.id} className="rounded-full bg-[#111111] px-5 py-2.5 text-[13px] font-medium text-white shadow-lg" style={{ animation: "stToast .25s ease" }}>
          {t.text}
        </div>
      ))}
      <style>{`@keyframes stToast { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-black/[0.06] bg-white" style={F}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-10 text-center">
        <p className="text-[13px] text-[#111111]/50">New York · Los Angeles · London · Geneva · Antwerp · Tel Aviv</p>
        <p title="With God's help we shall do and succeed." className="cursor-help text-[13px] text-[#111111]/50">בעזרת ה׳ נעשה ונצליח</p>
        <p className="mt-1 text-[12.5px] text-[#111111]/35">© {new Date().getFullYear()} ELSIAA Merch — AI Done Better</p>
      </div>
    </footer>
  );
}

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white text-[#111111] antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
        <Drawer />
        <Toasts />
      </div>
    </CartProvider>
  );
}
