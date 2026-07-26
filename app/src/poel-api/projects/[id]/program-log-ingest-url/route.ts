import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin } from '@/lib/permissions';
import { getProjectById } from '@/lib/projects';
import { getProgramLogIngestTokenForProject } from '@/lib/project-program-logs';

/**
 * GET /api/projects/[id]/program-log-ingest-url
 * Full webhook URL for super admins only (copy into external programs).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isSuperAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: projectId } = await context.params;
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const token = await getProgramLogIngestTokenForProject(projectId);
    if (!token) {
      return NextResponse.json({ error: 'Ingest token not configured' }, { status: 500 });
    }

    const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const vercel = process.env.VERCEL_URL?.trim();
    let base = explicit?.replace(/\/$/, '') ?? '';
    if (!base && vercel) {
      base = vercel.startsWith('http://') || vercel.startsWith('https://')
        ? vercel.replace(/\/$/, '')
        : `https://${vercel}`.replace(/\/$/, '');
    }

    if (!base) {
      base = request.nextUrl.origin.replace(/\/$/, '');
    }
    if (!base) {
      return NextResponse.json(
        {
          error:
            'Could not determine public origin for the ingest URL. Set NEXT_PUBLIC_APP_URL if needed.',
        },
        { status: 500 }
      );
    }
    const encToken = encodeURIComponent(token);
    const ingestUrl = `${base}/api/ingest/program-logs/${projectId}/${encToken}`;

    return NextResponse.json({ ingestUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to build ingest URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
