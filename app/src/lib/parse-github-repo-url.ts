/**
 * Parse https://github.com/owner/repo or https://github.com/owner/repo/tree/branch
 */
const GITHUB_REPO_REGEX =
  /^https?:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/tree\/([^/?#]+))?/;

export interface ParsedGitHubRepo {
  owner: string;
  repo: string;
  ref: string;
}

export function parseGitHubRepoUrl(url: string): ParsedGitHubRepo | null {
  const trimmed = url.trim();
  const m = trimmed.match(GITHUB_REPO_REGEX);
  if (!m) return null;
  const owner = m[1];
  const repo = m[2];
  const refFromTree = m[3];
  const ref = refFromTree ? decodeURIComponent(refFromTree.replace(/\/+$/, '')) : 'main';
  return { owner, repo, ref };
}
