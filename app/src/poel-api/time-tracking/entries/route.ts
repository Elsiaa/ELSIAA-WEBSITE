import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { addManualEntry, getClosedSecondsPerTask } from "@/lib/time-tracking";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      taskId?: string;
      startedAt?: string;
      endedAt?: string;
      note?: string | null;
    };

    if (!body.taskId || !body.startedAt || !body.endedAt) {
      return NextResponse.json(
        { error: "taskId, startedAt, and endedAt are required" },
        { status: 400 },
      );
    }

    const entry = await addManualEntry(userId, {
      taskId: body.taskId,
      startedAt: body.startedAt,
      endedAt: body.endedAt,
      note: body.note,
    });
    const taskClosedSeconds = await getClosedSecondsPerTask(userId);
    return NextResponse.json({ entry, taskClosedSeconds });
  } catch (e) {
    console.error("time-tracking entries POST", e);
    const msg = e instanceof Error ? e.message : "Failed to add entry";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
