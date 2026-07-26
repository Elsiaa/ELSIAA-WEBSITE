const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Start of that calendar day in UTC, or null if unset/invalid. */
export function deploymentCutoffUtc(dateStr: string | null | undefined): Date | null {
  if (!dateStr || !ISO_DATE.test(dateStr)) return null;
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function commitVisibleToCompanyAdmins(commitDateIso: string, cutoff: Date | null): boolean {
  if (!cutoff) return true;
  const t = new Date(commitDateIso).getTime();
  if (Number.isNaN(t)) return true;
  return t >= cutoff.getTime();
}
