// Public demo TTS for the Automate page Secretary.
// Keeps OPENAI_API_KEY server-side; returns audio/mpeg for the browser to play.
import { createFileRoute } from "@tanstack/react-router";

const MAX_CHARS = 500;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40;

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

const VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
]);

export const Route = createFileRoute("/api/secretary/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = (process.env.OPENAI_API_KEY || "").trim();
        if (!key) {
          return Response.json(
            { ok: false, code: "tts_not_configured" },
            { status: 503 },
          );
        }

        if (!rateLimit(clientIp(request))) {
          return Response.json(
            { ok: false, code: "rate_limited" },
            { status: 429 },
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, code: "bad_json" }, { status: 400 });
        }

        const text =
          typeof body === "object" &&
          body &&
          "text" in body &&
          typeof (body as { text: unknown }).text === "string"
            ? (body as { text: string }).text.trim()
            : "";

        if (!text || text.length > MAX_CHARS) {
          return Response.json(
            { ok: false, code: "invalid_text" },
            { status: 400 },
          );
        }

        const voiceEnv = (process.env.OPENAI_TTS_VOICE || "nova").trim();
        const voice = VOICES.has(voiceEnv) ? voiceEnv : "nova";
        const model = (process.env.OPENAI_TTS_MODEL || "tts-1-hd").trim();

        try {
          const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              voice,
              input: text,
              response_format: "mp3",
            }),
          });

          if (!upstream.ok) {
            const detail = await upstream.text().catch(() => "");
            console.error("[secretary/tts] OpenAI error", upstream.status, detail.slice(0, 300));
            return Response.json(
              { ok: false, code: "upstream_error" },
              { status: 502 },
            );
          }

          return new Response(upstream.body, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          console.error("[secretary/tts] fetch failed", err);
          return Response.json(
            { ok: false, code: "tts_failed" },
            { status: 502 },
          );
        }
      },
    },
  },
});
