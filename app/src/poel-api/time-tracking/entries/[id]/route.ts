import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  deleteClosedEntryById,
  getClosedSecondsPerTask,
  sumSecondsToday,
} from "@/lib/time-tracking";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const deleted = await deleteClosedEntryById(userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Entry not found or still running" }, { status: 404 });
    }

    const [taskClosedSeconds, todaySeconds] = await Promise.all([
      getClosedSecondsPerTask(userId),
      sumSecondsToday(userId),
    ]);
    return NextResponse.json({ ok: true, taskClosedSeconds, todaySeconds });
  } catch (e) {
    console.error("time-tracking entries DELETE", e);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
