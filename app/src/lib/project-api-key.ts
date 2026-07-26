import { getProjectByApiKey, type Project } from './projects';

/** Append to project API key (e.g. `<hex-key>=dev`) to fetch extension from default-branch HEAD; requires active admin device. */
export const PROJECT_API_KEY_DEV_SUFFIX = '=dev';

export type ParsedProjectApiKey = {
  lookupKey: string;
  devMode: boolean;
};

export function parseProjectApiKey(raw: string | null | undefined): ParsedProjectApiKey | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.endsWith(PROJECT_API_KEY_DEV_SUFFIX)) {
    const lookupKey = trimmed.slice(0, -PROJECT_API_KEY_DEV_SUFFIX.length).trim();
    if (!lookupKey) return null;
    return { lookupKey, devMode: true };
  }

  return { lookupKey: trimmed, devMode: false };
}

export function getParsedProjectApiKeyFromRequest(request: Request): ParsedProjectApiKey | null {
  const raw =
    request.headers.get('x-project-api-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    null;
  return parseProjectApiKey(raw);
}

export async function getProjectByRequestApiKey(
  request: Request
): Promise<{ project: Project; devMode: boolean } | null> {
  const parsed = getParsedProjectApiKeyFromRequest(request);
  if (!parsed) return null;
  const project = await getProjectByApiKey(parsed.lookupKey);
  if (!project) return null;
  return { project, devMode: parsed.devMode };
}
