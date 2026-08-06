/* Auto-generated from Poel API — do not edit by hand */
import { createFileRoute } from "@tanstack/react-router";
import { NextRequest } from "next/server";

type Ctx = { request: Request; params: Record<string, string> };

function method(name: "GET" | "POST" | "PUT" | "PATCH" | "DELETE") {
  return async ({ request, params }: Ctx) => {
    const handlers =
      await import("../../../../../poel-api/projects/[id]/auth-devices/[deviceId]/route");
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

export const Route = createFileRoute("/api/projects/$id/auth-devices/$deviceId")({
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
