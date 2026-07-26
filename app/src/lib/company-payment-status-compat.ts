/** Payment status shape from getCompanyPaymentStatus (with optional bills field when bills billing is deployed). */
export type CompanyPaymentStatusLike = {
  allUpToDate: boolean;
  pendingFees: number;
  overdueSubscriptions: number;
  maxDaysOverdue: number;
};

export function overdueBillsCount(status: CompanyPaymentStatusLike): number {
  if ('overdueBills' in status && typeof (status as { overdueBills?: number }).overdueBills === 'number') {
    return (status as { overdueBills: number }).overdueBills;
  }
  return 0;
}
