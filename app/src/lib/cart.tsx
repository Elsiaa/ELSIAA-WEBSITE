import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { bySlug } from "./merch";

/* ELSIAA Merch cart — localStorage-backed, shared across store pages.
   Toasts are minimal; the drawer is the fast path, /cart the full page. */

export type CartLine = { slug: string; size: string; qty: number };
type Toast = { id: number; text: string };

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (slug: string, size: string, qty?: number) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  remove: (slug: string, size: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (o: boolean) => void;
  toasts: Toast[];
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "elsiaa-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const tid = useRef(0);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* fresh cart */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  const toast = useCallback((text: string) => {
    const id = ++tid.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  }, []);

  const add = useCallback(
    (slug: string, size: string, qty = 1) => {
      setLines((ls) => {
        const i = ls.findIndex((l) => l.slug === slug && l.size === size);
        if (i > -1) {
          const next = [...ls];
          next[i] = { ...next[i], qty: next[i].qty + qty };
          return next;
        }
        return [...ls, { slug, size, qty }];
      });
      const p = bySlug(slug);
      toast(`Added — ${p?.name ?? slug}${size !== "One Size" ? ` · ${size}` : ""}`);
    },
    [toast],
  );

  const setQty = useCallback((slug: string, size: string, qty: number) => {
    setLines((ls) =>
      qty <= 0
        ? ls.filter((l) => !(l.slug === slug && l.size === size))
        : ls.map((l) => (l.slug === slug && l.size === size ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((slug: string, size: string) => {
    setLines((ls) => ls.filter((l) => !(l.slug === slug && l.size === size)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);
  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + (bySlug(l.slug)?.price ?? 0) * l.qty, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      count,
      subtotal,
      add,
      setQty,
      remove,
      clear,
      drawerOpen,
      setDrawerOpen,
      toasts,
    }),
    [lines, count, subtotal, add, setQty, remove, clear, drawerOpen, toasts],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
