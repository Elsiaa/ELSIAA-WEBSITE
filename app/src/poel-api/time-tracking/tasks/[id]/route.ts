import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { deleteTask, updateTask } from '@/lib/time-tracking';
import type { TimeTrackingTaskStatus } from '@/lib/time-tracking';

const STATUSES: TimeTrackingTaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      status?: TimeTrackingTaskStatus;
      billable?: boolean;
      notes?: string | null;
      clientId?: string;
    };

    const patch: Parameters<typeof updateTask>[2] = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      patch.status = body.status;
    }
    if (body.billable !== undefined) patch.billable = body.billable;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.clientId !== undefined) patch.clientId = body.clientId;

    await updateTask(userId, id, patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('time-tracking task PATCH', e);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await deleteTask(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('time-tracking task DELETE', e);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
