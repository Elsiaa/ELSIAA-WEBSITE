import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/permissions';
import { getUserById, updateUser } from '@/lib/users';
import { replaceGrantsForUser, getGrantsForUser, type SupportAgentGrantInput } from '@/lib/support-agent-grants';
import { isPlatformSupportAgent } from '@/lib/platform-role';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { userId } = await context.params;
    const target = await getUserById(userId);
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!isPlatformSupportAgent(target.platform_role)) {
      return NextResponse.json({ error: 'User is not a support agent' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const grantsRaw = body.grants;
    const demote = body.demote === true;

    if (demote) {
      await replaceGrantsForUser(userId, []);
      await updateUser(userId, { platform_role: 'none' });
      return NextResponse.json({ success: true, demoted: true });
    }

    if (!Array.isArray(grantsRaw)) {
      return NextResponse.json({ error: 'grants array is required' }, { status: 400 });
    }

    const grants: SupportAgentGrantInput[] = [];
    for (const g of grantsRaw) {
      if (!g || typeof g.company_id !== 'string') continue;
      grants.push({
        company_id: g.company_id,
        support_allowed: Boolean(g.support_allowed),
        authorizations_allowed: Boolean(g.authorizations_allowed),
        program_logs_allowed: Boolean(g.program_logs_allowed),
        files_allowed: Boolean(g.files_allowed),
      });
    }

    const effective = grants.filter(
      (g) =>
        g.support_allowed ||
        g.authorizations_allowed ||
        g.program_logs_allowed ||
        g.files_allowed
    );
    if (effective.length === 0) {
      return NextResponse.json(
        {
          error:
            'At least one company grant is required (support, authorizations, program logs, and/or files), or use demote: true to remove access',
        },
        { status: 400 }
      );
    }

    await replaceGrantsForUser(userId, effective);

    const grantsOut = await getGrantsForUser(userId);
    const user = await getUserById(userId);
    return NextResponse.json({ user, grants: grantsOut });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    if (msg.includes('Forbidden')) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
