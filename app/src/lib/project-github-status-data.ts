import type { ProjectExtensionSource } from '@/lib/project-extension-sources';
import { getExtensionSource } from '@/lib/project-extension-sources';
import {
  fetchLatestCommitDate,
  fetchRecentCommits,
  fetchRepoDefaultBranch,
  GITHUB_STATUS_COMMIT_LIMIT,
  type GithubCommitRow,
} from '@/lib/github-dynamic-repo';
import {
  commitVisibleToCompanyAdmins,
  deploymentCutoffUtc,
} from '@/lib/extension-commit-visibility';

export type GithubStatusCommit = {
  sha: string;
  message: string;
  date: string;
  beforeDeploymentCutoff?: boolean;
};

export type GithubStatusJson = {
  hasGithubUrl: boolean;
  latestPushDate: string | null;
  currentRef: string | null;
  /** Repo default branch; saved ref = this value means extension tracks latest on that branch. */
  defaultBranch: string | null;
  deploymentVisibleFrom: string | null;
  commits: GithubStatusCommit[];
  /** More commits exist on GitHub beyond the loaded raw page (use github-commits API to load). */
  hasMoreCommits: boolean;
  /** Raw commits fetched from GitHub so far (pass as offset when loading more). */
  commitRawOffset: number;
};

function filterCommitsForViewer(
  rawCommits: GithubCommitRow[],
  source: ProjectExtensionSource,
  viewerIsSuperAdmin: boolean,
  options?: { ensureRefVisible?: string | null }
): GithubStatusCommit[] {
  const cutoff = deploymentCutoffUtc(source.deploymentVisibleFrom);

  if (viewerIsSuperAdmin) {
    return rawCommits.map((c) => ({
      ...c,
      beforeDeploymentCutoff: cutoff ? !commitVisibleToCompanyAdmins(c.date, cutoff) : false,
    }));
  }

  const visible = rawCommits.filter((c) => commitVisibleToCompanyAdmins(c.date, cutoff));
  const ref = options?.ensureRefVisible ?? source.githubRef;
  const current = rawCommits.find(
    (c) => c.sha === ref || (ref && ref.length < 40 && c.sha.startsWith(ref))
  );
  if (current && !visible.some((c) => c.sha === current.sha)) {
    return [current, ...visible];
  }
  return visible;
}

/**
 * Build GitHub status + commit list for an extension source row (no extra DB read).
 */
export async function computeGithubStatusFromSource(
  source: ProjectExtensionSource | null,
  viewerIsSuperAdmin: boolean
): Promise<GithubStatusJson> {
  if (!source) {
    return {
      hasGithubUrl: false,
      latestPushDate: null,
      currentRef: null,
      defaultBranch: null,
      deploymentVisibleFrom: null,
      commits: [],
      hasMoreCommits: false,
      commitRawOffset: 0,
    };
  }

  const defaultBranch =
    (await fetchRepoDefaultBranch(source.githubOwner, source.githubRepo)) ?? 'main';

  const [latestDate, { commits: rawCommits, hasMore: hasMoreCommits }] = await Promise.all([
    fetchLatestCommitDate(source.githubOwner, source.githubRepo, source.githubRef),
    fetchRecentCommits(
      source.githubOwner,
      source.githubRepo,
      GITHUB_STATUS_COMMIT_LIMIT,
      defaultBranch,
      0
    ),
  ]);

  const commits = filterCommitsForViewer(rawCommits, source, viewerIsSuperAdmin, {
    ensureRefVisible: source.githubRef,
  });

  return {
    hasGithubUrl: true,
    latestPushDate: latestDate,
    currentRef: source.githubRef,
    defaultBranch,
    deploymentVisibleFrom: viewerIsSuperAdmin ? source.deploymentVisibleFrom : null,
    commits,
    hasMoreCommits,
    commitRawOffset: rawCommits.length,
  };
}

/**
 * Paginated commit list for software-version dropdown "load more".
 */
export async function getGithubCommitsPage(
  projectId: string,
  viewerIsSuperAdmin: boolean,
  offset: number,
  limit: number = GITHUB_STATUS_COMMIT_LIMIT
): Promise<{ commits: GithubStatusCommit[]; hasMore: boolean; rawCount: number }> {
  const source = await getExtensionSource(projectId);
  if (!source) {
    return { commits: [], hasMore: false, rawCount: 0 };
  }

  const defaultBranch =
    (await fetchRepoDefaultBranch(source.githubOwner, source.githubRepo)) ?? 'main';

  const { commits: rawCommits, hasMore } = await fetchRecentCommits(
    source.githubOwner,
    source.githubRepo,
    limit,
    defaultBranch,
    offset
  );

  const commits = filterCommitsForViewer(rawCommits, source, viewerIsSuperAdmin);
  return { commits, hasMore, rawCount: rawCommits.length };
}

export async function getGithubStatusForProject(
  projectId: string,
  viewerIsSuperAdmin: boolean
): Promise<GithubStatusJson> {
  const source = await getExtensionSource(projectId);
  return computeGithubStatusFromSource(source, viewerIsSuperAdmin);
}
