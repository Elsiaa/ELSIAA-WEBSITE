import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCurrentUser, isSuperAdmin } from '@/lib/permissions';
import { supportAgentHasCompanyGrant } from '@/lib/support-agent-grants';
import { isPlatformSupportAgent } from '@/lib/platform-role';
import { companyUserHasModule } from '@/lib/company-user-modules';
import {
  createSupportThread,
  defaultParticipantIdsForCompany,
  listSupportThreadsForCompany,
  listSupportThreadsForParticipant,
} from '@/lib/support';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const superAdmin = await isSuperAdmin();
    const appUser = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get('companyId');

    if (superAdmin) {
      if (!companyIdParam) {
        return NextResponse.json({ error: 'companyId required' }, { status: 400 });
      }
      const threads = await listSupportThreadsForCompany(companyIdParam);
      return NextResponse.json({ threads });
    }

    if (
      appUser &&
      isPlatformSupportAgent(appUser.platform_role) &&
      companyIdParam &&
      (await supportAgentHasCompanyGrant(appUser.id, companyIdParam, 'support'))
    ) {
      const threads = await listSupportThreadsForCompany(companyIdParam);
      return NextResponse.json({ threads });
    }

    if (appUser && companyUserHasModule(appUser, 'support') && appUser.company_id) {
      const threads = await listSupportThreadsForCompany(appUser.company_id);
      return NextResponse.json({ threads });
    }

    if (appUser) {
      const threads = await listSupportThreadsForParticipant(appUser.id);
      return NextResponse.json({ threads });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to list threads' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const superAdmin = await isSuperAdmin();
    const appUser = await getCurrentUser();

    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    let companyId = typeof body.companyId === 'string' ? body.companyId : '';
    const participantUserIdsRaw = body.participantUserIds;

    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }

    if (superAdmin) {
      if (!companyId) {
        return NextResponse.json({ error: 'companyId required' }, { status: 400 });
      }
    } else if (appUser && companyUserHasModule(appUser, 'support')) {
      if (!appUser.company_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      companyId = appUser.company_id;
    } else if (
      appUser &&
      isPlatformSupportAgent(appUser.platform_role) &&
      companyId &&
      (await supportAgentHasCompanyGrant(appUser.id, companyId, 'support'))
    ) {
      // support agent: companyId must be present in JSON and allowed
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let participantUserIds: string[];
    if (Array.isArray(participantUserIdsRaw) && participantUserIdsRaw.length > 0) {
      participantUserIds = participantUserIdsRaw.filter((x: unknown) => typeof x === 'string');
    } else {
      participantUserIds = await defaultParticipantIdsForCompany(companyId);
    }

    const thread = await createSupportThread({
      companyId,
      title,
      createdByAuthUserId: authUserId,
      participantUserIds,
    });

    return NextResponse.json({ thread }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create thread' },
      { status: 500 }
    );
  }
}
