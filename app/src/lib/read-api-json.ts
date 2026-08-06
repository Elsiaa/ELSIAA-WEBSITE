/**
 * Read a fetch Response body as JSON. Avoids SyntaxError when the server returns HTML
 * (e.g. "Internal Server Error") or other non-JSON bodies.
 */
export async function readApiJsonResponse<T = Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const head = text.slice(0, 120).replace(/\s+/g, " ").trim();
    const looksHtml = text.trimStart().startsWith("<") || /internal server error/i.test(text);
    throw new Error(
      looksHtml
        ? `Server error (${res.status}). Please try again or check deployment logs.`
        : `Invalid response from server (${res.status}): ${head}`,
    );
  }
}
