import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin as checkSuperAdmin } from '@/lib/permissions';
import { getCompanyProjects, getProjectById } from '@/lib/projects';
import { getUserByAuthUserId } from '@/lib/users';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await context.params;

    const superuser = await checkSuperAdmin();

    let project;

    if (superuser) {
      project = await getProjectById(projectId);
    } else {
      const dbUser = await getUserByAuthUserId(authUserId);

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (!dbUser.company_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const companyProjects = await getCompanyProjects(dbUser.company_id);
      project = companyProjects.find((p) => p.id === projectId);
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ url: project.url });
  } catch (error) {
    console.error('Error in project proxy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
