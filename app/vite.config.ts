import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import {
  higgsfieldDesignInspectorVitePlugin,
  higgsfieldDesignSourceBabelPlugin,
} from "./src/module/design-inspector/vite";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vite";
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
  const designInspectorEnabled = process.env.HF_DESIGN_INSPECTOR === "1" || mode === "design";
  // GitHub Pages has no server, so that build prerenders every route to static
  // HTML and ships dist/client only.
  const prerenderForPages = process.env.GH_PAGES === "1";
  // Default target is Vercel (Nitro). Set DEPLOY_TARGET=cloudflare for the
  // legacy Workers-for-Platforms / Higgsfield Worker bundle.
  const deployCloudflare = process.env.DEPLOY_TARGET === "cloudflare";
  const needsWorkersStub = !deployCloudflare;

  return {
    resolve: {
      alias: [
        { find: /^@higgsfield-ai\/icons(\/.*)?$/, replacement: QUANTA_ICONS_SHIM },
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
        ...(prerenderForPages
          ? {
              prerender: { enabled: true, crawlLinks: true, failOnError: true },
              // crawlLinks starts at "/" and follows nav links; concept-walk is
              // not linked from the nav, so name it explicitly.
              pages: [{ path: "/concept-walk" }],
            }
          : {}),
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
