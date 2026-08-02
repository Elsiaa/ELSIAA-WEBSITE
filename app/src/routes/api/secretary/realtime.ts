// Mint a short-lived OpenAI Realtime client secret for the Automate Secretary.
// The browser then POSTs its WebRTC SDP straight to OpenAI with that token
// (keeps OPENAI_API_KEY server-side; avoids multipart SDP relay issues).
import { createFileRoute } from "@tanstack/react-router";
import { getSecretaryRealtimeSession } from "../../../lib/secretary-realtime.server";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("cf-connecting-ip") || "unknown";
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now >= b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_MAX) return false;
  b.count += 1;
  return true;
}

export const Route = createFileRoute("/api/secretary/realtime")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = (process.env.OPENAI_API_KEY || "").trim();
        if (!key) {
          return Response.json(
            { ok: false, code: "realtime_not_configured" },
            { status: 503 },
          );
        }

        if (!rateLimit(clientIp(request))) {
          return Response.json(
            { ok: false, code: "rate_limited" },
            { status: 429 },
          );
        }

        const session = getSecretaryRealtimeSession();

        try {
          const upstream = await fetch(
            "https://api.openai.com/v1/realtime/client_secrets",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
                "OpenAI-Safety-Identifier": "elsiaa-secretary-demo",
              },
              body: JSON.stringify({ session }),
            },
          );

          const data = (await upstream.json().catch(() => ({}))) as {
            value?: string;
            client_secret?: { value?: string };
            error?: { message?: string; code?: string; type?: string };
          };

          if (!upstream.ok) {
            console.error(
              "[secretary/realtime] client_secrets error",
              upstream.status,
              data,
            );
            return Response.json(
              {
                ok: false,
                code: "upstream_error",
                detail: data.error?.message || data.error?.code || "token_failed",
              },
              { status: 502 },
            );
          }

          const value = data.value || data.client_secret?.value;
          if (!value) {
            return Response.json(
              { ok: false, code: "upstream_error", detail: "missing_token" },
              { status: 502 },
            );
          }

          return Response.json(
            { ok: true, value, model: session.model },
            {
              status: 200,
              headers: { "Cache-Control": "no-store" },
            },
          );
        } catch (err) {
          console.error("[secretary/realtime] fetch failed", err);
          return Response.json(
            { ok: false, code: "realtime_failed" },
            { status: 502 },
          );
        }
      },
    },
  },
});
