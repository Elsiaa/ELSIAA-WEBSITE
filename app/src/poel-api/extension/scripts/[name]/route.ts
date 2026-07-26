import { NextRequest, NextResponse } from 'next/server';
import { verifyExtensionToken, getExtensionTokenFromRequest } from '@/lib/extension-auth';
import { fetchExtensionRepoFile, isGitHubExtensionConfigured } from '@/lib/github-extension';

export const dynamic = 'force-dynamic';

/** Allow only script ids that look like safe filenames (no path traversal). */
const SCRIPT_NAME_REGEX = /^[a-z0-9-_]+$/i;

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
 * GET /api/extension/scripts/:name
 * Verify token, fetch scripts/:name.js from private GitHub repo, return as text/javascript.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const token = getExtensionTokenFromRequest(request);
  if (!verifyExtensionToken(token)) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401, headers: extensionCorsHeaders() }
    );
  }

  const { name } = await context.params;
  if (!name || !SCRIPT_NAME_REGEX.test(name)) {
    return NextResponse.json(
      { error: 'Invalid script name' },
      { status: 400, headers: extensionCorsHeaders() }
    );
  }

  if (!isGitHubExtensionConfigured()) {
    return NextResponse.json(
      { error: 'Extension repo not configured' },
      { status: 500, headers: extensionCorsHeaders() }
    );
  }

  try {
    const path = `scripts/${name}.js`;
    const content = await fetchExtensionRepoFile(path);
    return new NextResponse(content, {
      status: 200,
      headers: {
        ...extensionCorsHeaders(),
        'Content-Type': 'text/javascript',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch script';
    const isNotFound = message.includes('not found') || message.includes('404');
    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : 500, headers: extensionCorsHeaders() }
    );
  }
}
