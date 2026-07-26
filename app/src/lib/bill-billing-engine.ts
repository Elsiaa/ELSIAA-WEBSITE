/**
 * Billing engine for unified bills — charge, invoice email, cron processing.
 */

import Stripe from 'stripe';
import { stripeProxy as stripe } from '@/lib/stripe-client';
import { getServerSupabaseClient } from '@/lib/supabase';
import { sendTransactionalMail } from '@/lib/transactional-mail';
import { getPaymentCompanyName, getPaymentContactEmail, getPaymentContactPhone } from '@/lib/payment-branding';
import { getOperationalLogoUrl } from '@/lib/operational-brand';
import { poelLightInvoiceEmailStyles } from '@/lib/poel-theme';
import type { InvoiceLineItem } from '@/lib/invoice-line-items';
import {
  type Bill,
  type BillCharge,
  attachCompanyPaymentMethodToBill,
  resolveStripePaymentMethodForBill,
  calculateBillNextBillingDate,
  createBillCharge,
  getBillById,
  getBillDisplayInfo,
  getDueBills,
  ensureBillChargeInvoiceNumber,
  getNextInvoiceNumber,
  getOpenBillCharge,
  markBillChargePaid,
  recordBillEvent,
  updateBillCharge,
  updateBillNextBillingDate,
  updateBillStatus,
  updateBillStripeInfo,
} from '@/lib/bills';
import { deleteSavedPaymentMethodByStripePmId } from '@/lib/payments';
import { generateInvoicePdfBuffer } from '@/lib/invoice-pdf';
import { sendPaymentReceiptEmail } from '@/lib/payment-receipt-email';
import { sendPaymentAdminNotifyEmail } from '@/lib/payment-admin-notify';
import {
  getPaymentAdminNotifyEmail,
  getPaymentOperationsBcc,
  getPaymentTransactionalFrom,
} from '@/lib/payment-mail';

// stripe provided by stripeProxy import

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(n: number): string {
  return n.toFixed(2);
}

/** Ensure PM is on the Stripe customer we will charge (align bill row if needed). */
async function ensureBillPaymentMethodOnCustomer(bill: Bill): Promise<void> {
  if (!bill.stripeCustomerId || !bill.stripePaymentMethodId) {
    throw new Error('No payment method attached to this bill');
  }
  const pm = await stripe.paymentMethods.retrieve(bill.stripePaymentMethodId);
  if (pm.customer === bill.stripeCustomerId) return;
  if (pm.customer && pm.customer !== bill.stripeCustomerId) {
    await updateBillStripeInfo(bill.id, pm.customer as string, bill.stripePaymentMethodId);
    bill.stripeCustomerId = pm.customer as string;
    return;
  }
  await stripe.paymentMethods.attach(bill.stripePaymentMethodId, { customer: bill.stripeCustomerId });
}

export async function completeBillAfterSuccessfulPayment(
  bill: Bill,
  charge: BillCharge,
  paymentIntent: Stripe.PaymentIntent,
  options: { sendEmails?: boolean } = {}
): Promise<BillCharge> {
  const sendEmails = options.sendEmails !== false;
  const paymentMethod = await stripe.paymentMethods.retrieve(
    typeof paymentIntent.payment_method === 'string'
      ? paymentIntent.payment_method
      : (bill.stripePaymentMethodId as string)
  );
  const isCard = paymentMethod.type === 'card';
  const fee = parseFloat(paymentIntent.metadata?.fee || '0') || (isCard ? charge.amount * 0.03 : 0);
  const totalAmount = paymentIntent.amount / 100;

  const invoiceNumber = charge.invoiceNumber ?? (await getNextInvoiceNumber());
  await stripe.paymentIntents.update(paymentIntent.id, {
    metadata: { ...paymentIntent.metadata, invoice_number: invoiceNumber.toString() },
  });
  const paidCharge = await markBillChargePaid(charge.id, invoiceNumber, paymentIntent.id);

  if (bill.scheduleType === 'one_time') {
    await updateBillStatus(bill.id, 'completed');
    await updateBillNextBillingDate(bill.id, null);
  } else {
    const next = calculateBillNextBillingDate(bill, new Date());
    await updateBillNextBillingDate(bill.id, next.toISOString().split('T')[0]);
  }

  await recordBillEvent({
    billId: bill.id,
    billChargeId: charge.id,
    eventType: 'charged',
    message: `Paid $${formatMoney(charge.amount)}`,
    metadata: { paymentIntentId: paymentIntent.id },
  });

  if (sendEmails) {
    const { name, email } = getBillDisplayInfo(bill);
    const rail = isCard ? 'card' : 'ach';
    if (email) {
      const receiptSent = await sendPaymentReceiptEmail({
        publicToken: bill.publicToken,
        paymentIntentId: paymentIntent.id,
        amount: charge.amount,
        fee,
        total: totalAmount,
        paymentMethod: rail,
        recipientEmail: email,
        recipientName: name,
        invoiceNumber,
        chargeName: bill.description || 'Bill payment',
      });
      if (!receiptSent) {
        console.error('[bill-billing] customer receipt email failed', { billId: bill.id });
      }
    }
    const notifySent = await sendPaymentAdminNotifyEmail({
      customerName: name,
      amount: totalAmount,
      paymentMethod: rail,
      publicToken: bill.publicToken,
      invoiceNumber,
    });
    if (!notifySent) {
      console.error('[bill-billing] management notify email failed', { billId: bill.id });
    }
  }

  return paidCharge;
}

function lineAmount(row: InvoiceLineItem): number {
  return row.quantity * row.unit_amount;
}

async function hasPaymentMethodRequiredEmailSent(billId: string, billChargeId: string): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { data } = await supabase
    .from('bill_events')
    .select('id')
    .eq('bill_id', billId)
    .eq('bill_charge_id', billChargeId)
    .eq('event_type', 'payment_method_required_emailed')
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/**
 * When auto-charge is configured but no Stripe PM exists, email the recipient with
 * sign-in / add-payment-method instructions (no management-only failure).
 */
export async function sendBillPaymentMethodRequiredEmail(
  bill: Bill,
  charge?: BillCharge | null
): Promise<void> {
  const { name: recipientName, email: recipientEmail } = getBillDisplayInfo(bill);
  if (!recipientEmail) throw new Error('Recipient email is required');

  const publicBase = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
  const signInUrl = `${publicBase}/sign-in`;
  const adminUrl = `${publicBase}/admin`;
  const logoFullUrl = getOperationalLogoUrl(publicBase, 'full');
  const amountLabel = formatMoney(charge?.amount ?? bill.amount);
  const billLabel = bill.description?.trim() || 'your bill';

  const hasLinkedAccount = Boolean(bill.userId);
  const hasCompany = Boolean(bill.companyId);

  let stepsHtml: string;
  let stepsText: string;

  if (hasLinkedAccount) {
    stepsHtml = `
      <ol style="margin:16px 0;padding-left:24px;line-height:1.6;">
        <li>Sign in at <a href="${signInUrl}">${signInUrl}</a> using <strong>${escapeHtml(recipientEmail)}</strong>.</li>
        <li>Open <strong>Billing &amp; Payments</strong> (<a href="${adminUrl}">${adminUrl}</a>).</li>
        <li>Add a card or bank account under <strong>Payment methods</strong>.</li>
        <li>We will charge <strong>$${amountLabel}</strong> automatically once a method is on file.</li>
      </ol>`;
    stepsText = [
      `1. Sign in: ${signInUrl} (${recipientEmail})`,
      `2. Open Billing & Payments: ${adminUrl}`,
      `3. Add a card or bank account`,
      `4. We will auto-charge $${amountLabel} once saved`,
    ].join('\n');
  } else if (hasCompany) {
    stepsHtml = `
      <ol style="margin:16px 0;padding-left:24px;line-height:1.6;">
        <li>Sign in at <a href="${signInUrl}">${signInUrl}</a> (if you have a company login).</li>
        <li>Open <strong>Billing &amp; Payments</strong> and add a card or bank account.</li>
        <li>Or ask your company billing administrator to add a payment method for your organization.</li>
        <li>After a method is on file, we will automatically charge <strong>$${amountLabel}</strong> for ${escapeHtml(billLabel)}.</li>
      </ol>`;
    stepsText = [
      `1. Sign in: ${signInUrl} → Billing & Payments`,
      `2. Or ask your company admin to add a payment method`,
      `3. We will auto-charge $${amountLabel} once saved`,
    ].join('\n');
  } else {
    stepsHtml = `
      <ol style="margin:16px 0;padding-left:24px;line-height:1.6;">
        <li>If you have an account with us, sign in at <a href="${signInUrl}">${signInUrl}</a>.</li>
        <li>Open <strong>Billing &amp; Payments</strong> and add a card or bank account.</li>
        <li>If you do not have login access, contact us at <a href="mailto:${escapeHtml(getPaymentContactEmail())}">${escapeHtml(getPaymentContactEmail())}</a> and we will help you get set up.</li>
        <li>We will charge <strong>$${amountLabel}</strong> automatically once a payment method is on file.</li>
      </ol>`;
    stepsText = [
      `1. Sign in: ${signInUrl} → Billing & Payments`,
      `2. Or contact ${getPaymentContactEmail()} for account access`,
      `3. We will auto-charge $${amountLabel} once a method is saved`,
    ].join('\n');
  }

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head><style>${poelLightInvoiceEmailStyles()}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoFullUrl}" alt="${getPaymentCompanyName()} Logo" />
          <h1>Payment method required</h1>
        </div>
        <p>Hi ${escapeHtml(recipientName)},</p>
        <p>
          <strong>${escapeHtml(getPaymentCompanyName())}</strong> has set up automatic billing of
          <strong>$${amountLabel}</strong> for ${escapeHtml(billLabel)}, but we do not have a payment method on file yet.
        </p>
        <p><strong>What you need to do:</strong></p>
        ${stepsHtml}
        <p class="footer" style="margin-top:24px;">
          Questions? Contact us at ${getPaymentContactEmail()} or ${getPaymentContactPhone()}.
        </p>
      </div>
    </body>
    </html>
  `;

  const textBody = `${getPaymentCompanyName()} — payment method required

Hi ${recipientName},

Automatic billing of $${amountLabel} is set up for ${billLabel}, but no payment method is on file.

${stepsText}

Questions: ${getPaymentContactEmail()} · ${getPaymentContactPhone()}`;

  await sendTransactionalMail({
    from: getPaymentTransactionalFrom(),
    to: recipientEmail,
    bcc: getPaymentOperationsBcc(),
    subject: `Action required: add a payment method for $${amountLabel} billing`,
    html: htmlBody,
    text: textBody,
  });

  await recordBillEvent({
    billId: bill.id,
    billChargeId: charge?.id,
    eventType: 'payment_method_required_emailed',
    message: `Payment method instructions emailed to ${recipientEmail}`,
  });
}

export async function sendBillInvoiceEmail(bill: Bill, charge?: BillCharge | null): Promise<void> {
  const { name: recipientName, email: recipientEmail } = getBillDisplayInfo(bill);
  if (!recipientEmail) throw new Error('Recipient email is required');

  let resolvedCharge = charge ?? null;
  if (resolvedCharge) {
    resolvedCharge = await ensureBillChargeInvoiceNumber(resolvedCharge);
  }

  const items = resolvedCharge?.lineItemsSnapshot?.length ? resolvedCharge.lineItemsSnapshot : bill.lineItems;
  const amount = resolvedCharge?.amount ?? bill.amount;
  const invoiceNumber =
    resolvedCharge?.invoiceNumber != null
      ? String(resolvedCharge.invoiceNumber)
      : String(await getNextInvoiceNumber());

  const publicBase = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const logoFullUrl = getOperationalLogoUrl(publicBase, 'full');
  const invoiceDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlLineRows =
    items
      .map(
        (row) => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(row.description)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${row.quantity}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${formatMoney(row.unit_amount)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${formatMoney(lineAmount(row))}</td>
              </tr>`
      )
      .join('') || '';

  const payUrl = `${publicBase}/payments?token=${encodeURIComponent(bill.publicToken)}`;

  const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head><style>${poelLightInvoiceEmailStyles()}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoFullUrl}" alt="${getPaymentCompanyName()} Logo" />
            <h1>Invoice</h1>
          </div>
          <p><strong>Bill To:</strong> ${escapeHtml(recipientName)}<br/>${escapeHtml(recipientEmail)}</p>
          <p><strong>Invoice #:</strong> ${escapeHtml(invoiceNumber)}<br/><strong>Date:</strong> ${invoiceDate}</p>
          ${bill.description ? `<p>${escapeHtml(bill.description)}</p>` : ''}
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr>
                <th align="left" style="padding:8px;border-bottom:1px solid #ddd;">Description</th>
                <th align="right" style="padding:8px;border-bottom:1px solid #ddd;">Qty</th>
                <th align="right" style="padding:8px;border-bottom:1px solid #ddd;">Unit</th>
                <th align="right" style="padding:8px;border-bottom:1px solid #ddd;">Amount</th>
              </tr>
            </thead>
            <tbody>${htmlLineRows}</tbody>
            <tr>
              <th colspan="3" align="right" style="padding:8px;">Total due</th>
              <td style="padding:8px;text-align:right;"><strong>$${formatMoney(amount)}</strong></td>
            </tr>
          </table>
          <p style="text-align:center;margin:24px 0;">
            <a href="${payUrl}" style="display:inline-block;padding:16px 32px;background:#1e6b3c;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">
              Pay Now — $${formatMoney(amount)}
            </a>
          </p>
          <p class="footer">Questions? ${getPaymentContactEmail()} · ${getPaymentContactPhone()}</p>
        </div>
      </body>
      </html>
    `;

  const textBody = `${getPaymentCompanyName()} Invoice #${invoiceNumber}\n\nBill To: ${recipientName}\n${recipientEmail}\n\nTotal: $${formatMoney(amount)}\n\nPay: ${payUrl}`;

  const pdfBuffer = await generateInvoicePdfBuffer({
    invoiceNumber,
    invoiceDate,
    recipientName,
    recipientEmail,
    amount,
    lineItems: items,
    payUrl,
    statusLabel: resolvedCharge?.status ?? 'invoiced',
  });

  await sendTransactionalMail({
    from: getPaymentTransactionalFrom(),
    to: recipientEmail,
    bcc: getPaymentOperationsBcc(),
    subject: `Invoice from ${getPaymentCompanyName()} — #${invoiceNumber} (PDF attached)`,
    html: htmlBody,
    text: textBody,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  await recordBillEvent({
    billId: bill.id,
    billChargeId: resolvedCharge?.id,
    eventType: 'invoice_emailed',
    message: `Invoice #${invoiceNumber} emailed to ${recipientEmail}`,
  });
}

async function recordBillBillingFailure(params: {
  companyId: string;
  billId: string;
  chargeName: string;
  amountCents: number;
  errorMessage: string;
}): Promise<void> {
  const supabase = getServerSupabaseClient();
  try {
    await supabase.from('billing_failures').insert({
      company_id: params.companyId,
      billable_type: 'bill',
      billable_id: params.billId,
      charge_name: params.chargeName,
      amount_cents: params.amountCents,
      error_message: params.errorMessage,
    });
  } catch (e) {
    console.error('[bill-billing] record failure', e);
  }

  try {
    await sendTransactionalMail({
      from: getPaymentTransactionalFrom(),
      to: getPaymentAdminNotifyEmail(),
      subject: `Billing failed: ${params.chargeName}`,
      html: `<p>Bill ${params.billId} failed: ${escapeHtml(params.errorMessage)}</p>`,
      text: `Bill ${params.billId} failed: ${params.errorMessage}`,
    });
  } catch (e) {
    console.error('[bill-billing] failure email', e);
  }
}

export async function chargeBillOffSession(
  bill: Bill,
  charge: BillCharge
): Promise<{ success: boolean; paymentIntentId?: string; error?: string; processing?: boolean }> {
  if (!bill.stripeCustomerId || !bill.stripePaymentMethodId) {
    return { success: false, error: 'No payment method attached' };
  }

  try {
    await ensureBillPaymentMethodOnCustomer(bill);
    const paymentMethod = await stripe.paymentMethods.retrieve(bill.stripePaymentMethodId);
    const isCard = paymentMethod.type === 'card';
    const fee = isCard ? charge.amount * 0.03 : 0;
    const totalAmount = charge.amount + fee;
    const totalCents = Math.round(totalAmount * 100);

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: totalCents,
      currency: 'usd',
      customer: bill.stripeCustomerId,
      payment_method: bill.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        bill_id: bill.id,
        bill_charge_id: charge.id,
        public_token: bill.publicToken,
        originalAmount: charge.amount.toString(),
        fee: fee.toString(),
        method: isCard ? 'card' : 'ach',
        billing_source: 'bill',
      },
    };
    if (paymentMethod.type === 'us_bank_account') {
      paymentIntentParams.payment_method_types = ['us_bank_account'];
    }

    console.log('[bill-billing] stripe.paymentIntents.create', {
      billId: bill.id,
      chargeId: charge.id,
      amountCents: totalCents,
      customerId: bill.stripeCustomerId,
      paymentMethodId: bill.stripePaymentMethodId,
    });

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
      await completeBillAfterSuccessfulPayment(bill, charge, paymentIntent);
      return {
        success: true,
        processing: paymentIntent.status === 'processing',
        paymentIntentId: paymentIntent.id,
      };
    }

    const errMsg =
      paymentIntent.status === 'requires_action'
        ? 'This card requires additional verification. Use Pay another way to complete checkout.'
        : `Payment failed with status: ${paymentIntent.status}`;
    await updateBillCharge({ chargeId: charge.id, status: 'failed', failureMessage: errMsg });
    return { success: false, error: errMsg };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    const isInvalidPm =
      errMsg.includes('No such PaymentMethod') ||
      (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'resource_missing');

    if (isInvalidPm && bill.stripePaymentMethodId) {
      const { updateBillStripeInfo } = await import('@/lib/bills');
      await updateBillStripeInfo(bill.id, null, null);
      await deleteSavedPaymentMethodByStripePmId(bill.stripePaymentMethodId);
    }

    await updateBillCharge({ chargeId: charge.id, status: 'failed', failureMessage: errMsg });

    if (bill.companyId) {
      await recordBillBillingFailure({
        companyId: bill.companyId,
        billId: bill.id,
        chargeName: bill.description || 'Bill',
        amountCents: Math.round(charge.amount * 100),
        errorMessage: errMsg,
      });
    }

    return { success: false, error: errMsg };
  }
}

async function ensureOpenBillCharge(
  bill: Bill,
  status: 'pending' | 'invoiced' = 'pending'
): Promise<BillCharge> {
  let charge = await getOpenBillCharge(bill.id);
  if (!charge) {
    charge = await createBillCharge({
      billId: bill.id,
      amount: bill.amount,
      lineItemsSnapshot: bill.lineItems,
      status,
    });
  } else if (status === 'invoiced' && charge.status === 'pending') {
    await updateBillCharge({ chargeId: charge.id, status: 'invoiced' });
    charge = { ...charge, status: 'invoiced' };
  }
  return charge;
}

/**
 * Charge an active bill off-session (company saved PM or PM already on the bill). Throws if Stripe does not accept the charge.
 */
export async function chargeBillNow(
  billId: string,
  options: { actingUserId?: string } = {}
): Promise<{ charge: BillCharge; charged: boolean; processing?: boolean; paymentIntentId?: string }> {
  let bill = await getBillById(billId);
  if (!bill) throw new Error('Bill not found');
  if (bill.status === 'completed') throw new Error('Bill is already paid');
  if (bill.status !== 'active') throw new Error('Bill is not active');

  let charge = await getOpenBillCharge(billId);
  if (!charge) {
    charge = await createBillCharge({
      billId: bill.id,
      amount: bill.amount,
      lineItemsSnapshot: bill.lineItems,
      status: 'pending',
    });
  }

  if (bill.companyId) {
    const creds = await resolveStripePaymentMethodForBill(bill.id, bill.companyId, {
      adminUserId: options.actingUserId,
    });
    bill.stripeCustomerId = creds.stripeCustomerId;
    bill.stripePaymentMethodId = creds.stripePaymentMethodId;
  }

  if (!bill.stripePaymentMethodId) {
    throw new Error(
      'No payment method on file. Add a company payment method or use Pay another way on the invoice link.'
    );
  }

  const result = await chargeBillOffSession(bill, charge);
  if (!result.success) {
    throw new Error(result.error || 'Stripe charge failed');
  }

  return {
    charge,
    charged: true,
    processing: result.processing,
    paymentIntentId: result.paymentIntentId,
  };
}

/**
 * On create/activate: charge immediately when auto-charge / attach-company-PM is set; otherwise one invoice or one PM-required email.
 */
export async function deliverBillOnActivation(
  billId: string,
  options: { sendInvoiceEmail?: boolean } = {}
): Promise<{ emailed: boolean; charged: boolean }> {
  let bill = await getBillById(billId);
  if (!bill || bill.status !== 'active') {
    return { emailed: false, charged: false };
  }

  const notify = options.sendInvoiceEmail !== false;
  const today = new Date().toISOString().split('T')[0];
  const isDue = !bill.nextBillingDate || bill.nextBillingDate <= today;
  const chargeFirst =
    bill.collectionMode === 'auto_charge' || bill.attachCompanyPaymentMethod;

  if (!chargeFirst) {
    if (!notify) return { emailed: false, charged: false };
    const charge = await ensureOpenBillCharge(bill, 'invoiced');
    await sendBillInvoiceEmail(bill, charge);
    return { emailed: true, charged: false };
  }

  if (bill.companyId && !bill.stripePaymentMethodId) {
    await attachCompanyPaymentMethodToBill(bill.id, bill.companyId);
    const refreshed = await getBillById(billId);
    if (refreshed) bill = refreshed;
  }

  const shouldTryCharge =
    Boolean(bill.stripePaymentMethodId) &&
    (isDue || bill.attachCompanyPaymentMethod || bill.scheduleType === 'one_time');

  if (shouldTryCharge) {
    try {
      await chargeBillNow(billId);
      return { emailed: false, charged: true };
    } catch (e) {
      console.error('[bill-billing] deliverBillOnActivation charge failed', e);
    }
  }

  if (!bill.stripePaymentMethodId && notify) {
    const charge = await ensureOpenBillCharge(bill, 'pending');
    const alreadyEmailed = await hasPaymentMethodRequiredEmailSent(bill.id, charge.id);
    if (!alreadyEmailed) {
      await sendBillPaymentMethodRequiredEmail(bill, charge);
      await recordBillEvent({
        billId: bill.id,
        billChargeId: charge.id,
        eventType: 'awaiting_payment_method',
        message: 'Recipient emailed to add payment method in their account (no payment link)',
      });
    }
    return { emailed: !alreadyEmailed, charged: false };
  }

  return { emailed: false, charged: false };
}

/** Run one billing cycle for a bill (create charge + charge or email). */
export async function runBillCycle(
  billId: string,
  options: {
    sendInvoiceEmail?: boolean;
    force?: boolean;
    notifyManagementOnFailure?: boolean;
    /** Charge using the company default payment method (company admin pay-now), regardless of collection mode. */
    payWithCompanyPaymentMethod?: boolean;
    /** Company admin user — used to find user-level saved cards when company row has none. */
    actingUserId?: string;
  } = {}
): Promise<{ charge: BillCharge; charged: boolean; emailed: boolean; processing?: boolean }> {
  const bill = await getBillById(billId);
  if (!bill) throw new Error('Bill not found');
  if (bill.status !== 'active' && !options.force) {
    throw new Error('Bill is not active');
  }

  let charge = await getOpenBillCharge(billId);
  if (!charge) {
    charge = await createBillCharge({
      billId: bill.id,
      amount: bill.amount,
      lineItemsSnapshot: bill.lineItems,
      status: 'pending',
    });
  }

  let charged = false;
  let emailed = false;

  if (options.payWithCompanyPaymentMethod) {
    if (!bill.companyId) {
      throw new Error('This bill is not linked to a company account');
    }
    const creds = await resolveStripePaymentMethodForBill(bill.id, bill.companyId, {
      adminUserId: options.actingUserId,
    });
    bill.stripeCustomerId = creds.stripeCustomerId;
    bill.stripePaymentMethodId = creds.stripePaymentMethodId;
    const result = await chargeBillOffSession(bill, charge);
    if (!result.success) {
      await recordBillEvent({
        billId: bill.id,
        billChargeId: charge.id,
        eventType: 'charge_failed',
        message: result.error,
      });
      throw new Error(result.error || 'Payment failed');
    }
    return { charge, charged: true, emailed: false, processing: result.processing };
  }

  if (bill.collectionMode === 'auto_charge') {
    if (!bill.stripePaymentMethodId && bill.companyId) {
      await attachCompanyPaymentMethodToBill(bill.id, bill.companyId, options.actingUserId);
      const refreshed = await getBillById(billId);
      if (refreshed) Object.assign(bill, refreshed);
    }

    if (bill.stripePaymentMethodId) {
      const result = await chargeBillOffSession(bill, charge);
      charged = result.success;
      if (!result.success) {
        await recordBillEvent({
          billId: bill.id,
          billChargeId: charge.id,
          eventType: 'charge_failed',
          message: result.error,
        });
      }
    } else {
      await updateBillCharge({
        chargeId: charge.id,
        status: 'pending',
        failureMessage: 'No payment method on file for auto-charge',
      });
      const alreadyEmailed = await hasPaymentMethodRequiredEmailSent(bill.id, charge.id);
      if (!alreadyEmailed) {
        try {
          await sendBillPaymentMethodRequiredEmail(bill, charge);
          emailed = true;
        } catch (emailErr) {
          console.error('[bill-billing] payment method required email failed', emailErr);
        }
      }
      if (bill.companyId && options.notifyManagementOnFailure !== false) {
        await recordBillBillingFailure({
          companyId: bill.companyId,
          billId: bill.id,
          chargeName: bill.description || 'Bill',
          amountCents: Math.round(charge.amount * 100),
          errorMessage: 'No payment method attached for auto-charge; recipient notified to add one',
        });
      }
    }
  } else {
    await updateBillCharge({ chargeId: charge.id, status: 'invoiced' });
    charge = { ...charge, status: 'invoiced' };
    if (options.sendInvoiceEmail !== false) {
      await sendBillInvoiceEmail(bill, charge);
      emailed = true;
    }
  }

  return { charge, charged, emailed };
}

/** After creating or activating a bill — send invoice / setup emails (see deliverBillOnActivation). */
export async function activateBillInitialCycle(
  billId: string,
  options: { sendInvoiceEmail?: boolean } = {}
): Promise<void> {
  await deliverBillOnActivation(billId, options);
}

export interface BillDueDebugRow {
  id: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  collectionMode: Bill['collectionMode'];
  scheduleType: Bill['scheduleType'];
  nextBillingDate: string | null;
  companyName: string | null;
  hasPaymentMethod: boolean;
  reason: string;
}

export interface ProcessDueBillsResult {
  processed: number;
  errors: Array<{ billId: string; error: string }>;
  remindersSent: number;
  billDebug?: BillDueDebugRow[];
  billReminderDebug?: Array<{
    id: string;
    recipientEmail: string;
    amount: number;
    nextBillingDate: string | null;
    reason: string;
  }>;
}

function describeBillDueAction(bill: Bill): string {
  if (bill.collectionMode === 'invoice_link') {
    return 'would_send_invoice_email';
  }
  if (bill.stripePaymentMethodId) {
    return 'would_auto_charge';
  }
  return 'would_email_invoice_and_payment_method_setup';
}

export async function processDueBills(options?: {
  asOfDate?: string;
  companyId?: string;
  debug?: boolean;
}): Promise<ProcessDueBillsResult> {
  const errors: Array<{ billId: string; error: string }> = [];
  const billDebug: BillDueDebugRow[] = [];
  const billReminderDebug: ProcessDueBillsResult['billReminderDebug'] = [];
  let processed = 0;
  let remindersSent = 0;

  let dueBills = await getDueBills(options?.asOfDate);
  if (options?.companyId) {
    dueBills = dueBills.filter((b) => b.companyId === options.companyId);
  }

  for (const bill of dueBills) {
    if (options?.debug) {
      const { name, email } = getBillDisplayInfo(bill);
      billDebug.push({
        id: bill.id,
        recipientName: name,
        recipientEmail: email,
        amount: bill.amount,
        collectionMode: bill.collectionMode,
        scheduleType: bill.scheduleType,
        nextBillingDate: bill.nextBillingDate,
        companyName: bill.companies?.name ?? null,
        hasPaymentMethod: Boolean(bill.stripePaymentMethodId),
        reason: describeBillDueAction(bill),
      });
      continue;
    }
    try {
      const { charged, emailed } = await runBillCycle(bill.id, {
        sendInvoiceEmail: bill.collectionMode === 'invoice_link',
      });
      if (charged || emailed) processed++;
    } catch (e) {
      errors.push({ billId: bill.id, error: e instanceof Error ? e.message : 'Unknown' });
    }
  }

  // Payment reminders: 3 days before due, invoice_link only
  const supabase = getServerSupabaseClient();
  const reminderBase = options?.asOfDate ? new Date(options.asOfDate + 'T12:00:00') : new Date();
  const reminderDate = new Date(reminderBase);
  reminderDate.setDate(reminderDate.getDate() + 3);
  const reminderDay = reminderDate.toISOString().split('T')[0];

  let reminderQuery = supabase
    .from('bills')
    .select('*')
    .eq('status', 'active')
    .eq('schedule_type', 'recurring')
    .eq('collection_mode', 'invoice_link')
    .eq('next_billing_date', reminderDay)
    .is('last_reminder_sent_at', null);

  if (options?.companyId) {
    reminderQuery = reminderQuery.eq('company_id', options.companyId);
  }

  const { data: reminderBills } = await reminderQuery;

  for (const row of reminderBills || []) {
    if (options?.debug) {
      const bill = await getBillById(row.id as string);
      if (!bill) continue;
      const { email } = getBillDisplayInfo(bill);
      billReminderDebug!.push({
        id: bill.id,
        recipientEmail: email,
        amount: bill.amount,
        nextBillingDate: bill.nextBillingDate,
        reason: 'would_send_upcoming_reminder_email',
      });
      continue;
    }
    const bill = await getBillById(row.id as string);
    if (!bill) continue;
    try {
      const { email, name } = getBillDisplayInfo(bill);
      const publicBase = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
      await sendTransactionalMail({
        from: getPaymentTransactionalFrom(),
        to: email,
        bcc: getPaymentOperationsBcc(),
        subject: `Reminder: upcoming invoice from ${getPaymentCompanyName()}`,
        html: `<p>Hi ${escapeHtml(name)},</p><p>Your next invoice of $${formatMoney(bill.amount)} is due on ${bill.nextBillingDate}. <a href="${publicBase}/payments?token=${bill.publicToken}">View payment link</a></p>`,
        text: `Reminder: $${formatMoney(bill.amount)} due ${bill.nextBillingDate}. Pay: ${publicBase}/payments?token=${bill.publicToken}`,
      });
      await supabase
        .from('bills')
        .update({ last_reminder_sent_at: new Date().toISOString() })
        .eq('id', bill.id);
      remindersSent++;
    } catch (e) {
      console.error('[bill-billing] reminder failed', e);
    }
  }

  return {
    processed,
    errors,
    remindersSent,
    ...(billDebug.length ? { billDebug } : {}),
    ...(billReminderDebug?.length ? { billReminderDebug } : {}),
  };
}
