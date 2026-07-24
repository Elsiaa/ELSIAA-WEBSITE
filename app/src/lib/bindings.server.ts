// Server-only access to this app's platform bindings / env.
//
// On Cloudflare Workers, `cloudflare:workers` exposes D1 `DB`, R2 `STORAGE`,
// KV, and secrets. On Vercel / Node (Nitro), Vite aliases that import to
// `cloudflare-workers.dev-stub.ts`, which mirrors process.env (no D1).
// Accessors that need DB must guard — `bindings().DB` is optional.
import { env } from "cloudflare:workers";
import type {
  D1Database,
  DurableObjectNamespace,
  KVNamespace,
  R2Bucket,
} from "@cloudflare/workers-types";

type AppEnv = {
  DB?: D1Database;
  STORAGE?: R2Bucket;
  KV?: KVNamespace;
  // The container's Durable Object — present only when "container" is set in
  // the manifest. Reach an instance with env.CONTAINER.getByName(id), then
  // .fetch(). See skills/containers.md.
  CONTAINER?: DurableObjectNamespace;
  HF_ENV?: string;
  APP_SLUG?: string;
  // Site secrets (Vercel env / Cloudflare Worker secrets)
  ADMIN_KEY?: string;
};

export function bindings(): AppEnv {
  const platform = env as unknown as AppEnv;
  // Merge process.env so Vercel dashboard secrets (ADMIN_KEY, etc.) win when
  // the Cloudflare module stub left them unset.
  return {
    ...platform,
    HF_ENV:
      platform.HF_ENV ?? process.env.HF_ENV ?? process.env.VERCEL_ENV ?? undefined,
    APP_SLUG: platform.APP_SLUG ?? process.env.APP_SLUG,
    ADMIN_KEY: platform.ADMIN_KEY ?? process.env.ADMIN_KEY,
  };
}
