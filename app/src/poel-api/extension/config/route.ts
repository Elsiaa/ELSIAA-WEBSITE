import { NextRequest, NextResponse } from 'next/server';
import { verifyExtensionToken, getExtensionTokenFromRequest } from '@/lib/extension-auth';
import { fetchExtensionRepoFile, isGitHubExtensionConfigured } from '@/lib/github-extension';

export const dynamic = 'force-dynamic';

const VALID_UNTIL_HOURS = 24;

function extensionCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: extensionCorsHeaders() });
}

/**
 * GET /api/extension/config
 * Verify user token, fetch config from private GitHub repo, return JSON with optional validUntil.
 * Extension calls this to get config and re-verify at least once per day.
 */
export async function GET(request: NextRequest) {
  const token = getExtensionTokenFromRequest(request);
  if (!verifyExtensionToken(token)) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401, headers: extensionCorsHeaders() }
    );
  }

  if (!isGitHubExtensionConfigured()) {
    return NextResponse.json(
      { error: 'Extension repo not configured' },
      { status: 500, headers: extensionCorsHeaders() }
    );
  }

  try {
    const raw = await fetchExtensionRepoFile('config.json');
    const config = JSON.parse(raw) as Record<string, unknown>;

    const validUntil = new Date(Date.now() + VALID_UNTIL_HOURS * 60 * 60 * 1000).toISOString();
    const body = { ...config, validUntil };

    return NextResponse.json(body, {
      headers: {
        ...extensionCorsHeaders(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch config';
    const isNotFound = message.includes('not found') || message.includes('404');
    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : 500, headers: extensionCorsHeaders() }
    );
  }
}
