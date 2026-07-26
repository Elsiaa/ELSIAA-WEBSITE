import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canAccessProjectProgramLogs } from '@/lib/permissions';
import { getProjectById } from '@/lib/projects';
import { deleteProjectProgramLog } from '@/lib/project-program-logs';

/**
 * DELETE /api/projects/[id]/program-logs/[logId]
 * Remove one log row. Super admin, company admin, or support agent with program_logs grant.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, logId } = await context.params;
    if (!logId) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!(await canAccessProjectProgramLogs(project.companyId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const removed = await deleteProjectProgramLog(projectId, logId);
    if (!removed) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to delete log';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
