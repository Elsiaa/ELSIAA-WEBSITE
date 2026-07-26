import { readdirSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";

const root = "src/poel-api";
const outRoot = "src/routes/api";

function walk(dir: string, acc: string[] = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name === "route.ts") acc.push(p);
  }
  return acc;
}

function toTanstackPath(rel: string) {
  return rel.replace(/\[([^\]]+)\]/g, "$$$1").replace(/\/route\.ts$/, "");
}

function toRouteId(tanPath: string) {
  return "/api/" + tanPath.split("/").filter(Boolean).join("/");
}

const routes = walk(root);
let n = 0;
for (const file of routes) {
  const rel = relative(root, file);
  const tanRel = toTanstackPath(rel);
  if (tanRel.startsWith("mail")) continue;
  const routeId = toRouteId(tanRel);
  const outFile = join(outRoot, tanRel + ".ts");
  mkdirSync(dirname(outFile), { recursive: true });

  let importPath = relative(dirname(outFile), file).replace(/\\/g, "/").replace(/\.ts$/, "");
  if (!importPath.startsWith(".")) importPath = "./" + importPath;

  // Lazy-import Poel handlers so the route tree does not eagerly load Stripe/S3/pdf
  // (and crash every SSR page when optional secrets or CJS interop fail at module top-level).
  const content = `/* Auto-generated from Poel API — do not edit by hand */
import { createFileRoute } from "@tanstack/react-router";
import { NextRequest } from "next/server";

type Ctx = { request: Request; params: Record<string, string> };

function method(name: "GET" | "POST" | "PUT" | "PATCH" | "DELETE") {
  return async ({ request, params }: Ctx) => {
    const handlers = await import("${importPath}");
    const fn = (handlers as Record<string, unknown>)[name];
    if (typeof fn !== "function") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const req = new NextRequest(request.url, request);
    return await (
      fn as (
        req: NextRequest,
        ctx: { params: Promise<Record<string, string>> },
      ) => Promise<Response> | Response
    )(req, { params: Promise.resolve(params ?? {}) });
  };
}

export const Route = createFileRoute("${routeId}")({
  server: {
    handlers: {
      GET: method("GET"),
      POST: method("POST"),
      PUT: method("PUT"),
      PATCH: method("PATCH"),
      DELETE: method("DELETE"),
    },
  },
});
`;
  writeFileSync(outFile, content);
  n++;
}
console.log(`Generated ${n} API routes (lazy handlers)`);
