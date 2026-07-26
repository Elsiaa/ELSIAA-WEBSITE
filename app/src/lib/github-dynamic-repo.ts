/**
 * Fetch files and metadata from arbitrary GitHub repos (owner/repo/ref).
 * Uses GITHUB_TOKEN when set (required for private repos).
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/** Per-instance backoff after GitHub rate limit (avoids hammering API on every cache miss). */
let githubRateLimitUntilMs = 0;

/** Default commit count for admin GitHub status dropdowns. Pass 0 to fetch all pages. */
export const GITHUB_STATUS_COMMIT_LIMIT = 50;

export class GitHubRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds = 3600) {
    super(message);
    this.name = 'GitHubRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function isGitHubRateLimitError(err: unknown): err is GitHubRateLimitError {
  return err instanceof GitHubRateLimitError;
}

function githubAuthHeaders(accept: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'Vercatryx-App',
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  return headers;
}

function parseGitHubRetryAfter(res: Response): number {
  const reset = res.headers.get('x-ratelimit-reset');
  if (reset) {
    const secondsUntilReset = parseInt(reset, 10) - Math.floor(Date.now() / 1000);
    if (secondsUntilReset > 0) return Math.min(secondsUntilReset, 3600);
  }
  const retryAfter = res.headers.get('retry-after');
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!Number.isNaN(seconds) && seconds > 0) return seconds;
  }
  return 3600;
}

function noteGitHubRateLimit(retryAfterSeconds: number): void {
  const until = Date.now() + retryAfterSeconds * 1000;
  if (until > githubRateLimitUntilMs) {
    githubRateLimitUntilMs = until;
  }
}

function throwIfGitHubRateLimited(): void {
  const remainingMs = githubRateLimitUntilMs - Date.now();
  if (remainingMs > 0) {
    throw new GitHubRateLimitError(
      'GitHub API rate limit exceeded (retry later)',
      Math.ceil(remainingMs / 1000)
    );
  }
}

function noteRateLimitFromResponse(res: Response): void {
  if (res.headers.get('x-ratelimit-remaining') === '0') {
    noteGitHubRateLimit(parseGitHubRetryAfter(res));
  }
}

function throwGitHubApiError(res: Response, text: string, path?: string): never {
  if (res.status === 403 && /rate limit/i.test(text)) {
    const retryAfterSeconds = parseGitHubRetryAfter(res);
    noteGitHubRateLimit(retryAfterSeconds);
    throw new GitHubRateLimitError(
      `GitHub API rate limit exceeded: ${text.slice(0, 200)}`,
      retryAfterSeconds
    );
  }
  if (res.status === 404 && path) {
    const hint = !GITHUB_TOKEN ? ' Private repo? Set GITHUB_TOKEN.' : '';
    throw new Error(`File not found: ${path}.${hint}`);
  }
  throw new Error(`GitHub API error ${res.status}: ${text.slice(0, 200)}`);
}

/** Fetch a single repo file (always fresh — used by external extension API). */
export async function fetchRepoFile(
  owner: string,
  repo: string,
  ref: string,
  path: string
): Promise<string> {
  throwIfGitHubRateLimited();

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`;
  const res = await fetch(url, {
    headers: githubAuthHeaders('application/vnd.github.raw'),
    cache: 'no-store',
  });
  noteRateLimitFromResponse(res);

  if (!res.ok) {
    const text = await res.text();
    throwGitHubApiError(res, text, path);
  }

  return res.text();
}

/**
 * Fetch the latest commit date from an arbitrary GitHub repo (owner/repo/ref).
 * Uses GITHUB_TOKEN when set (required for private repos).
 */
export async function fetchLatestCommitDate(
  owner: string,
  repo: string,
  ref: string
): Promise<string | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(ref)}&per_page=1`;

  try {
    throwIfGitHubRateLimited();
    const res = await fetch(url, { headers: githubAuthHeaders('application/vnd.github.v3+json'), cache: 'no-store' });
    noteRateLimitFromResponse(res);
    if (!res.ok) return null;

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0].commit?.committer?.date || data[0].commit?.author?.date || null;
    }
    return null;
  } catch (error) {
    if (isGitHubRateLimitError(error)) throw error;
    console.error('Error fetching latest commit date:', error);
    return null;
  }
}

/**
 * Default branch name for a repo (e.g. main). Used for "latest" extension ref + commit list.
 */
export async function fetchRepoDefaultBranch(owner: string, repo: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    throwIfGitHubRateLimited();
    const res = await fetch(url, { headers: githubAuthHeaders('application/vnd.github.v3+json'), cache: 'no-store' });
    noteRateLimitFromResponse(res);
    if (!res.ok) return null;
    const data = (await res.json()) as { default_branch?: string };
    return typeof data.default_branch === 'string' && data.default_branch ? data.default_branch : null;
  } catch (error) {
    if (isGitHubRateLimitError(error)) throw error;
    console.error('Error fetching repo default branch:', error);
    return null;
  }
}

function mapCommitRow(item: {
  sha?: string;
  commit?: { message?: string; committer?: { date?: string }; author?: { date?: string } };
}): { sha: string; message: string; date: string } {
  return {
    sha: item.sha ?? '',
    message: item.commit?.message?.split('\n')[0] || '',
    date: item.commit?.committer?.date || item.commit?.author?.date || '',
  };
}

/**
 * Fetch commits from an arbitrary GitHub repo (paginated).
 * Uses GITHUB_TOKEN when set.
 * @param limit Max commits to return (default 50). Pass 0 to fetch all pages (100 commits per GitHub request).
 * @param branchOrSha - When set, lists commits reachable from this ref (e.g. default branch).
 */
export type GithubCommitRow = { sha: string; message: string; date: string };

export type FetchRecentCommitsResult = {
  commits: GithubCommitRow[];
  hasMore: boolean;
};

export async function fetchRecentCommits(
  owner: string,
  repo: string,
  limit: number = GITHUB_STATUS_COMMIT_LIMIT,
  branchOrSha?: string,
  offset: number = 0
): Promise<FetchRecentCommitsResult> {
  const shaParam = branchOrSha ? `&sha=${encodeURIComponent(branchOrSha)}` : '';
  const fetchAll = limit === 0;
  const perPage = 100;
  const safeOffset = Math.max(0, offset);
  const targetCount = fetchAll ? Number.POSITIVE_INFINITY : safeOffset + limit + 1;

  const commits: GithubCommitRow[] = [];

  try {
    throwIfGitHubRateLimited();
    let page = 1;
    while (commits.length < targetCount) {
      const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}${shaParam}`;
      const res = await fetch(url, {
        headers: githubAuthHeaders('application/vnd.github.v3+json'),
        cache: 'no-store',
      });
      noteRateLimitFromResponse(res);
      if (!res.ok) break;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;

      for (const item of data) {
        commits.push(mapCommitRow(item));
        if (!fetchAll && commits.length >= targetCount) break;
      }

      if (!fetchAll && commits.length >= targetCount) break;
      if (data.length < perPage) break;
      page += 1;
    }
  } catch (error) {
    if (isGitHubRateLimitError(error)) throw error;
    console.error('Error fetching recent commits:', error);
  }

  if (fetchAll) {
    return { commits: commits.slice(safeOffset), hasMore: false };
  }

  const pageCommits = commits.slice(safeOffset, safeOffset + limit);
  const hasMore = commits.length > safeOffset + limit;
  return { commits: pageCommits, hasMore };
}
