/** next/navigation shim — limited; prefer TanStack router in new code. */
function sameOriginUrl(href: string): URL | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return url;
  } catch {
    return null;
  }
}

export function useRouter() {
  return {
    push: (href: string) => {
      // Full navigation so TanStack Router / SSR routes load correctly.
      if (typeof window !== "undefined") window.location.href = href;
    },
    replace: (href: string, _opts?: { scroll?: boolean }) => {
      if (typeof window === "undefined") return;
      const url = sameOriginUrl(href);
      // Soft replace for query sync (Poel portal) — avoids bouncing off /portal.
      if (url) {
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        return;
      }
      window.location.replace(href);
    },
    refresh: () => {
      if (typeof window !== "undefined") window.location.reload();
    },
    back: () => {
      if (typeof window !== "undefined") window.history.back();
    },
    prefetch: () => {},
  };
}

export function usePathname() {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
}

export function useSearchParams() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  return {
    get: (k: string) => params.get(k),
    getAll: (k: string) => params.getAll(k),
    has: (k: string) => params.has(k),
    toString: () => params.toString(),
    entries: () => params.entries(),
    keys: () => params.keys(),
    values: () => params.values(),
    forEach: (...args: Parameters<URLSearchParams["forEach"]>) => params.forEach(...args),
  };
}

export function redirect(url: string): never {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
  throw new Error(`REDIRECT:${url}`);
}

export function notFound(): never {
  throw new Error("NOT_FOUND");
}
