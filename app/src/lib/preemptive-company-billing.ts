import { getCompanyPaymentStatus, type CompanyPaymentStatus } from '@/lib/project-payments';
import { getServerSupabaseClient } from '@/lib/supabase';

/**
 * Before surfacing overdue / grace-period entitlement state (or overdue warning emails), try the same due-billing run
 * as admin "Run billing" (at most once per hour per company, tracked in DB via `claim_company_preemptive_billing`).
 *
 * Loads `processAllDueBillings` dynamically so `billing-cron` can import this module without a circular dependency.
 */
export async function getCompanyPaymentStatusWithPreemptiveBilling(
  companyId: string
): Promise<CompanyPaymentStatus> {
  let status = await getCompanyPaymentStatus(companyId);
  if (status.allUpToDate) return status;

  const supabase = getServerSupabaseClient();
  const { data: claimed, error } = await supabase.rpc('claim_company_preemptive_billing', {
    p_company_id: companyId,
  });

  if (error) {
    console.error('claim_company_preemptive_billing:', error);
    return status;
  }

  if (claimed === true) {
    try {
      const { processAllDueBillings } = await import('@/lib/billing-cron');
      await processAllDueBillings(undefined, { companyId });
    } catch (e) {
      console.error('Preemptive company billing failed:', e);
    }
    status = await getCompanyPaymentStatus(companyId);
  }

  return status;
}
