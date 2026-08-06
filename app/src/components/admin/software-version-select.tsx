"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/components/ui/utils";
import { resolveExtensionRefSelectValue } from "@/lib/extension-github-ref-select";
import { GITHUB_STATUS_COMMIT_LIMIT } from "@/lib/github-dynamic-repo";

export type SoftwareVersionCommit = {
  sha: string;
  message: string;
  date: string;
  beforeDeploymentCutoff?: boolean;
};

type SoftwareVersionSelectProps = {
  projectId: string;
  defaultBranch: string;
  currentRef?: string | null;
  commits: SoftwareVersionCommit[];
  hasMoreCommits: boolean;
  commitRawOffset: number;
  selectedRef: string;
  onSelectedRefChange: (value: string) => void;
  onCommitsUpdate: (
    commits: SoftwareVersionCommit[],
    hasMoreCommits: boolean,
    commitRawOffset: number,
  ) => void;
  disabled?: boolean;
  formatDate: (dateStr: string) => string;
};

function mergeCommitsBySha(
  existing: SoftwareVersionCommit[],
  incoming: SoftwareVersionCommit[],
): SoftwareVersionCommit[] {
  const seen = new Set(existing.map((c) => c.sha));
  const merged = [...existing];
  for (const c of incoming) {
    if (!seen.has(c.sha)) {
      seen.add(c.sha);
      merged.push(c);
    }
  }
  return merged;
}

export function SoftwareVersionSelect({
  projectId,
  defaultBranch,
  currentRef,
  commits,
  hasMoreCommits,
  commitRawOffset,
  selectedRef,
  onSelectedRefChange,
  onCommitsUpdate,
  disabled,
  formatDate,
}: SoftwareVersionSelectProps) {
  const [loadingMore, setLoadingMore] = useState(false);

  const selectValue =
    selectedRef || resolveExtensionRefSelectValue(currentRef ?? null, defaultBranch, commits);
  const valueInCommits = commits.some((c) => c.sha === selectValue);
  const showOrphanRef = selectValue !== defaultBranch && !valueInCommits;

  const loadMore = async () => {
    if (loadingMore || !hasMoreCommits) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/github-commits?offset=${commitRawOffset}&limit=${GITHUB_STATUS_COMMIT_LIMIT}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        commits?: SoftwareVersionCommit[];
        hasMore?: boolean;
        rawCount?: number;
      };
      const next = data.commits ?? [];
      const rawCount =
        typeof data.rawCount === "number" ? data.rawCount : GITHUB_STATUS_COMMIT_LIMIT;
      onCommitsUpdate(
        mergeCommitsBySha(commits, next),
        Boolean(data.hasMore),
        commitRawOffset + rawCount,
      );
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Select disabled={disabled} value={selectValue} onValueChange={onSelectedRefChange}>
      <SelectTrigger className="h-7 text-xs w-full min-w-[14rem] max-w-[min(90vw,42rem)]">
        <SelectValue placeholder="Select version" />
      </SelectTrigger>
      <SelectContent className="max-h-96 max-w-[min(90vw,56rem)]">
        <SelectItem value={defaultBranch} className="text-xs font-medium">
          Latest version (auto-updates)
        </SelectItem>
        {showOrphanRef ? (
          <SelectItem value={selectValue} className="text-xs">
            Git ref: {selectValue}
          </SelectItem>
        ) : null}
        {commits.map((commit) => (
          <SelectItem
            key={commit.sha}
            value={commit.sha}
            className={cn(
              "text-xs whitespace-normal break-words leading-snug py-2",
              commit.beforeDeploymentCutoff &&
                "text-amber-800 focus:text-amber-900 dark:text-amber-400 dark:focus:text-amber-300",
            )}
          >
            <span className="whitespace-normal break-words">
              {formatDate(commit.date)} — {commit.message}
            </span>
          </SelectItem>
        ))}
        {hasMoreCommits ? (
          <div
            className="sticky bottom-0 border-t border-border bg-popover p-1"
            onPointerDown={(e) => e.preventDefault()}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full text-xs"
              disabled={loadingMore}
              onClick={loadMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Loading…
                </>
              ) : (
                "Load more versions"
              )}
            </Button>
          </div>
        ) : null}
      </SelectContent>
    </Select>
  );
}
