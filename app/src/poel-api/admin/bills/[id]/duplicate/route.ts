import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin as checkSuperAdmin } from '@/lib/permissions';
import { duplicateBillAsDraft } from '@/lib/bills';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const clerkUserId = session?.user?.id;
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const bill = await duplicateBillAsDraft(id, clerkUserId);
    return NextResponse.json({ bill }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to duplicate';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
