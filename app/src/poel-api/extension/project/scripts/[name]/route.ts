import { NextRequest, NextResponse } from "next/server";
import { fetchRepoFile } from "@/lib/github-dynamic-repo";
import { resolveProjectExtensionAccess, isAccessError } from "@/lib/extension-project-access";
import { extensionGitHubFetchErrorResponse } from "@/lib/extension-github-fetch-error";

export const dynamic = "force-dynamic";

const SCRIPT_NAME_REGEX = /^[a-z0-9-_]+$/i;

function extensionCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, x-project-api-key",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: extensionCorsHeaders() });
}

/**
 * GET /api/extension/project/scripts/:name?deviceId=...
 * deviceId required except when project access is manually "allowed".
 */
export async function GET(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const access = await resolveProjectExtensionAccess(request);
  if (isAccessError(access)) {
    return NextResponse.json(access.body, {
      status: access.status,
      headers: extensionCorsHeaders(),
    });
  }

  const { source } = access;
  const { name } = await context.params;

  if (!name || !SCRIPT_NAME_REGEX.test(name)) {
    return NextResponse.json(
      { error: "Invalid script name" },
      { status: 400, headers: extensionCorsHeaders() },
    );
  }

  try {
    const path = `scripts/${name}.js`;
    const content = await fetchRepoFile(
      source.githubOwner,
      source.githubRepo,
      source.githubRef,
      path,
    );
    return new NextResponse(content, {
      status: 200,
      headers: {
        ...extensionCorsHeaders(),
        "Content-Type": "text/javascript",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return extensionGitHubFetchErrorResponse(err, extensionCorsHeaders(), "Failed to fetch script");
  }
}
