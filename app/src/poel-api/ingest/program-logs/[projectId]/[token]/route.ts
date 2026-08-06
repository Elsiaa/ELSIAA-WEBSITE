import { NextRequest, NextResponse } from "next/server";
import { insertProjectProgramLog, verifyProgramLogIngest } from "@/lib/project-program-logs";

const MAX_BODY_BYTES = 256 * 1024;

/**
 * POST /api/ingest/program-logs/[projectId]/[token]
 * Public webhook: programs POST JSON (or plain text) to record a log line for this project.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; token: string }> },
) {
  try {
    const { projectId, token } = await context.params;
    if (!projectId || !token) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ok = await verifyProgramLogIngest(projectId, decodeURIComponent(token));
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const len = Number(request.headers.get("content-length") || "0");
    if (len > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let body: unknown = {};
    const ct = request.headers.get("content-type") || "";
    if (raw.length === 0) {
      body = {};
    } else if (ct.includes("application/json")) {
      try {
        body = JSON.parse(raw) as unknown;
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
    } else {
      body = { raw };
    }

    const row = await insertProjectProgramLog(projectId, body);
    if (!row) {
      return NextResponse.json({ error: "Failed to store log" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to ingest log";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
