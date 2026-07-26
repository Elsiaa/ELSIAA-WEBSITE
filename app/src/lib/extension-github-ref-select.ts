/**
 * GitHub extension source ref can be a branch (tracks tip) or a full commit SHA (pinned).
 * Admin UI maps DB value ↔ Select value consistently.
 */

export function resolveExtensionRefSelectValue(
  currentRef: string | null | undefined,
  defaultBranch: string,
  commits: Array<{ sha: string }>
): string {
  const br = defaultBranch || 'main';
  if (!currentRef) return br;

  if (currentRef === br) return br;

  const exactCommit = commits.find((c) => c.sha === currentRef);
  if (exactCommit) return exactCommit.sha;

  const isLikelyShortSha = /^[0-9a-f]{7,39}$/i.test(currentRef) && currentRef.length < 40;
  if (isLikelyShortSha) {
    const byPrefix = commits.find((c) => c.sha.startsWith(currentRef));
    if (byPrefix) return byPrefix.sha;
  }

  return currentRef;
}
