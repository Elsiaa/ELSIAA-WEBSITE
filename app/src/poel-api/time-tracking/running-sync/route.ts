import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getClosedSecondsPerTask, getRunningEntries, sumSecondsToday } from '@/lib/time-tracking';

/** Lightweight sync (open timers + today's closed total) — no clients/tasks payload. */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [runningEntries, todaySeconds, taskClosedSeconds] = await Promise.all([
      getRunningEntries(userId),
      sumSecondsToday(userId),
      getClosedSecondsPerTask(userId),
    ]);

    return NextResponse.json({ runningEntries, todaySeconds, taskClosedSeconds });
  } catch (e) {
    console.error('time-tracking running-sync', e);
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}
