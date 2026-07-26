/**
 * Single entry point for running all billing across the entire system.
 * Used by the cron job: processes due project subscriptions and due payment_requests
 * (interval_billing and monthly) for all companies.
 */

import { attachCompanyDefaultToActiveAutoChargeBills, getCompanyIdsWithDueBills } from '@/lib/bills';
import { calculateNextBillingDate, getFeeByPaymentRequestId, linkPaymentToFee, updateProjectFeeStatus } from '@/lib/project-payments';
import { getCompanyPaymentStatusWithPreemptiveBilling } from '@/lib/preemptive-company-billing';
import {
  getDefaultPaymentMethod,
  getPaymentMethodForBilling,
  getPaymentMethodForUserBilling,
  getAnySavedMethodForCompany,
  getDuePaymentRequests,
  getCompanyIdsWithDuePaymentRequests,
  attachCompanyDefaultToPaymentRequests,
  updatePaymentRequestStripeInfo,
  getNextInvoiceNumber,
  updatePaymentRequestInvoiceAndStatus,
  updatePaymentRequestNextBillingDate,
  getRequestDisplayInfo,
  getPaymentRequestById,
  deleteSavedPaymentMethodByStripePmId,
  createPaymentRequest,
} from '@/lib/payments';
import { paymentRailDisplayLabel } from '@/lib/payment-method-labels';
import { getAllCompanies } from '@/lib/companies';
import { getUsersByCompany } from '@/lib/users';
import { getServerSupabaseClient } from '@/lib/supabase';
import { getPaymentCompanyName, getPaymentContactEmail, getPaymentContactPhone } from '@/lib/payment-branding';
import { getOperationalBrandName, readOperationalLogoBase64ForPdf, getOperationalLogoUrl } from '@/lib/operational-brand';
import {
  escapeHtml,
  escapeHtmlAttr,
  poelLightInvoiceEmailStyles,
  renderPoelLightTransactionalEmailHtml,
} from '@/lib/poel-theme';
import { sendTransactionalMail } from '@/lib/transactional-mail';
import { emailSvgCheckWhite16, pdfMakePaymentSuccessRow } from '@/lib/transactional-visuals';
import Stripe from 'stripe';
import { stripeProxy as stripe } from '@/lib/stripe-client';

// stripe provided by stripeProxy import

const MANAGEMENT_EMAIL = process.env.BILLING_MANAGEMENT_EMAIL || 'management@vercatryx.com';

/** Ensure Stripe secret and publishable keys are the same mode (test vs live). Mismatch causes "No such PaymentMethod" after saving a card. */
function assertStripeKeyModeMatch(): void {
  const sk = (process.env.STRIPE_SECRET_KEY || '').trim();
  const pk = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim();
  if (!sk || !pk) return;
  const skTest = sk.startsWith('sk_test_');
  const pkTest = pk.startsWith('pk_test_');
  if (skTest !== pkTest) {
    const msg =
      'Stripe key mode mismatch: STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must both be test (sk_test_/pk_test_) or both live (sk_live_/pk_live_). Using different modes causes "No such PaymentMethod" when charging. Fix .env.local and restart.';
    console.error(msg);
    throw new Error(msg);
  }
}

async function recordBillingFailureAndNotify(
  supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>,
  params: {
    companyId: string;
    billableType: 'subscription' | 'payment_request';
    billableId: string;
    chargeName: string;
    amountCents: number;
    errorMessage: string;
  }
): Promise<void> {
  try {
    await supabase.from('billing_failures').insert({
      company_id: params.companyId,
      billable_type: params.billableType,
      billable_id: params.billableId,
      charge_name: params.chargeName,
      amount_cents: params.amountCents,
      error_message: params.errorMessage,
    });

    const companies = await getAllCompanies();
    const company = companies.find((c) => c.id === params.companyId);
    const companyName = company?.name || 'Unknown';
    const users = await getUsersByCompany(params.companyId);
    const adminEmails = users.filter((u) => u.role === 'admin' && u.email).map((u) => u.email);
    const recipients = [...new Set([...adminEmails, MANAGEMENT_EMAIL])];
    if (recipients.length === 0) return;

    const amount = (params.amountCents / 100).toFixed(2);
    const subject = `Billing failed – ${params.chargeName} ($${amount})`;
    const smtpUser = process.env.ZOHO_EMAIL || getPaymentContactEmail();
    const mailBase = (
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://vercatryx.com'
    ).replace(/\/$/, '');
    const logoUrl = getOperationalLogoUrl(mailBase, 'full');
    const brand = getOperationalBrandName();
    const payName = getPaymentCompanyName();
    const contentHtml = `
      <div class="poel-email-alert">
        <h2>Billing failed</h2>
        <p style="margin:0;">Company <strong>${escapeHtml(companyName)}</strong> — the charge could not be processed.</p>
      </div>
      <p><strong>Charge:</strong> ${escapeHtml(params.chargeName)}</p>
      <p><strong>Amount:</strong> $${escapeHtml(amount)}</p>
      <p><strong>Error:</strong> ${escapeHtml(params.errorMessage)}</p>
      <p>Review the admin panel and ensure a valid payment method is on file.</p>
      <p style="margin-bottom:0;">— ${escapeHtml(payName)} Billing</p>`;
    const htmlBody = renderPoelLightTransactionalEmailHtml({
      logoUrl,
      brandName: brand,
      title: 'Billing failed',
      contentHtml,
      footerInnerHtml: `<p style="margin:0;">Automated billing notice from ${escapeHtml(payName)}.</p>`,
    });

    await sendTransactionalMail({
      from: `"${getPaymentCompanyName()} Billing" <${smtpUser}>`,
      to: recipients.join(', '),
      subject,
      html: htmlBody,
      text: `Billing failed – ${companyName}\nCharge: ${params.chargeName}\nAmount: $${amount}\nError: ${params.errorMessage}`,
    });
  } catch (e) {
    console.error('recordBillingFailureAndNotify failed:', e);
  }
}

export interface ProcessAllDueBillingsResult {
  success: boolean;
  processed: number;
  processedIds: string[];
  errors: number;
  errorDetails: Array<{ subscriptionId: string; error: string }>;
  processedPaymentRequests: number;
  processedPaymentRequestIds: string[];
  paymentRequestErrors: number;
  paymentRequestErrorDetails: Array<{ paymentRequestId: string; error: string }>;
  /** When options.debug is true: why each subscription was skipped or processed */
  subscriptionDebug?: Array<{ id: string; company_id: string; name: string; next_billing_date: string | null; reason: string }>;
  /** When options.debug is true: payment requests that would be charged (dry run; no charge) */
  paymentRequestDebug?: Array<{ id: string; amount: number; payment_type: string; next_billing_date: string | null; user_id: string | null; reason: string }>;
  /** When options.debug is true: attach results and why counts might be 0 */
  dryRunDebug?: {
    companyIdsToAttach: string[];
    attachResults: Array<{ companyId: string; methodFound: boolean; updated: number }>;
    duePaymentRequestsCount: number;
    duePaymentRequestsAfterScopeCount: number;
    skippedNoMethod?: Array<{ id: string; payment_type: string; next_billing_date: string | null; user_id: string | null; reason: string }>;
    /** Every payment request (pending/invoiced) per company with why it would or wouldn't be charged; company_name shown for each */
    allPaymentRequestsBreakdown?: Array<{
      company_name: string;
      id: string;
      payment_type: string;
      status: string;
      amount: number;
      next_billing_date: string | null;
      user_id: string | null;
      hasMethod: boolean;
      isDueByDate: boolean;
      reason: string;
    }>;
  };
  processedBills?: number;
  billErrors?: Array<{ billId: string; error: string }>;
  billRemindersSent?: number;
  billDebug?: import('@/lib/bill-billing-engine').BillDueDebugRow[];
  billReminderDebug?: import('@/lib/bill-billing-engine').ProcessDueBillsResult['billReminderDebug'];
}

/**
 * Run all billing for the entire system (or one company): due project subscriptions and due payment_requests.
 * Call this from the single cron endpoint (e.g. GET /api/cron/billing) or company-run-billing (POST with companyId).
 * @param asOfDate - Optional date to use as "today" (for testing); defaults to now.
 * @param options.debug - If true, do not charge; return subscriptionDebug with reason per subscription.
 * @param options.companyId - If set, only process this company (attach + subscriptions + payment requests for that company).
 */
export async function processAllDueBillings(asOfDate?: Date, options?: { debug?: boolean; companyId?: string }): Promise<ProcessAllDueBillingsResult> {
  assertStripeKeyModeMatch();
  const now = asOfDate || new Date();
  const debug = options?.debug === true;
  const scopeCompanyId = options?.companyId ?? null;
  const processed: string[] = [];
  const errors: Array<{ subscriptionId: string; error: string }> = [];
  const processedPaymentRequests: string[] = [];
  const paymentRequestErrors: Array<{ paymentRequestId: string; error: string }> = [];
  const subscriptionDebug: ProcessAllDueBillingsResult['subscriptionDebug'] = debug ? [] : undefined;
  const paymentRequestDebug: ProcessAllDueBillingsResult['paymentRequestDebug'] = debug ? [] : undefined;
  const dryRunDebug: ProcessAllDueBillingsResult['dryRunDebug'] = debug ? { companyIdsToAttach: [], attachResults: [], duePaymentRequestsCount: 0, duePaymentRequestsAfterScopeCount: 0 } : undefined;

  const supabase = getServerSupabaseClient();
  let query = supabase.from('project_subscriptions').select('*').eq('status', 'active');
  if (scopeCompanyId) query = query.eq('company_id', scopeCompanyId);
  const { data: allSubscriptionsRaw, error: fetchError } = await query;

  if (fetchError) {
    throw new Error('Failed to fetch subscriptions');
  }
  const allSubscriptions = allSubscriptionsRaw || [];

  // Ensure every pending project_fee has a linked payment_request (so one-time fees are included in billing/dry run)
  let feeQuery = supabase.from('project_fees').select('id, company_id, amount').eq('status', 'pending').is('payment_request_id', null);
  if (scopeCompanyId) feeQuery = feeQuery.eq('company_id', scopeCompanyId);
  const { data: unlinkedFees } = await feeQuery;
  const createdByClerkUserId =
    process.env.BILLING_CRON_ACTOR_ID?.trim() ||
    process.env.BILLING_CRON_CLERK_USER_ID?.trim() ||
    'billing-cron';
  for (const fee of unlinkedFees || []) {
    try {
      const users = await getUsersByCompany(fee.company_id);
      const admin = users.find((u) => u.role === 'admin') || users[0];
      const recipientName = admin
        ? `${(admin as { first_name?: string }).first_name || ''} ${(admin as { last_name?: string }).last_name || ''}`.trim() || admin.email
        : 'Set in Edit';
      const recipientEmail = admin?.email || 'edit@placeholder.local';
      const pr = await createPaymentRequest({
        userId: admin?.id,
        recipientEmail,
        recipientName,
        amount: fee.amount,
        createdByClerkUserId,
        paymentType: 'one_time',
      });
      await updateProjectFeeStatus(fee.id, 'pending', pr.id);
    } catch (e) {
      console.error(`Failed to create/link payment request for fee ${fee.id}:`, e);
    }
  }

  // Auto-attach company default payment method (run in dry run too so we see full list of what would be charged)
  const todayStr = now.toISOString().split('T')[0];
  const companyIdsToAttach = scopeCompanyId
    ? [scopeCompanyId]
    : [
        ...new Set([
          ...allSubscriptions.map((s) => s.company_id),
          ...(await getCompanyIdsWithDuePaymentRequests(now)),
          ...(await getCompanyIdsWithDueBills(todayStr)),
        ]),
      ];
  if (dryRunDebug) dryRunDebug.companyIdsToAttach = companyIdsToAttach;
  for (const companyId of companyIdsToAttach) {
    let prAttach = { updated: 0, methodFound: false };
    let billAttach = { updated: 0, methodFound: false };
    try {
      prAttach = await attachCompanyDefaultToPaymentRequests(companyId);
    } catch (e) {
      console.error(`attachCompanyDefaultToPaymentRequests(${companyId}) failed:`, e);
    }
    try {
      billAttach = await attachCompanyDefaultToActiveAutoChargeBills(companyId);
    } catch (e) {
      console.error(`attachCompanyDefaultToActiveAutoChargeBills(${companyId}) failed:`, e);
    }
    if (dryRunDebug) {
      dryRunDebug.attachResults.push({
        companyId,
        methodFound: prAttach.methodFound || billAttach.methodFound,
        updated: prAttach.updated + billAttach.updated,
      });
    }
  }

  for (const sub of allSubscriptions) {
    if (debug) {
      if (sub.stripe_subscription_id) {
        subscriptionDebug!.push({ id: sub.id, company_id: sub.company_id, name: sub.name || '', next_billing_date: sub.next_billing_date, reason: 'skipped: has stripe_subscription_id (billed by Stripe)' });
        continue;
      }
      if (!sub.next_billing_date) {
        subscriptionDebug!.push({ id: sub.id, company_id: sub.company_id, name: sub.name || '', next_billing_date: null, reason: 'skipped: no next_billing_date' });
        continue;
      }
      const nextBillingDate = new Date(sub.next_billing_date);
      if (nextBillingDate > now) {
        subscriptionDebug!.push({ id: sub.id, company_id: sub.company_id, name: sub.name || '', next_billing_date: sub.next_billing_date, reason: `skipped: next_billing_date (${sub.next_billing_date}) is after asOf (${now.toISOString().slice(0, 10)})` });
        continue;
      }
    } else {
      if (sub.stripe_subscription_id) continue;
      if (!sub.next_billing_date) continue;
      const nextBillingDate = new Date(sub.next_billing_date);
      if (nextBillingDate > now) continue;
    }

    try {
      let customerId: string | null = null;
      let paymentMethodId: string | null = null;
      const debugLookup: { pr: boolean; companySub: boolean; companyDef: boolean; usersWithDefault: number } = debug
        ? { pr: false, companySub: false, companyDef: false, usersWithDefault: 0 }
        : (undefined as any);

      if (sub.payment_request_id) {
        const { getPaymentRequestById } = await import('@/lib/payments');
        const paymentRequest = await getPaymentRequestById(sub.payment_request_id);
        if (paymentRequest) {
          customerId = paymentRequest.stripe_customer_id || null;
          paymentMethodId = paymentRequest.stripe_payment_method_id || null;
          if (debugLookup) debugLookup.pr = !!(customerId && paymentMethodId);
        }
      }

      if (!customerId || !paymentMethodId) {
        const methodForSubscription = await getPaymentMethodForBilling(sub.company_id, 'subscription');
        if (debugLookup) debugLookup.companySub = !!methodForSubscription;
        if (methodForSubscription) {
          customerId = methodForSubscription.stripeCustomerId;
          paymentMethodId = methodForSubscription.stripePaymentMethodId;
        }
        if (!customerId || !paymentMethodId) {
          const defaultMethod = await getDefaultPaymentMethod({ companyId: sub.company_id });
          if (debugLookup) debugLookup.companyDef = !!defaultMethod;
          if (defaultMethod) {
            customerId = defaultMethod.stripeCustomerId;
            paymentMethodId = defaultMethod.stripePaymentMethodId;
          }
        }
        if (!customerId || !paymentMethodId) {
          const { data: companyUsers } = await supabase
            .from('users')
            .select('id')
            .eq('company_id', sub.company_id);
          for (const u of companyUsers || []) {
            const userMethod = await getDefaultPaymentMethod({ userId: u.id })
              || await getPaymentMethodForUserBilling(u.id, 'subscription');
            if (debugLookup && userMethod) debugLookup.usersWithDefault++;
            if (userMethod) {
              customerId = userMethod.stripeCustomerId;
              paymentMethodId = userMethod.stripePaymentMethodId;
              break;
            }
          }
        }
        if (!customerId || !paymentMethodId) {
          const anyMethod = await getAnySavedMethodForCompany(sub.company_id);
          if (anyMethod) {
            customerId = anyMethod.stripeCustomerId;
            paymentMethodId = anyMethod.stripePaymentMethodId;
          }
        }
      }

      if (!customerId || !paymentMethodId) {
        if (debug && debugLookup) {
          const detail = [
            `pr: ${debugLookup.pr}`,
            `company_sub: ${debugLookup.companySub}`,
            `company_default: ${debugLookup.companyDef}`,
            `users_with_default: ${debugLookup.usersWithDefault}`,
          ].join(', ');
          subscriptionDebug!.push({
            id: sub.id,
            company_id: sub.company_id,
            name: sub.name || '',
            next_billing_date: sub.next_billing_date,
            reason: `skipped: no payment method (${detail})`,
          });
          continue;
        }
        const errMsg = 'No payment method available for subscription';
        errors.push({ subscriptionId: sub.id, error: errMsg });
        await recordBillingFailureAndNotify(supabase, {
          companyId: sub.company_id,
          billableType: 'subscription',
          billableId: sub.id,
          chargeName: sub.name || 'Subscription',
          amountCents: Math.round(sub.amount * 100),
          errorMessage: errMsg,
        });
        continue;
      }

      if (debug) {
        subscriptionDebug!.push({ id: sub.id, company_id: sub.company_id, name: sub.name || '', next_billing_date: sub.next_billing_date, reason: 'would_process (debug: no charge)' });
        continue;
      }

      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      const isCard = paymentMethod.type === 'card';
      const fee = isCard ? sub.amount * 0.03 : 0;
      const totalAmount = sub.amount + fee;
      const totalCents = Math.round(totalAmount * 100);

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: totalCents,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          project_subscription_id: sub.id,
          project_id: sub.project_id,
          company_id: sub.company_id,
          subscription_name: sub.name,
          originalAmount: sub.amount.toString(),
          fee: fee.toString(),
          method: isCard ? 'card' : 'ach',
          billing_type: 'subscription',
          ...(sub.payment_request_id && { payment_request_id: sub.payment_request_id }),
        },
      };
      if (paymentMethod.type === 'us_bank_account') {
        paymentIntentParams.payment_method_types = ['us_bank_account'];
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
        if (sub.payment_request_id && customerId && paymentMethodId) {
          try {
            await updatePaymentRequestStripeInfo(sub.payment_request_id, customerId, paymentMethodId);
          } catch (e) {
            console.error('Failed to attach used payment method to subscription payment_request:', e);
          }
        }
        const invoiceNumber = await getNextInvoiceNumber();
        const { getProjectSubscriptionById, updateSubscriptionBillingDates, createProjectSubscriptionTransaction } =
          await import('@/lib/project-payments');
        const subscription = await getProjectSubscriptionById(sub.id);
        const billingInterval = subscription?.billingInterval || 'monthly';
        const nextBillingDate = calculateNextBillingDate(billingInterval, now, {
          dayOfMonth: subscription?.billingDayOfMonth ?? undefined,
          dayOfWeek: subscription?.billingDayOfWeek ?? undefined,
        });
        await updateSubscriptionBillingDates(sub.id, now.toISOString(), nextBillingDate.toISOString());
        await createProjectSubscriptionTransaction({
          projectSubscriptionId: sub.id,
          paymentRequestId: sub.payment_request_id ?? null,
          stripePaymentIntentId: paymentIntent.id,
          amount: sub.amount,
          invoiceNumber,
          billingPeriodStart: now.toISOString(),
          billingPeriodEnd: nextBillingDate.toISOString(),
        });
        if (sub.payment_request_id && invoiceNumber != null) {
          try {
            await stripe.paymentIntents.update(paymentIntent.id, {
              metadata: { ...paymentIntentParams.metadata, invoice_number: String(invoiceNumber) },
            });
          } catch (e) {
            console.error('Failed to update subscription payment intent metadata with invoice number:', e);
          }
        }
        processed.push(sub.id);

        // Send receipt to customer (payer) every time we bill a subscription
        try {
          let recipientEmail: string;
          let recipientName: string;
          if (sub.payment_request_id) {
            const pr = await getPaymentRequestById(sub.payment_request_id);
            const info = pr ? getRequestDisplayInfo(pr) : { email: '', name: '' };
            recipientEmail = info.email || '';
            recipientName = info.name || sub.name || 'Subscription';
          } else {
            const users = await getUsersByCompany(sub.company_id);
            const admin = users.find((u) => u.role === 'admin' && u.email);
            recipientEmail = admin?.email || '';
            recipientName = admin ? `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.email || sub.name || 'Subscription' : sub.name || 'Subscription';
          }
          if (recipientEmail) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            await fetch(`${baseUrl}/api/payments/send-receipt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                amount: sub.amount,
                fee,
                total: totalAmount,
                paymentMethod: isCard ? 'card' : 'ach',
                recipientEmail,
                recipientName,
                invoiceNumber,
              }),
            });
          }
        } catch (receiptErr) {
          console.error('Failed to send subscription receipt email to customer:', receiptErr);
        }

        try {
          await sendBillingReceiptToAdmins({
            companyId: sub.company_id,
            chargeName: sub.name || 'Subscription',
            amount: sub.amount,
            fee,
            total: totalAmount,
            invoiceNumber,
            paymentMethod: isCard ? 'card' : 'ach',
            recipientName: sub.name || 'Subscription',
            recipientEmail: '',
            billingType: 'subscription',
          });
        } catch (receiptErr) {
          console.error('Failed to send subscription receipt email to admins:', receiptErr);
        }
      } else {
        const errMsg = `Payment failed with status: ${paymentIntent.status}`;
        errors.push({ subscriptionId: sub.id, error: errMsg });
        await recordBillingFailureAndNotify(supabase, {
          companyId: sub.company_id,
          billableType: 'subscription',
          billableId: sub.id,
          chargeName: sub.name || 'Subscription',
          amountCents: Math.round(sub.amount * 100),
          errorMessage: errMsg,
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      errors.push({ subscriptionId: sub.id, error: errMsg });
      await recordBillingFailureAndNotify(supabase, {
        companyId: sub.company_id,
        billableType: 'subscription',
        billableId: sub.id,
        chargeName: (sub as any).name || 'Subscription',
        amountCents: Math.round((sub as any).amount * 100),
        errorMessage: errMsg,
      });
    }
  }

  let duePaymentRequests = await getDuePaymentRequests(now);
  if (dryRunDebug) dryRunDebug.duePaymentRequestsCount = duePaymentRequests.length;
  if (scopeCompanyId) {
    const userIds = [...new Set(duePaymentRequests.map((pr) => pr.user_id).filter(Boolean))] as string[];
    let userCompanyMap = new Map<string, string | null>();
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, company_id').in('id', userIds);
      userCompanyMap = new Map((users || []).map((u: { id: string; company_id: string | null }) => [u.id, u.company_id]));
    }
    const companyLinkedPrIds = new Set<string>();
    const { data: feePrIds } = await supabase.from('project_fees').select('payment_request_id').eq('company_id', scopeCompanyId).not('payment_request_id', 'is', null);
    (feePrIds || []).forEach((r: { payment_request_id: string }) => companyLinkedPrIds.add(r.payment_request_id));
    const { data: subPrIds } = await supabase.from('project_subscriptions').select('payment_request_id').eq('company_id', scopeCompanyId).not('payment_request_id', 'is', null);
    (subPrIds || []).forEach((r: { payment_request_id: string }) => companyLinkedPrIds.add(r.payment_request_id));
    duePaymentRequests = duePaymentRequests.filter(
      (pr) => (pr.user_id != null && userCompanyMap.get(pr.user_id) === scopeCompanyId) || companyLinkedPrIds.has(pr.id)
    );
  }
  if (dryRunDebug) dryRunDebug.duePaymentRequestsAfterScopeCount = duePaymentRequests.length;

  if (dryRunDebug && companyIdsToAttach.length > 0) {
    const nowTime = now.getTime();
    const { data: companies } = await supabase.from('companies').select('id, name').in('id', companyIdsToAttach);
    const companyNameById = new Map((companies || []).map((c: { id: string; name: string }) => [c.id, c.name]));
    const nowDateStr = now.toISOString().slice(0, 10);
    const { data: subLinks } = await supabase
      .from('project_subscriptions')
      .select('payment_request_id, next_billing_date')
      .eq('status', 'active')
      .not('payment_request_id', 'is', null)
      .not('next_billing_date', 'is', null);
    const subscriptionNextBillingByPrId = new Map<string, string>();
    (subLinks || []).forEach((r: { payment_request_id: string; next_billing_date: string }) => subscriptionNextBillingByPrId.set(r.payment_request_id, r.next_billing_date));
    const { data: futureSubCompanies } = await supabase
      .from('project_subscriptions')
      .select('company_id')
      .eq('status', 'active')
      .not('next_billing_date', 'is', null)
      .gt('next_billing_date', nowDateStr);
    const companyIdsWithFutureSubscription = new Set((futureSubCompanies || []).map((r: { company_id: string }) => r.company_id));
    const breakdown: NonNullable<ProcessAllDueBillingsResult['dryRunDebug']>['allPaymentRequestsBreakdown'] = [];
    const skippedNoMethodList: Array<{ id: string; payment_type: string; next_billing_date: string | null; user_id: string | null; reason: string }> = [];
    const prRow = (p: {
      id: string;
      payment_type: string;
      status: string;
      amount: number;
      next_billing_date: string | null;
      user_id: string | null;
      stripe_customer_id: string | null;
      stripe_payment_method_id: string | null;
    }, companyId: string) => {
      const hasMethod = !!(p.stripe_customer_id && p.stripe_payment_method_id);
      const subNextBilling = subscriptionNextBillingByPrId.get(p.id);
      const subscriptionNotDueYetLinked = subNextBilling && new Date(subNextBilling).getTime() > nowTime;
      const subscriptionNotDueYetCompany = p.payment_type === 'monthly' && companyIdsWithFutureSubscription.has(companyId);
      const subscriptionNotDueYet = subscriptionNotDueYetLinked || subscriptionNotDueYetCompany;
      const isDueByDate = subscriptionNotDueYet
        ? false
        : !p.next_billing_date || new Date(p.next_billing_date).getTime() <= nowTime;
      let reason: string;
      if (subscriptionNotDueYet) reason = subscriptionNotDueYetLinked
        ? `not due yet (subscription next_billing_date ${subNextBilling} is after today)`
        : 'not due yet (company has subscription with next_billing_date after today)';
      else if (!hasMethod && isDueByDate) reason = 'due but no payment method attached';
      else if (!hasMethod) reason = 'no payment method attached';
      else if (!isDueByDate) reason = `not due yet (next_billing_date ${p.next_billing_date || 'null'} is after today)`;
      else reason = 'would_charge';
      return { hasMethod, isDueByDate, reason };
    };
    for (const companyId of companyIdsToAttach) {
      const companyName = companyNameById.get(companyId) ?? companyId;
      const { data: companyUserIds } = await supabase.from('users').select('id').eq('company_id', companyId);
      const cids = (companyUserIds || []).map((u: { id: string }) => u.id);
      const prIdsFromCompany = new Set<string>();
      if (cids.length > 0) {
        const { data: prsByUser } = await supabase
          .from('payments_requests')
          .select('id')
          .in('user_id', cids)
          .in('payment_type', ['one_time', 'interval_billing', 'monthly'])
          .in('status', ['pending', 'invoiced']);
        (prsByUser || []).forEach((r: { id: string }) => prIdsFromCompany.add(r.id));
      }
      const { data: feePrIds } = await supabase.from('project_fees').select('payment_request_id').eq('company_id', companyId).not('payment_request_id', 'is', null);
      (feePrIds || []).forEach((r: { payment_request_id: string }) => prIdsFromCompany.add(r.payment_request_id));
      const { data: subPrIds } = await supabase.from('project_subscriptions').select('payment_request_id').eq('company_id', companyId).not('payment_request_id', 'is', null);
      (subPrIds || []).forEach((r: { payment_request_id: string }) => prIdsFromCompany.add(r.payment_request_id));
      if (prIdsFromCompany.size === 0) continue;
      const { data: prs } = await supabase
        .from('payments_requests')
        .select('id, payment_type, status, amount, next_billing_date, user_id, stripe_customer_id, stripe_payment_method_id')
        .in('id', Array.from(prIdsFromCompany))
        .in('payment_type', ['one_time', 'interval_billing', 'monthly'])
        .in('status', ['pending', 'invoiced']);
      const allPrs = (prs || []) as Array<{
        id: string;
        payment_type: string;
        status: string;
        amount: number;
        next_billing_date: string | null;
        user_id: string | null;
        stripe_customer_id: string | null;
        stripe_payment_method_id: string | null;
      }>;
      for (const p of allPrs) {
        const { hasMethod, isDueByDate, reason } = prRow(p, companyId);
        if (!hasMethod && isDueByDate) skippedNoMethodList.push({ id: p.id, payment_type: p.payment_type, next_billing_date: p.next_billing_date, user_id: p.user_id, reason: 'due but no payment method attached' });
        breakdown.push({
          company_name: companyName,
          id: p.id,
          payment_type: p.payment_type,
          status: p.status,
          amount: p.amount,
          next_billing_date: p.next_billing_date,
          user_id: p.user_id,
          hasMethod,
          isDueByDate,
          reason,
        });
      }
    }
    dryRunDebug.skippedNoMethod = skippedNoMethodList.length > 0 ? skippedNoMethodList : undefined;
    dryRunDebug.allPaymentRequestsBreakdown = breakdown;
  }

  for (const pr of duePaymentRequests) {
    if (debug && paymentRequestDebug) {
      paymentRequestDebug.push({
        id: pr.id,
        amount: pr.amount,
        payment_type: pr.payment_type,
        next_billing_date: pr.next_billing_date ?? null,
        user_id: pr.user_id ?? null,
        reason: 'would_charge',
      });
      continue;
    }
    try {
      const customerId = pr.stripe_customer_id!;
      const paymentMethodId = pr.stripe_payment_method_id!;
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      const isCard = paymentMethod.type === 'card';
      const fee = isCard ? pr.amount * 0.03 : 0;
      const totalAmount = pr.amount + fee;
      const totalCents = Math.round(totalAmount * 100);

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: totalCents,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          payment_request_id: pr.id,
          originalAmount: pr.amount.toString(),
          fee: fee.toString(),
          method: isCard ? 'card' : 'ach',
          billing_type: pr.payment_type,
        },
      };
      if (paymentMethod.type === 'us_bank_account') {
        paymentIntentParams.payment_method_types = ['us_bank_account'];
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
        const invoiceNumber = await getNextInvoiceNumber();
        await stripe.paymentIntents.update(paymentIntent.id, {
          metadata: { ...paymentIntent.metadata, invoice_number: invoiceNumber.toString() },
        });
        const newStatus = pr.payment_type === 'interval_billing' ? 'invoiced' : 'completed';
        await updatePaymentRequestInvoiceAndStatus(pr.id, invoiceNumber, newStatus);
        const linkedFee = await getFeeByPaymentRequestId(pr.id);
        if (newStatus === 'completed' && linkedFee) {
          try {
            await linkPaymentToFee(linkedFee.id, pr.id, invoiceNumber, paymentIntent.id);
          } catch (feeErr) {
            console.error('[billing] Failed to link payment to fee:', feeErr);
          }
        }
        if (pr.payment_type === 'interval_billing') {
          const nextDate = new Date(now);
          nextDate.setMonth(nextDate.getMonth() + 1);
          nextDate.setHours(0, 0, 0, 0);
          await updatePaymentRequestNextBillingDate(pr.id, nextDate.toISOString());
        }
        const chargeName =
          pr.payment_type === 'interval_billing'
            ? 'Interval Billing'
            : pr.payment_type === 'monthly'
              ? 'Monthly Payment'
              : linkedFee?.name?.trim()
                ? linkedFee.name.trim()
                : 'One-time payment';
        try {
          const { email: recipientEmail, name: recipientName } = getRequestDisplayInfo(pr);
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          await fetch(`${baseUrl}/api/payments/send-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              public_token: pr.public_token,
              paymentIntentId: paymentIntent.id,
              amount: pr.amount,
              fee,
              total: totalAmount,
              paymentMethod: isCard ? 'card' : 'ach',
              recipientEmail,
              recipientName,
              invoiceNumber,
              chargeName,
            }),
          });
        } catch {
          // payer receipt is best-effort
        }

        try {
          const { email: recipientEmail, name: recipientName } = getRequestDisplayInfo(pr);
          let prCompanyId: string | null = null;
          if (pr.user_id) {
            const { data: prUser } = await supabase.from('users').select('company_id').eq('id', pr.user_id).maybeSingle();
            prCompanyId = prUser?.company_id || null;
          }
          await sendBillingReceiptToAdmins({
            companyId: prCompanyId,
            chargeName,
            amount: pr.amount,
            fee,
            total: totalAmount,
            invoiceNumber,
            paymentMethod: isCard ? 'card' : 'ach',
            recipientName,
            recipientEmail,
            billingType: pr.payment_type,
          });
        } catch (receiptErr) {
          console.error('Failed to send payment request receipt email:', receiptErr);
        }
        processedPaymentRequests.push(pr.id);
      } else {
        const errMsg = `Payment failed with status: ${paymentIntent.status}`;
        paymentRequestErrors.push({ paymentRequestId: pr.id, error: errMsg });
        let prCompanyId: string | null = null;
        if (pr.user_id) {
          const { data: u } = await supabase.from('users').select('company_id').eq('id', pr.user_id).maybeSingle();
          prCompanyId = u?.company_id ?? null;
        }
        if (prCompanyId) {
          await recordBillingFailureAndNotify(supabase, {
            companyId: prCompanyId,
            billableType: 'payment_request',
            billableId: pr.id,
            chargeName: pr.payment_type === 'interval_billing' ? 'Interval Billing' : pr.payment_type === 'monthly' ? 'Monthly' : 'One-time payment',
            amountCents: Math.round(pr.amount * 100),
            errorMessage: errMsg,
          });
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      const isInvalidPaymentMethod =
        errMsg.includes('No such PaymentMethod') ||
        (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'resource_missing');
      if (isInvalidPaymentMethod && pr.stripe_payment_method_id) {
        try {
          await updatePaymentRequestStripeInfo(pr.id, null, null);
          const removed = await deleteSavedPaymentMethodByStripePmId(pr.stripe_payment_method_id);
          if (removed > 0) {
            console.warn(`[billing] Cleared invalid payment method ${pr.stripe_payment_method_id} from payment request ${pr.id} and removed ${removed} saved method(s). Customer should re-add a payment method.`);
          }
        } catch (cleanupErr) {
          console.error('[billing] Failed to clear invalid payment method:', cleanupErr);
        }
      }
      paymentRequestErrors.push({ paymentRequestId: pr.id, error: errMsg });
      let prCompanyId: string | null = null;
      if (pr.user_id) {
        const { data: u } = await supabase.from('users').select('company_id').eq('id', pr.user_id).maybeSingle();
        prCompanyId = u?.company_id ?? null;
      }
      if (prCompanyId) {
        await recordBillingFailureAndNotify(supabase, {
          companyId: prCompanyId,
          billableType: 'payment_request',
          billableId: pr.id,
          chargeName: pr.payment_type === 'interval_billing' ? 'Interval Billing' : pr.payment_type === 'monthly' ? 'Monthly' : 'One-time payment',
          amountCents: Math.round(pr.amount * 100),
          errorMessage: errMsg,
        });
      }
    }
  }

  let billsResult: Awaited<ReturnType<typeof import('@/lib/bill-billing-engine').processDueBills>> | undefined;
  try {
    const { processDueBills } = await import('@/lib/bill-billing-engine');
    billsResult = await processDueBills({
      asOfDate: now.toISOString().split('T')[0],
      companyId: scopeCompanyId ?? undefined,
      debug,
    });
  } catch (billCronErr) {
    console.error('[billing-cron] processDueBills failed:', billCronErr);
  }

  return {
    success: true,
    processed: processed.length,
    processedIds: processed,
    errors: errors.length,
    errorDetails: errors,
    processedPaymentRequests: processedPaymentRequests.length,
    processedPaymentRequestIds: processedPaymentRequests,
    paymentRequestErrors: paymentRequestErrors.length,
    paymentRequestErrorDetails: paymentRequestErrors,
    ...(billsResult && {
      processedBills: billsResult.processed,
      billErrors: billsResult.errors,
      billRemindersSent: billsResult.remindersSent,
      billDebug: billsResult.billDebug,
      billReminderDebug: billsResult.billReminderDebug,
    }),
    ...(subscriptionDebug && { subscriptionDebug }),
    ...(paymentRequestDebug && { paymentRequestDebug }),
    ...(dryRunDebug && { dryRunDebug }),
  };
}

// ---------------------------------------------------------------------------
// Billing receipt emails with PDF attachment
// ---------------------------------------------------------------------------

interface BillingReceiptParams {
  companyId: string | null;
  chargeName: string;
  amount: number;
  fee: number;
  total: number;
  invoiceNumber: number | string;
  paymentMethod: string;
  recipientName: string;
  recipientEmail: string;
  billingType: string;
}

let _cachedLogoBase64: string | null | undefined;

function loadLogoBase64(): string | null {
  if (_cachedLogoBase64 !== undefined) return _cachedLogoBase64;
  const embedded = readOperationalLogoBase64ForPdf();
  _cachedLogoBase64 = embedded ?? null;
  return _cachedLogoBase64;
}

function generateReceiptPdfBuffer(p: BillingReceiptParams): Promise<Buffer> {
  const pdfMake = require('pdfmake/build/pdfmake');
  const pdfFonts = require('pdfmake/build/vfs_fonts');

  if (pdfFonts?.pdfMake?.vfs) pdfMake.vfs = pdfFonts.pdfMake.vfs;
  else if (pdfFonts?.vfs) pdfMake.vfs = pdfFonts.vfs;
  else if (pdfFonts) pdfMake.vfs = pdfFonts;

  const logoImage = loadLogoBase64();
  if (logoImage) {
    pdfMake.vfs = pdfMake.vfs || {};
    pdfMake.vfs['logo.png'] = logoImage;
  }

  const receiptDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const methodDisplay = paymentRailDisplayLabel(p.paymentMethod);

  const docDef: any = {
    content: [
      ...(logoImage
        ? [{ image: 'logo.png', width: 150, alignment: 'center', margin: [0, 0, 0, 20], fit: [150, 75] }]
        : [{ text: getPaymentCompanyName().toUpperCase(), style: 'header', alignment: 'center', margin: [0, 0, 0, 20] }]),
      { text: 'PAYMENT RECEIPT', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 30] },
      pdfMakePaymentSuccessRow('successBadge'),
      {
        columns: [
          { text: [{ text: `${getPaymentCompanyName()}\n`, bold: true }, { text: `Email: ${getPaymentContactEmail()}\n` }, { text: `Phone: ${getPaymentContactPhone()}` }], width: '*' },
          { text: [{ text: `Invoice #: ${p.invoiceNumber}\n`, bold: true }, { text: `Date: ${receiptDate}\n` }, { text: `Payment Method: ${methodDisplay}` }], alignment: 'right', width: '*' },
        ],
        margin: [0, 0, 0, 20],
      },
      { text: 'Bill To:', style: 'label', margin: [0, 20, 0, 5] },
      { text: [{ text: `${p.recipientName}\n`, bold: true }, { text: p.recipientEmail }], margin: [0, 0, 0, 10] },
      { text: `Charge: ${p.chargeName}`, margin: [0, 0, 0, 20], fontSize: 11, color: '#555555' },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [{ text: 'Service Amount', style: 'tableHeader' }, { text: `$${p.amount.toFixed(2)}`, style: 'tableCell', alignment: 'right' }],
            ...(p.fee > 0 ? [[{ text: 'Processing Fee (3%)', style: 'tableHeader' }, { text: `$${p.fee.toFixed(2)}`, style: 'tableCell', alignment: 'right' }]] : []),
            [{ text: 'Total Paid', style: 'tableTotal' }, { text: `$${p.total.toFixed(2)}`, style: 'tableTotal', alignment: 'right' }],
          ],
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 1 : 0),
          vLineWidth: () => 0, paddingLeft: () => 10, paddingRight: () => 10, paddingTop: () => 10, paddingBottom: () => 10,
        },
        margin: [0, 0, 0, 30],
      },
      { text: 'Thank you for your payment!', alignment: 'center', margin: [0, 20, 0, 10] },
      { text: `This is your receipt for the payment made on ${receiptDate}.`, alignment: 'center', fontSize: 9, color: '#666666', margin: [0, 0, 0, 10] },
      { text: `If you have any questions, please contact us at ${getPaymentContactEmail()} or ${getPaymentContactPhone()}.`, alignment: 'center', fontSize: 9, color: '#666666' },
    ],
    styles: {
      header: { fontSize: 24, bold: true, color: '#1e6b3c' },
      subheader: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      successBadge: { fontSize: 12, bold: true, color: '#4CAF50' },
      label: { fontSize: 12, bold: true },
      tableHeader: { fontSize: 11, bold: true, color: '#333333' },
      tableCell: { fontSize: 11, color: '#333333' },
      tableTotal: { fontSize: 12, bold: true, color: '#333333' },
    },
    pageMargins: [40, 60, 40, 60],
  };

  const pdfDoc = pdfMake.createPdf(docDef);
  return new Promise<Buffer>((resolve) => {
    pdfDoc.getBuffer((buffer: Buffer) => resolve(Buffer.from(buffer)));
  });
}

async function sendBillingReceiptToAdmins(p: BillingReceiptParams): Promise<void> {
  const adminEmails: string[] = [];
  if (p.companyId) {
    const users = await getUsersByCompany(p.companyId);
    for (const u of users) {
      if (u.role === 'admin' && u.email) adminEmails.push(u.email);
    }
  }
  const recipients = [...new Set([...adminEmails, MANAGEMENT_EMAIL])];
  if (!recipients.length) return;

  const pdfBuffer = await generateReceiptPdfBuffer(p);

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://vercatryx.com').replace(/\/$/, '');
  const receiptDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const methodDisplay = paymentRailDisplayLabel(p.paymentMethod);
  const logoFull = getOperationalLogoUrl(baseUrl, 'full');

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <style>
    ${poelLightInvoiceEmailStyles()}
    .company-info { margin: 20px 0; }
    .success-badge { background: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; display: inline-flex; align-items: center; gap: 8px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoFull}" alt="${getPaymentCompanyName()} Logo" />
      <h1>Payment Receipt</h1>
      <div class="success-badge">${emailSvgCheckWhite16}<span>Payment successful</span></div>
    </div>
    <div class="company-info">
      <h2>${getPaymentCompanyName()}</h2>
      <p>Email: ${getPaymentContactEmail()}</p>
      <p>Phone: ${getPaymentContactPhone()}</p>
    </div>
    <div style="display: flex; justify-content: space-between; margin: 20px 0;">
      <div>
        <p><strong>Bill To:</strong></p>
        <p>${p.recipientName}</p>
        <p>${p.recipientEmail}</p>
      </div>
      <div style="text-align: right;">
        <p><strong>Invoice #:</strong> ${p.invoiceNumber}</p>
        <p><strong>Date:</strong> ${receiptDate}</p>
        <p><strong>Payment Method:</strong> ${methodDisplay}</p>
      </div>
    </div>
    <div class="breakdown">
      <h3>Payment Details — ${p.chargeName}</h3>
      <table>
        <tr><th>Service Amount</th><td>$${p.amount.toFixed(2)}</td></tr>
        ${p.fee > 0 ? `<tr><th>Processing Fee (3%)</th><td>$${p.fee.toFixed(2)}</td></tr>` : ''}
        <tr class="total"><th>Total Paid</th><td>$${p.total.toFixed(2)}</td></tr>
      </table>
    </div>
    <div class="footer">
      <p>Thank you for your payment!</p>
      <p>This is your receipt for the payment made on ${receiptDate}.</p>
      <p>If you have any questions, please contact us at ${getPaymentContactEmail()} or ${getPaymentContactPhone()}.</p>
    </div>
  </div>
</body>
</html>`;

  const textBody = `${getPaymentCompanyName()} Payment Receipt\n\nBill To: ${p.recipientName}\nEmail: ${p.recipientEmail}\n\nCharge: ${p.chargeName}\nInvoice #: ${p.invoiceNumber}\nDate: ${receiptDate}\nPayment Method: ${methodDisplay}\n\nService Amount: $${p.amount.toFixed(2)}\n${p.fee > 0 ? `Processing Fee (3%): $${p.fee.toFixed(2)}\n` : ''}Total Paid: $${p.total.toFixed(2)}\n\nThank you for your payment!`;

  const smtpUser = process.env.ZOHO_EMAIL || getPaymentContactEmail();
  await sendTransactionalMail({
    from: `"${getPaymentCompanyName()}" <${smtpUser}>`,
    to: recipients.join(', '),
    subject: `Payment Receipt - Invoice #${p.invoiceNumber} — ${p.chargeName}`,
    html: htmlBody,
    text: textBody,
    attachments: [{ filename: `Receipt_${p.invoiceNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
  });
}

// ---------------------------------------------------------------------------
// Overdue warning emails
// ---------------------------------------------------------------------------

const GRACE_PERIOD_DAYS = 3;

export interface WarningDetail {
  companyId: string;
  companyName: string;
  daysOverdue: number;
  daysRemaining: number;
  recipients: string[];
}

export interface WarningEmailsResult {
  sent: number;
  details: WarningDetail[];
  errors: Array<{ companyId: string; error: string }>;
}

/**
 * For every company whose longest overdue item is 1-3 days, send a warning
 * email to all company admins + management@vercatryx.com.
 */
export async function sendOverdueWarningEmails(
  _now?: Date,
): Promise<WarningEmailsResult> {
  const details: WarningDetail[] = [];
  const errors: Array<{ companyId: string; error: string }> = [];

  const companies = await getAllCompanies();
  if (!companies.length) return { sent: 0, details, errors };

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://vercatryx.com').replace(/\/$/, '');
  const logoUrl = getOperationalLogoUrl(baseUrl, 'full');

  for (const company of companies) {
    try {
      const status = await getCompanyPaymentStatusWithPreemptiveBilling(company.id);
      if (status.allUpToDate || status.maxDaysOverdue < 1) continue;
      if (status.maxDaysOverdue > GRACE_PERIOD_DAYS) continue;

      const daysRemaining = GRACE_PERIOD_DAYS - status.maxDaysOverdue;

      const users = await getUsersByCompany(company.id);
      const adminEmails = users
        .filter((u) => u.role === 'admin' && u.email)
        .map((u) => u.email);

      const recipients = [...new Set([...adminEmails, MANAGEMENT_EMAIL])];
      if (!recipients.length) continue;

      const subject = `Payment overdue – ${daysRemaining} day(s) remaining before access is suspended`;

      const payName = getPaymentCompanyName();
      const brand = getOperationalBrandName();
      const adminHref = `${baseUrl}/admin`;
      const contentHtml = `
      <div class="poel-email-alert">
        <h2>Payment overdue</h2>
        <p style="margin:0;">Company <strong>${escapeHtml(company.name)}</strong> has outstanding payments that require attention.</p>
      </div>
      <p>The following items are overdue:</p>
      <div class="stat-wrap">
        <span class="stat">Pending fees: <strong>${status.pendingFees}</strong></span>
        <span class="stat">Overdue subscriptions: <strong>${status.overdueSubscriptions}</strong></span>
        <span class="stat">Overdue bills: <strong>${status.overdueBills}</strong></span>
        <span class="stat">Max days overdue: <strong>${status.maxDaysOverdue}</strong></span>
      </div>
      <p style="margin-top: 20px;">
        <strong>Access will be suspended in ${daysRemaining} day(s)</strong> if the outstanding balance is not resolved.
      </p>
      <p>Log in to the admin panel to review and resolve these payments.</p>
      <div class="poel-email-cta-wrap" style="text-align: left;">
        <a class="poel-email-btn" href="${escapeHtmlAttr(adminHref)}">Go to admin panel</a>
      </div>
      <div class="billing-signoff">
        <p>Best regards,</p>
        <p><strong>${escapeHtml(payName)} Billing System</strong></p>
      </div>`;

      const htmlBody = renderPoelLightTransactionalEmailHtml({
        logoUrl,
        brandName: brand,
        title: 'Payment overdue',
        contentHtml,
        footerInnerHtml: `<p style="margin:0;">Automated billing notification from ${escapeHtml(payName)}.</p>`,
        extraHeadStyles: `
          .stat-wrap { margin: 12px 0 8px; }
          .stat { display: inline-block; background: #f5f6f8; border: 1px solid #b8c8d8; border-radius: 6px; padding: 10px 18px; margin: 4px 8px 4px 0; }
          .stat strong { color: #1e6b3c; }
          .billing-signoff { margin-top: 28px; padding-top: 20px; border-top: 1px solid #b8c8d8; }
        `,
      });

      const textBody = [
        `Payment Overdue – ${company.name}`,
        '',
        `Pending fees: ${status.pendingFees}`,
        `Overdue subscriptions: ${status.overdueSubscriptions}`,
        `Overdue bills: ${status.overdueBills}`,
        `Max days overdue: ${status.maxDaysOverdue}`,
        '',
        `Access will be suspended in ${daysRemaining} day(s) if the outstanding balance is not resolved.`,
        '',
        `Please log in to the admin panel to review and resolve these payments: ${baseUrl}/admin`,
        '',
        'Best regards,',
        `${getPaymentCompanyName()} Billing System`,
      ].join('\n');

      const smtpUser = process.env.ZOHO_EMAIL || getPaymentContactEmail();
      const sent = await sendTransactionalMail({
        from: `"${getPaymentCompanyName()} Billing" <${smtpUser}>`,
        to: recipients.join(', '),
        subject,
        html: htmlBody,
        text: textBody,
      });

      if (!sent) {
        throw new Error('Email transport failed (Zoho and Gmail both unavailable)');
      }

      details.push({
        companyId: company.id,
        companyName: company.name,
        daysOverdue: status.maxDaysOverdue,
        daysRemaining,
        recipients,
      });
    } catch (err) {
      errors.push({
        companyId: company.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return { sent: details.length, details, errors };
}
