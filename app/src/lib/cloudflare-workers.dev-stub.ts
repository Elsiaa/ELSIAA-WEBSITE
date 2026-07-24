// Node / Vercel / Vite-dev stand-in for the workerd-only `cloudflare:workers`
// module. Production Cloudflare Workers provide the real `env` (D1, R2, KV,
// secrets). On Vercel and local `vite dev` there is no workerd — expose vars
// from process.env so SSR and server functions can boot. D1 (`DB`) stays
// undefined here; wire a Vercel-compatible store later if forms need persistence.
export const env: Record<string, unknown> = {
  HF_ENV: process.env.HF_ENV ?? process.env.VERCEL_ENV ?? "dev",
  APP_SLUG: process.env.APP_SLUG ?? "local",
  ADMIN_KEY: process.env.ADMIN_KEY,
};
