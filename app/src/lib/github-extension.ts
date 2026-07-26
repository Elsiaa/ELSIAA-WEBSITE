/**
 * Fetch file contents from the extension GitHub repo.
 * Public repo: no token needed. Private repo: set GITHUB_TOKEN in env.
 */
const OWNER = process.env.GITHUB_EXTENSION_REPO_OWNER ?? 'vercatryx';
const REPO = process.env.GITHUB_EXTENSION_REPO_NAME ?? 'Concurance-Fixer';
const REF = process.env.GITHUB_EXTENSION_REPO_REF ?? 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export function isGitHubExtensionConfigured(): boolean {
  return true; // fixed open repo
}

/**
 * Fetches a single file from the extension repo. Public repo = no token required.
 */
export async function fetchExtensionRepoFile(path: string): Promise<string> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(REF)}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.raw',
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers, cache: 'no-store' });

  if (!res.ok) {
    if (res.status === 404) {
      const hints: string[] = [];
      if (!GITHUB_TOKEN) hints.push('Private repo? Set GITHUB_TOKEN in env.');
      hints.push(`Check branch (we use ref=${REF}); set GITHUB_EXTENSION_REPO_REF if your default is not main.`);
      throw new Error(`File not found: ${path}. ${hints.join(' ')}`);
    }
    if (res.status === 401 && !GITHUB_TOKEN) {
      throw new Error('GitHub returned 401. For a private repo, set GITHUB_TOKEN in env.');
    }
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.text();
}

/** GitHub Contents API item for a file or dir */
export interface RepoContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
}

/**
 * Lists files and folders at a path in the extension repo (e.g. "" for root, "scripts" for scripts/).
 */
export async function listExtensionRepoPath(path: string): Promise<RepoContentItem[]> {
  const pathSegment = path ? `${path}/` : '';
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${pathSegment}?ref=${encodeURIComponent(REF)}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers, cache: 'no-store' });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Path not found: ${path || '/'}`);
    }
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as RepoContentItem[];
  return Array.isArray(data) ? data : [];
}

/**
 * Call GitHub API for repo root and return status + message. Use to debug token permissions.
 */
export async function checkGitHubRepoAccess(): Promise<{
  status: number;
  ok: boolean;
  message: string;
  tokenPresent: boolean;
}> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents?ref=${encodeURIComponent(REF)}`;
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers, cache: 'no-store' });
  let message: string;

  if (res.ok) {
    const data = await res.json();
    const count = Array.isArray(data) ? data.length : 0;
    message = `OK: ${count} item(s) at root`;
  } else {
    const body = await res.text();
    let parsed: { message?: string } = {};
    try {
      parsed = JSON.parse(body) as { message?: string };
    } catch {
      parsed = { message: body.slice(0, 200) };
    }
    message = parsed.message ?? body.slice(0, 200) ?? `HTTP ${res.status}`;
  }

  return {
    status: res.status,
    ok: res.ok,
    message,
    tokenPresent: Boolean(GITHUB_TOKEN),
  };
}
