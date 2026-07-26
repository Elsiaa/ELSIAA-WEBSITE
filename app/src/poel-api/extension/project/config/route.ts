import { NextRequest, NextResponse } from 'next/server';
import { fetchRepoFile } from '@/lib/github-dynamic-repo';
import { resolveProjectExtensionAccess, isAccessError } from '@/lib/extension-project-access';
import { extensionGitHubFetchErrorResponse } from '@/lib/extension-github-fetch-error';
import { resolveAppFeaturesForProjectRequest } from '@/lib/resolve-request-app-features';

export const dynamic = 'force-dynamic';

const VALID_UNTIL_HOURS = 24;

function extensionCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers':
      'Authorization, Content-Type, x-project-api-key, x-device-id',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: extensionCorsHeaders() });
}

/**
 * GET /api/extension/project/config?deviceId=...
 * Project API key + entitlement + per-project GitHub repo.
 * deviceId is required unless the project has manual access set to "allowed" (subscriptions tab); then device approval is skipped.
 */
export async function GET(request: NextRequest) {
  const access = await resolveProjectExtensionAccess(request);
  if (isAccessError(access)) {
    return NextResponse.json(access.body, { status: access.status, headers: extensionCorsHeaders() });
  }

  const { source, project } = access;

  try {
    const raw = await fetchRepoFile(source.githubOwner, source.githubRepo, source.githubRef, 'config.json');
    const config = JSON.parse(raw) as Record<string, unknown>;
    const validUntil = new Date(Date.now() + VALID_UNTIL_HOURS * 60 * 60 * 1000).toISOString();
    const features = await resolveAppFeaturesForProjectRequest(project, request);
    // Server-controlled features always win over anything in GitHub config.json.
    const body = { ...config, validUntil, features };
    return NextResponse.json(body, {
      headers: {
        ...extensionCorsHeaders(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return extensionGitHubFetchErrorResponse(err, extensionCorsHeaders(), 'Failed to fetch config');
  }
}
