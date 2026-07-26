import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireSuperAdminOrSupportAgentAuthorizations, isSuperAdmin } from '@/lib/permissions';
import { getCompanyById } from '@/lib/companies';
import { loadAuthorizationsBundleProjects, bundleExtensionToSource } from '@/lib/company-authorizations-bundle';
import { computeGithubStatusFromSource } from '@/lib/project-github-status-data';

export const dynamic = 'force-dynamic';

type ExtensionSourcePayload = {
  owner: string;
  repo: string;
  ref: string;
  deploymentVisibleFrom: string | null;
} | null;

/**
 * GET /api/admin/companies/[companyId]/authorizations-data
 * Super admin only. One Postgres RPC (or 3 batched queries) for relational data; GitHub fetches run in parallel.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { companyId } = await context.params;
    const company = await getCompanyById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    try {
      await requireSuperAdminOrSupportAgentAuthorizations(companyId);
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await loadAuthorizationsBundleProjects(companyId);
    const superAdmin = await isSuperAdmin();

    const githubStatuses = await Promise.all(
      rows.map((row) =>
        computeGithubStatusFromSource(bundleExtensionToSource(row.id, row.extensionSource), true)
      )
    );

    const projectsPayload = rows.map((row, i) => {
      const extensionSource: ExtensionSourcePayload = row.extensionSource;
      return {
        id: row.id,
        title: row.title,
        companyId: row.companyId,
        accessOverride: row.accessOverride,
        deviceLimit: row.deviceLimit,
        features: row.features ?? null,
        devices: superAdmin
          ? row.devices
          : row.devices.filter((d) => !d.isAdminDevice),
        extensionSource,
        githubStatus: githubStatuses[i],
      };
    });

    return NextResponse.json({
      companyId,
      companyName: company.name,
      projects: projectsPayload,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load authorizations data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
