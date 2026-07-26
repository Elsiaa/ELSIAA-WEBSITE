import { NextRequest, NextResponse } from 'next/server';
import { verifyExtensionToken, getExtensionTokenFromRequest } from '@/lib/extension-auth';
import { checkGitHubRepoAccess } from '@/lib/github-extension';

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
 * GET /api/extension/github-check
 * Calls GitHub API for repo root and returns status + message. Use to debug token permissions.
 */
export async function GET(request: NextRequest) {
  const token = getExtensionTokenFromRequest(request);
  if (!verifyExtensionToken(token)) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401, headers: extensionCorsHeaders() }
    );
  }

  try {
    const result = await checkGitHubRepoAccess();
    return NextResponse.json(result, { headers: extensionCorsHeaders() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Check failed';
    return NextResponse.json(
      { status: 0, ok: false, message, tokenPresent: Boolean(process.env.GITHUB_TOKEN) },
      { headers: extensionCorsHeaders() }
    );
  }
}
