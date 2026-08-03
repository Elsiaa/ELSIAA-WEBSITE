import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import {
  higgsfieldDesignInspectorVitePlugin,
  higgsfieldDesignSourceBabelPlugin,
} from "./src/module/design-inspector/vite";
import svgr from "vite-plugin-svgr";
import { defineConfig, loadEnv } from "vite";
import { nitro } from "nitro/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";

// The vendored @higgsfield/quanta components import their glyphs from the private
// Nexus-only `@higgsfield-ai/icons`. Generated sites build on the PUBLIC npm
// registry, so we redirect every `@higgsfield-ai/icons/*` import to a Material
// Symbols shim instead (see src/lib/quanta-material-icons.ts). tsconfig.json has
// the matching `paths` entry so type-checking resolves it too.
const QUANTA_ICONS_SHIM = fileURLToPath(
  new URL("./src/lib/quanta-material-icons.ts", import.meta.url),
);
const CLOUDFLARE_WORKERS_STUB = fileURLToPath(
  new URL("./src/lib/cloudflare-workers.dev-stub.ts", import.meta.url),
);

export default defineConfig(({ command, mode }) => {
  // Load ALL .env / .env.local keys into process.env (not just VITE_*).
  // Without this, SUPABASE_* and other server keys stay undefined under SSR.
  const loaded = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(loaded)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  const designInspectorEnabled = process.env.HF_DESIGN_INSPECTOR === "1" || mode === "design";
  // Default target is Vercel (Nitro). Set DEPLOY_TARGET=cloudflare for the
  // legacy Workers-for-Platforms / Higgsfield Worker bundle.
  const deployCloudflare = process.env.DEPLOY_TARGET === "cloudflare";
  const needsWorkersStub = !deployCloudflare;

  // Prefer process.env (Vercel injects project env here at build time).
  // `loaded` alone only sees committed/.env files — empty on Vercel builds.
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const supabasePublishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return {
    // dev-only: bind all interfaces and accept tunnel hosts so a shareable
    // preview URL (LAN IP or cloudflared) can reach the dev server.
    server: { host: true, allowedHosts: true },
    define: {
      // Bake publishable Supabase config into the client bundle. Server still
      // reads live process.env at runtime for secrets.
      "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(
        supabasePublishableKey,
      ),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        supabasePublishableKey,
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        supabasePublishableKey,
      ),
    },
    resolve: {
      alias: [
        { find: /^@higgsfield-ai\/icons(\/.*)?$/, replacement: QUANTA_ICONS_SHIM },
        {
          find: "next/server",
          replacement: fileURLToPath(new URL("./src/shims/next-server.ts", import.meta.url)),
        },
        {
          find: "next/headers",
          replacement: fileURLToPath(new URL("./src/shims/next-headers.ts", import.meta.url)),
        },
        {
          find: "next/navigation",
          replacement: fileURLToPath(
            new URL("./src/shims/next-navigation.ts", import.meta.url),
          ),
        },
        {
          find: "next/image",
          replacement: fileURLToPath(new URL("./src/shims/next-image.tsx", import.meta.url)),
        },
        {
          find: "next/link",
          replacement: fileURLToPath(new URL("./src/shims/next-link.tsx", import.meta.url)),
        },
        {
          find: "next-auth/react",
          replacement: fileURLToPath(
            new URL("./src/shims/next-auth-react.tsx", import.meta.url),
          ),
        },
        {
          find: "@/auth",
          replacement: fileURLToPath(new URL("./src/auth.ts", import.meta.url)),
        },
        // `cloudflare:workers` only exists inside workerd. Stub it for Vite
        // serve, Nitro, and Vercel so SSR can resolve the import.
        ...(needsWorkersStub
          ? [{ find: "cloudflare:workers", replacement: CLOUDFLARE_WORKERS_STUB }]
          : []),
      ],
    },
    ssr: deployCloudflare
      ? {
          // Cloudflare Worker bundle: inline npm deps (no node_modules at
          // runtime) but keep the workerd built-in external.
          noExternal: command === "build" ? true : undefined,
          external: ["cloudflare:workers"],
        }
      : undefined,
    build: deployCloudflare
      ? {
          rollupOptions: { external: [/^cloudflare:/] },
        }
      : undefined,
    plugins: [
      // Material Symbols SVGs (the app icon set) import as React components via
      // `?react`. `icon: true` sizes them 1em; fill is forced to currentColor so
      // they color like text (the raw SVGs have no fill attribute). Keep the
      // viewBox so CSS sizing scales the glyph.
      svgr({
        svgrOptions: {
          icon: true,
          svgProps: { fill: "currentColor" },
          svgoConfig: {
            plugins: [
              { name: "preset-default", params: { overrides: { removeViewBox: false } } },
            ],
          },
        },
      }),
      // TanStack Start plugin must run before React's plugin.
      //
      // Vercel: Nitro compiles the server into Vercel Functions.
      // Cloudflare (DEPLOY_TARGET=cloudflare): custom Worker `fetch` entry.
      tanstackStart({
        ...(deployCloudflare ? { server: { entry: "server" } } : {}),
      }),
      // Required for Vercel (and other Nitro targets). Skip when intentionally
      // building the raw Cloudflare Worker bundle.
      ...(deployCloudflare ? [] : [nitro()]),
      higgsfieldDesignInspectorVitePlugin(designInspectorEnabled),
      react({
        babel: {
          plugins: designInspectorEnabled ? [higgsfieldDesignSourceBabelPlugin] : [],
        },
      }),
      tailwindcss(),
      tsconfigPaths(),
    ],
  };
});
