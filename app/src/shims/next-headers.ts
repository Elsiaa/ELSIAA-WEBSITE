/**
 * next/headers shim for copied Poel handlers.
 * Prefer reading from the Request passed into the route handler when possible.
 * This stub returns empty stores so import resolution succeeds at module load.
 */
export async function headers(): Promise<Headers> {
  return new Headers();
}

export async function cookies() {
  return {
    get: (_name: string) => undefined as { name: string; value: string } | undefined,
    getAll: () => [] as { name: string; value: string }[],
    set: (..._args: unknown[]) => {},
    delete: (..._args: unknown[]) => {},
    has: (_name: string) => false,
  };
}
