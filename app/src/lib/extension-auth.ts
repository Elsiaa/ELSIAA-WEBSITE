/**
 * Extension API token verification for POEL CLIENTS Chrome extension.
 * For concept testing: one preset token is always accepted (see PRESET_TEST_TOKEN).
 * Optional: EXTENSION_VALID_TOKENS (comma-separated) for additional tokens.
 */
const PRESET_TEST_TOKEN = 'poel-demo-vercatryx';

const VALID_TOKENS = new Set(
  (process.env.EXTENSION_VALID_TOKENS ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
);

export function verifyExtensionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const t = token.trim();
  return t === PRESET_TEST_TOKEN || VALID_TOKENS.has(t);
}

/** Token to use for testing: send this in Authorization: Bearer <token> or ?token= */
export const EXTENSION_TEST_TOKEN = PRESET_TEST_TOKEN;

export function getExtensionTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  const url = new URL(request.url);
  const q = url.searchParams.get('token');
  if (q) return q.trim();
  return null;
}
