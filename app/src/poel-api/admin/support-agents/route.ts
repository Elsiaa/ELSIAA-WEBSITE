import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/permissions';
import { getServerSupabaseClient } from '@/lib/supabase';
import { getUserByEmail, createUser, updateUser } from '@/lib/users';
import { getCompanyById } from '@/lib/companies';
import { sendInvitationEmail } from '@/lib/invitations-server';
import { getNextAuthUserIdForEmail } from '@/lib/next-auth-user-lookup';
import { getGrantsForUser, replaceGrantsForUser, type SupportAgentGrantInput } from '@/lib/support-agent-grants';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireSuperAdmin();
    const supabase = getServerSupabaseClient();
    const { data: agents, error } = await supabase
      .from('users')
      .select(`*, company:companies(*)`)
      .eq('platform_role', 'support_agent')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('list support agents', error);
      return NextResponse.json({ error: 'Failed to list support agents' }, { status: 500 });
    }

    const list = agents || [];
    const withGrants = await Promise.all(
      list.map(async (u) => ({
        user: u,
        grants: await getGrantsForUser(u.id),
      }))
    );

    return NextResponse.json({ agents: withGrants });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    if (msg.includes('Forbidden')) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const first_name = typeof body.first_name === 'string' ? body.first_name.trim() || null : null;
    const last_name = typeof body.last_name === 'string' ? body.last_name.trim() || null : null;
    const grantsRaw = body.grants;

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }
    if (!Array.isArray(grantsRaw) || grantsRaw.length === 0) {
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
        { error: 'At least one company grant (support, authorizations, program logs, and/or files) is required' },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists. Remove or convert them before creating a support agent.' },
        { status: 409 }
      );
    }

    const inviteContextCompanyId = effective[0].company_id;
    const existingAuthId = await getNextAuthUserIdForEmail(email);
    const userStatus = existingAuthId ? 'active' : 'pending';

    const user = await createUser({
      company_id: null,
      email,
      first_name,
      last_name,
      phone: null,
      role: 'member',
      status: userStatus,
      auth_user_id: existingAuthId,
      all_projects_access: false,
    });

    await replaceGrantsForUser(user.id, effective);

    const updated = await updateUser(user.id, { platform_role: 'support_agent' });
    if (!updated) {
      return NextResponse.json({ error: 'Failed to set support agent role' }, { status: 500 });
    }

    let invitationSent = false;
    if (!existingAuthId) {
      try {
        const company = await getCompanyById(inviteContextCompanyId);
        if (company) {
          invitationSent = await sendInvitationEmail({
            email: updated.email,
            firstName: updated.first_name || undefined,
            lastName: updated.last_name || undefined,
            companyName: company.name,
            companyId: company.id,
            inviterName: 'Vercatryx',
          });
        }
      } catch (emailError) {
        console.error('support agent invite', emailError);
      }
    }

    const grantsOut = await getGrantsForUser(updated.id);
    return NextResponse.json(
      { user: updated, grants: grantsOut, invitationSent },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    if (msg.includes('Forbidden')) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
