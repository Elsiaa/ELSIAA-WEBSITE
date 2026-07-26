import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCurrentUser, isSuperAdmin } from '@/lib/permissions';
import {
  canAccessSupportThread,
  deleteOwnSupportMessage,
  getSupportThreadById,
} from '@/lib/support';

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id: threadId, messageId } = await context.params;
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

    const result = await deleteOwnSupportMessage(threadId, messageId, authUserId);
    if (result === 'not_found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (result === 'forbidden') {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete' },
      { status: 500 }
    );
  }
}
