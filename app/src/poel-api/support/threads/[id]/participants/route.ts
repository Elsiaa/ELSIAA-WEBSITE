import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCurrentUser, isSuperAdmin } from '@/lib/permissions';
import {
  canAccessSupportThread,
  canManageSupportThread,
  getSupportThreadById,
  listParticipantUserIds,
  replaceSupportThreadParticipants,
} from '@/lib/support';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await context.params;
    const session = await auth();
    const authUserId = session?.user?.id;
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const superAdmin = await isSuperAdmin();
    const appUser = await getCurrentUser();
    const thread = await getSupportThreadById(threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const can = await canAccessSupportThread(thread, {
      isSuperAdmin: superAdmin,
      appUser,
      authUserId,
    });
    if (!can) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userIds = await listParticipantUserIds(threadId);
    return NextResponse.json({ userIds });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load participants' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await context.params;
    const session = await auth();
    const authUserId = session?.user?.id;
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const superAdmin = await isSuperAdmin();
    const appUser = await getCurrentUser();
    const thread = await getSupportThreadById(threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const can = await canManageSupportThread(thread, { isSuperAdmin: superAdmin, appUser });
    if (!can) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const userIds = Array.isArray(body.userIds)
      ? body.userIds.filter((x: unknown) => typeof x === 'string')
      : [];

    await replaceSupportThreadParticipants(threadId, userIds);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update participants' },
      { status: 500 }
    );
  }
}
