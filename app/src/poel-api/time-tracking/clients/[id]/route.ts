import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { deleteClient, updateClient } from '@/lib/time-tracking';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as { name?: string; color?: string; sortOrder?: number };
    await updateClient(userId, id, {
      name: body.name,
      color: body.color,
      sortOrder: body.sortOrder,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('time-tracking client PATCH', e);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
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
    await deleteClient(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('time-tracking client DELETE', e);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
