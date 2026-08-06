import { getServerSupabaseClient } from "./supabase";
import { fetchRepoDefaultBranch } from "./github-dynamic-repo";

export interface ProjectExtensionSource {
  projectId: string;
  githubOwner: string;
  githubRepo: string;
  githubRef: string;
  /** YYYY-MM-DD (UTC). Company admins only see commits on or after this date; null = no filter. */
  deploymentVisibleFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

type Row = {
  project_id: string;
  github_owner: string;
  github_repo: string;
  github_ref: string;
  deployment_visible_from: string | null;
  created_at: string;
  updated_at: string;
};

function rowToSource(row: Row): ProjectExtensionSource {
  return {
    projectId: row.project_id,
    githubOwner: row.github_owner,
    githubRepo: row.github_repo,
    githubRef: row.github_ref,
    deploymentVisibleFrom: row.deployment_visible_from ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getExtensionSource(
  projectId: string,
): Promise<ProjectExtensionSource | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_extension_sources")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToSource(data as Row);
}

/** One query for many projects (fallback when RPC is unavailable). */
export async function getExtensionSourcesByProjectIds(
  projectIds: string[],
): Promise<Record<string, ProjectExtensionSource>> {
  if (projectIds.length === 0) return {};
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_extension_sources")
    .select("*")
    .in("project_id", projectIds);

  if (error) {
    console.error("Error batch-fetching extension sources:", error);
    return {};
  }

  const out: Record<string, ProjectExtensionSource> = {};
  for (const r of data || []) {
    const src = rowToSource(r as Row);
    out[src.projectId] = src;
  }
  return out;
}

export async function upsertExtensionSource(params: {
  projectId: string;
  githubOwner: string;
  githubRepo: string;
  githubRef: string;
}): Promise<ProjectExtensionSource | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_extension_sources")
    .upsert(
      {
        project_id: params.projectId,
        github_owner: params.githubOwner,
        github_repo: params.githubRepo,
        github_ref: params.githubRef,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" },
    )
    .select()
    .single();

  if (error) {
    console.error("upsertExtensionSource:", error);
    return null;
  }
  return rowToSource(data as Row);
}

/** Extension API key `=dev` mode: serve default-branch HEAD instead of the saved github_ref. */
export async function extensionSourceForDevMode(
  source: ProjectExtensionSource,
): Promise<ProjectExtensionSource> {
  const defaultBranch = await fetchRepoDefaultBranch(source.githubOwner, source.githubRepo);
  const ref = defaultBranch ?? "main";
  if (ref === source.githubRef) return source;
  return { ...source, githubRef: ref };
}

export async function deleteExtensionSource(projectId: string): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from("project_extension_sources")
    .delete()
    .eq("project_id", projectId);

  if (error) {
    console.error("deleteExtensionSource:", error);
    return false;
  }
  return true;
}

/**
 * Super admin: set/clear deployment cutoff (YYYY-MM-DD or null). Row must exist.
 */
export async function updateExtensionDeploymentVisibleFrom(
  projectId: string,
  deploymentVisibleFrom: string | null,
): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from("project_extension_sources")
    .update({
      deployment_visible_from: deploymentVisibleFrom,
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId);

  if (error) {
    console.error("updateExtensionDeploymentVisibleFrom:", error);
    return false;
  }
  return true;
}
