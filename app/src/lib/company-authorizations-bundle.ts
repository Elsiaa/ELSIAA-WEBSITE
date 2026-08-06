import { getServerSupabaseClient } from "./supabase";
import { getCompanyProjects } from "./projects";
import { getAuthDevicesGroupedByProjectId } from "./project-auth-devices";
import { getExtensionSourcesByProjectIds } from "./project-extension-sources";
import type { ProjectExtensionSource } from "./project-extension-sources";
import type { AppFeatures } from "./app-features";
import { parseAppFeaturesPartial, normalizeAppFeatures } from "./app-features";

export type BundleExtensionSourcePayload = {
  owner: string;
  repo: string;
  ref: string;
  deploymentVisibleFrom: string | null;
} | null;

export type AuthorizationsBundleProject = {
  id: string;
  title: string;
  companyId: string;
  accessOverride: "allowed" | "blocked" | null;
  deviceLimit: number | null;
  features: AppFeatures | null;
  devices: Array<{
    id: string;
    name: string;
    deviceId: string;
    status: string;
    isAdminDevice: boolean;
    features: AppFeatures | null;
  }>;
  extensionSource: BundleExtensionSourcePayload;
};

function bundleFeatures(raw: unknown): AppFeatures | null {
  if (raw === null || raw === undefined) return null;
  const parsed = parseAppFeaturesPartial(raw);
  if (parsed === null) return null;
  const cleaned = normalizeAppFeatures(parsed);
  return Object.keys(cleaned).length === 0 ? null : cleaned;
}

export function bundleExtensionToSource(
  projectId: string,
  ext: BundleExtensionSourcePayload,
): ProjectExtensionSource | null {
  if (!ext) return null;
  return {
    projectId,
    githubOwner: ext.owner,
    githubRepo: ext.repo,
    githubRef: ext.ref,
    deploymentVisibleFrom: ext.deploymentVisibleFrom,
    createdAt: "",
    updatedAt: "",
  };
}

/**
 * Loads all projects for a company with devices + extension source in one DB round-trip (RPC),
 * or three batched queries if the migration is not applied yet.
 */
export async function loadAuthorizationsBundleProjects(
  companyId: string,
): Promise<AuthorizationsBundleProject[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_company_authorizations_bundle", {
    p_company_id: companyId,
  });

  if (!error && data != null && Array.isArray(data)) {
    return (
      data as Array<
        AuthorizationsBundleProject & {
          features?: unknown;
          devices?: Array<AuthorizationsBundleProject["devices"][number] & { features?: unknown }>;
        }
      >
    ).map((row) => ({
      ...row,
      features: bundleFeatures(row.features),
      devices: (row.devices || []).map((d) => ({
        ...d,
        features: bundleFeatures(d.features),
      })),
    }));
  }

  if (error) {
    console.warn("[authorizations-bundle] RPC unavailable, using batched queries:", error.message);
  }

  return loadAuthorizationsBundleProjectsBatched(companyId);
}

async function loadAuthorizationsBundleProjectsBatched(
  companyId: string,
): Promise<AuthorizationsBundleProject[]> {
  const projects = await getCompanyProjects(companyId);
  if (projects.length === 0) return [];

  const ids = projects.map((p) => p.id);
  const [devicesBy, sourcesBy] = await Promise.all([
    getAuthDevicesGroupedByProjectId(ids, { includeAdminDevices: true }),
    getExtensionSourcesByProjectIds(ids),
  ]);

  return projects.map((p) => {
    const source = sourcesBy[p.id] ?? null;
    const extensionSource: BundleExtensionSourcePayload = source
      ? {
          owner: source.githubOwner,
          repo: source.githubRepo,
          ref: source.githubRef,
          deploymentVisibleFrom: source.deploymentVisibleFrom,
        }
      : null;

    return {
      id: p.id,
      title: p.title,
      companyId: p.companyId,
      accessOverride: p.accessOverride ?? null,
      deviceLimit: p.deviceLimit ?? null,
      features: p.features ?? null,
      devices: (devicesBy[p.id] || []).map((d) => ({
        id: d.id,
        name: d.name,
        deviceId: d.deviceId,
        status: d.status,
        isAdminDevice: d.isAdminDevice,
        features: d.features ?? null,
      })),
      extensionSource,
    };
  });
}
