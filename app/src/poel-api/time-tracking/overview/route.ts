import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  getClosedSecondsPerTask,
  getRunningEntries,
  listClientsForUser,
  listTasksForUser,
  sumSecondsToday,
} from "@/lib/time-tracking";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [clients, tasks, runningEntries, todaySeconds, taskClosedSeconds] = await Promise.all([
      listClientsForUser(userId),
      listTasksForUser(userId),
      getRunningEntries(userId),
      sumSecondsToday(userId),
      getClosedSecondsPerTask(userId),
    ]);

    return NextResponse.json({ clients, tasks, runningEntries, todaySeconds, taskClosedSeconds });
  } catch (e) {
    console.error("time-tracking overview", e);
    return NextResponse.json({ error: "Failed to load time tracking" }, { status: 500 });
  }
}
