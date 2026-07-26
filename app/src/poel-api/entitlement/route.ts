import { NextRequest, NextResponse } from 'next/server';
import { getParsedProjectApiKeyFromRequest } from '@/lib/project-api-key';
import { getProjectByApiKey } from '@/lib/projects';
import { getCompanyPaymentStatusWithPreemptiveBilling } from '@/lib/preemptive-company-billing';
import { findActiveDeviceByExternalId } from '@/lib/project-auth-device-lookup';
import { activeAdminDeviceBypassesEntitlement } from '@/lib/project-auth-devices';
import { overdueBillsCount } from '@/lib/company-payment-status-compat';
import { resolveAppFeaturesForProjectRequest } from '@/lib/resolve-request-app-features';
import type { AppFeatures } from '@/lib/app-features';
import type { Project } from '@/lib/projects';

const GRACE_PERIOD_DAYS = 3;

function getExternalDeviceIdFromRequest(request: NextRequest): string {
  const header = request.headers.get('x-device-id')?.trim();
  if (header) return header;
  return request.nextUrl.searchParams.get('deviceId')?.trim() ?? '';
}

async function withFeatures(project: Project, request: NextRequest, body: Record<string, unknown>) {
  if (body.allowed !== true) return body;
  const features: AppFeatures = await resolveAppFeaturesForProjectRequest(project, request);
  return { ...body, features };
}

/**
 * GET /api/entitlement
 * For external React/Next sites to check if usage is allowed (company paid up).
 * Auth: x-project-api-key or Authorization: Bearer <project_api_key>
 *
 * Optional device binding: send `x-device-id` and/or query `deviceId` to require a matching
 * **active** project auth device (same rules as extension routes). Omitted = payment-only check
 * (backward compatible). When provided but unknown / pending / paused, returns denied.
 * Active **admin** devices bypass payment suspension and project accessOverride blocked.
 *
 * When allowed, includes `features` merged from project + the matched auth device
 * (if `deviceId` / `x-device-id` was sent).
 *
 * Response:
 *   status: "allowed" | "warning" | "denied"
 *   allowed: boolean          (true during allowed + warning; false when denied)
 *   daysRemaining?: number    (only when status === "warning"; how many grace days left)
 *   reason?: string
 *   pendingFees: number
 *   overdueSubscriptions: number
 *   overdueBills: number
 *   maxDaysOverdue: number
 *   features?: Record<string, boolean>  (when allowed; open-ended keys)
 */
export async function GET(request: NextRequest) {
  try {
    const parsedKey = getParsedProjectApiKeyFromRequest(request);
    if (!parsedKey) {
      return NextResponse.json({ status: 'denied', allowed: false, reason: 'Missing project API key' }, { status: 401 });
    }

    const project = await getProjectByApiKey(parsedKey.lookupKey);
    if (!project) {
      return NextResponse.json({ status: 'denied', allowed: false, reason: 'Invalid project API key' }, { status: 403 });
    }

    const externalDeviceId = getExternalDeviceIdFromRequest(request);
    const device = externalDeviceId
      ? await findActiveDeviceByExternalId(project.id, externalDeviceId)
      : null;

    if (activeAdminDeviceBypassesEntitlement(device)) {
      return NextResponse.json(
        await withFeatures(project, request, {
          status: 'allowed',
          allowed: true,
          pendingFees: 0,
          overdueSubscriptions: 0,
          overdueBills: 0,
          maxDaysOverdue: 0,
        })
      );
    }

    // Central override: allow/block overrides all payment-based rules
    if (project.accessOverride === 'allowed') {
      return NextResponse.json(
        await withFeatures(project, request, {
          status: 'allowed',
          allowed: true,
          pendingFees: 0,
          overdueSubscriptions: 0,
          overdueBills: 0,
          maxDaysOverdue: 0,
        })
      );
    }
    if (project.accessOverride === 'blocked') {
      return NextResponse.json({
        status: 'denied',
        allowed: false,
        reason: 'Access blocked by admin override',
        pendingFees: 0,
        overdueSubscriptions: 0,
        overdueBills: 0,
        maxDaysOverdue: 0,
      });
    }

    const paymentStatus = await getCompanyPaymentStatusWithPreemptiveBilling(project.companyId);
    const overdueBills = overdueBillsCount(paymentStatus);

    if (!paymentStatus.allUpToDate) {
      const withinGrace = paymentStatus.maxDaysOverdue <= GRACE_PERIOD_DAYS;
      if (!withinGrace) {
        return NextResponse.json({
          status: 'denied',
          allowed: false,
          reason: 'Access suspended - overdue payments exceed grace period',
          pendingFees: paymentStatus.pendingFees,
          overdueSubscriptions: paymentStatus.overdueSubscriptions,
          overdueBills,
          maxDaysOverdue: paymentStatus.maxDaysOverdue,
        });
      }
    }

    // Payment allows (current or within grace): optional per-device gate
    if (externalDeviceId) {
      if (!device) {
        return NextResponse.json(
          {
            status: 'denied',
            allowed: false,
            reason:
              'No active auth device matches this device id. Call POST /api/entitlement/request-device with the same deviceId, then wait for a super admin to approve. Use GET /api/entitlement/devices to list registered devices.',
            pendingFees: paymentStatus.pendingFees,
            overdueSubscriptions: paymentStatus.overdueSubscriptions,
            overdueBills,
            maxDaysOverdue: paymentStatus.maxDaysOverdue,
          },
          { status: 403 }
        );
      }
    }

    if (paymentStatus.allUpToDate) {
      return NextResponse.json(
        await withFeatures(project, request, {
          status: 'allowed',
          allowed: true,
          pendingFees: 0,
          overdueSubscriptions: 0,
          overdueBills: 0,
          maxDaysOverdue: 0,
        })
      );
    }

    const withinGrace = paymentStatus.maxDaysOverdue <= GRACE_PERIOD_DAYS;
    const daysRemaining = withinGrace ? GRACE_PERIOD_DAYS - paymentStatus.maxDaysOverdue : 0;

    return NextResponse.json(
      await withFeatures(project, request, {
        status: withinGrace ? 'warning' : 'denied',
        allowed: withinGrace,
        ...(withinGrace ? { daysRemaining } : {}),
        reason: withinGrace
          ? `Payment overdue - ${daysRemaining} day(s) remaining before access is suspended`
          : 'Access suspended - overdue payments exceed grace period',
        pendingFees: paymentStatus.pendingFees,
        overdueSubscriptions: paymentStatus.overdueSubscriptions,
        overdueBills,
        maxDaysOverdue: paymentStatus.maxDaysOverdue,
      })
    );
  } catch (error) {
    console.error('Entitlement check error:', error);
    return NextResponse.json(
      { status: 'denied', allowed: false, reason: 'Server error' },
      { status: 500 }
    );
  }
}
