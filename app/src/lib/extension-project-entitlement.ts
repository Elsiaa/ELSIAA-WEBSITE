import type { Project } from './projects';
import { getCompanyPaymentStatusWithPreemptiveBilling } from './preemptive-company-billing';
import { overdueBillsCount } from './company-payment-status-compat';
import {
  activeAdminDeviceBypassesEntitlement,
  type ProjectAuthDevice,
} from './project-auth-devices';

const GRACE_PERIOD_DAYS = 3;

export type ExtensionEntitlementResult =
  | { allowed: true; status: 'allowed' | 'warning'; daysRemaining?: number }
  | {
      allowed: false;
      status: 'denied';
      reason: string;
      pendingFees?: number;
      overdueSubscriptions?: number;
      overdueBills?: number;
      maxDaysOverdue?: number;
    };

/**
 * Same rules as GET /api/entitlement for a resolved project.
 * When `device` is an active admin device, payment and blocked overrides are skipped.
 */
export async function getExtensionEntitlementForProject(
  project: Project,
  context?: { device?: Pick<ProjectAuthDevice, 'isAdminDevice' | 'status'> | null }
): Promise<ExtensionEntitlementResult> {
  if (activeAdminDeviceBypassesEntitlement(context?.device)) {
    return { allowed: true, status: 'allowed' };
  }

  if (project.accessOverride === 'allowed') {
    return { allowed: true, status: 'allowed' };
  }
  if (project.accessOverride === 'blocked') {
    return { allowed: false, status: 'denied', reason: 'Access blocked by admin override' };
  }

  const paymentStatus = await getCompanyPaymentStatusWithPreemptiveBilling(project.companyId);

  if (paymentStatus.allUpToDate) {
    return { allowed: true, status: 'allowed' };
  }

  const withinGrace = paymentStatus.maxDaysOverdue <= GRACE_PERIOD_DAYS;
  const daysRemaining = withinGrace ? GRACE_PERIOD_DAYS - paymentStatus.maxDaysOverdue : 0;

  if (withinGrace) {
    return {
      allowed: true,
      status: 'warning',
      daysRemaining,
    };
  }

  return {
    allowed: false,
    status: 'denied',
    reason: 'Access suspended - overdue payments exceed grace period',
    pendingFees: paymentStatus.pendingFees,
    overdueSubscriptions: paymentStatus.overdueSubscriptions,
    overdueBills: overdueBillsCount(paymentStatus),
    maxDaysOverdue: paymentStatus.maxDaysOverdue,
  };
}
