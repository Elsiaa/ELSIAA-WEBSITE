import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { startTimer, stopTimerByEntryId } from "@/lib/time-tracking";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { action?: string; taskId?: string; entryId?: string };
    if (body.action === "stop") {
      if (!body.entryId || typeof body.entryId !== "string") {
        return NextResponse.json({ error: "entryId is required" }, { status: 400 });
      }
      const result = await stopTimerByEntryId(userId, body.entryId);
      if (!result) {
        return NextResponse.json({ error: "Timer not found or already stopped" }, { status: 404 });
      }
      return NextResponse.json({
        entry: result.entry,
        todaySeconds: result.todaySeconds,
        taskClosedSeconds: result.taskClosedSeconds,
      });
    }
    if (body.action === "start") {
      if (!body.taskId || typeof body.taskId !== "string") {
        return NextResponse.json({ error: "taskId is required" }, { status: 400 });
      }
      const entry = await startTimer(userId, body.taskId);
      return NextResponse.json({ entry });
    }

    return NextResponse.json({ error: "action must be start or stop" }, { status: 400 });
  } catch (e) {
    console.error("time-tracking timer POST", e);
    const msg = e instanceof Error ? e.message : "Timer failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
