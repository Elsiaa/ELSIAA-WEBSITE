import { NextRequest, NextResponse } from "next/server";
import { verifyExtensionToken, getExtensionTokenFromRequest } from "@/lib/extension-auth";
import { listExtensionRepoPath } from "@/lib/github-extension";

const REF = process.env.GITHUB_EXTENSION_REPO_REF ?? "main";
const OWNER = process.env.GITHUB_EXTENSION_REPO_OWNER ?? "vercatryx";
const REPO = process.env.GITHUB_EXTENSION_REPO_NAME ?? "Concurance-Fixer";

function extensionCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: extensionCorsHeaders() });
}

/**
 * GET /api/extension/repo-list
 * Returns directory listing of the extension repo (root and scripts/).
 * Same auth as config; useful to see what files exist.
 */
export async function GET(request: NextRequest) {
  const token = getExtensionTokenFromRequest(request);
  if (!verifyExtensionToken(token)) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401, headers: extensionCorsHeaders() },
    );
  }

  try {
    let root: { name: string; path: string; type: "file" | "dir" }[] = [];
    let scripts: { name: string; path: string; type: "file" | "dir" }[] = [];
    let rootError: string | null = null;

    try {
      root = await listExtensionRepoPath("");
    } catch (e) {
      rootError = e instanceof Error ? e.message : "Unknown error";
    }

    try {
      scripts = await listExtensionRepoPath("scripts");
    } catch {
      // scripts/ might not exist
    }

    return NextResponse.json(
      {
        repo: `${OWNER}/${REPO}`,
        ref: REF,
        root,
        scripts,
        ...(rootError && {
          note: `Root listing: ${rootError} (empty repo or wrong branch?). Try GITHUB_EXTENSION_REPO_REF=master if your default branch is not main.`,
        }),
      },
      { headers: extensionCorsHeaders() },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list repo";
    return NextResponse.json({ error: message }, { status: 500, headers: extensionCorsHeaders() });
  }
}
