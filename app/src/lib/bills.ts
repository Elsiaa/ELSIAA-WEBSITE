/**
 * Unified billing — bills, charges, and events (parallel to legacy payments_requests).
 */

import { getServerSupabaseClient } from '@/lib/supabase';
import { generatePublicToken } from '@/lib/public-token';
import {
  type InvoiceLineItem,
  normalizeInvoiceLineItems,
  totalFromLineItems,
  validateLineItemsForCreate,
} from '@/lib/invoice-line-items';
import {
  getAnySavedMethodForCompany,
  getDefaultPaymentMethod,
  getNextInvoiceNumber,
  getPaymentMethodForBilling,
  getPaymentMethodForUserBilling,
  type SavedPaymentMethod,
} from '@/lib/payments';
import { calculateNextBillingDate } from '@/lib/project-payments';

export type { InvoiceLineItem } from '@/lib/invoice-line-items';

export type BillScheduleType = 'one_time' | 'recurring';
export type BillCollectionMode = 'auto_charge' | 'invoice_link';
export type BillStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type BillRecurrenceInterval = 'daily' | 'weekly' | 'monthly';
export type BillChargeStatus = 'pending' | 'invoiced' | 'paid' | 'failed' | 'cancelled';

const BILL_RECURRENCE_INTERVALS: BillRecurrenceInterval[] = ['daily', 'weekly', 'monthly'];

export function normalizeBillRecurrenceInterval(
  scheduleType: BillScheduleType,
  interval: BillRecurrenceInterval | string | null | undefined
): BillRecurrenceInterval | null {
  if (scheduleType !== 'recurring') return null;
  if (interval && BILL_RECURRENCE_INTERVALS.includes(interval as BillRecurrenceInterval)) {
    return interval as BillRecurrenceInterval;
  }
  return 'monthly';
}

function billDbError(error: { code?: string; message?: string }, action: string): Error {
  if (error.code === '23514' && error.message?.includes('bills_recurrence_interval_check')) {
    return new Error(
      'Daily recurrence is not enabled on the database yet. Run migration add_bills_recurrence_daily.sql in Supabase, or choose Week or Month for repeat.'
    );
  }
  return new Error(`${action}: ${error.message ?? 'unknown error'}`);
}

export interface Bill {
  id: string;
  recipientEmail: string;
  recipientName: string;
  userId: string | null;
  companyId: string | null;
  scheduleType: BillScheduleType;
  collectionMode: BillCollectionMode;
  attachCompanyPaymentMethod: boolean;
  lineItems: InvoiceLineItem[];
  amount: number;
  status: BillStatus;
  recurrenceInterval: BillRecurrenceInterval | null;
  recurrenceDayOfMonth: number | null;
  /** 0=Sunday .. 6=Saturday when recurrenceInterval is weekly */
  recurrenceDayOfWeek: number | null;
  nextBillingDate: string | null;
  stripeCustomerId: string | null;
  stripePaymentMethodId: string | null;
  publicToken: string;
  description: string | null;
  internalNote: string | null;
  lastReminderSentAt: string | null;
  createdByClerkUserId: string;
  createdAt: string;
  updatedAt: string;
  users?: { email: string; first_name: string | null; last_name: string | null } | null;
  companies?: { name: string } | null;
}

export interface BillCharge {
  id: string;
  billId: string;
  invoiceNumber: number | null;
  lineItemsSnapshot: InvoiceLineItem[];
  amount: number;
  status: BillChargeStatus;
  stripePaymentIntentId: string | null;
  failureMessage: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillEvent {
  id: string;
  billId: string;
  billChargeId: string | null;
  eventType: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

function rowToBill(row: Record<string, unknown>): Bill {
  const lineItems = normalizeInvoiceLineItems(row.line_items) ?? [];
  return {
    id: row.id as string,
    recipientEmail: row.recipient_email as string,
    recipientName: row.recipient_name as string,
    userId: (row.user_id as string) ?? null,
    companyId: (row.company_id as string) ?? null,
    scheduleType: row.schedule_type as BillScheduleType,
    collectionMode: row.collection_mode as BillCollectionMode,
    attachCompanyPaymentMethod: Boolean(row.attach_company_payment_method),
    lineItems,
    amount: Number(row.amount),
    status: row.status as BillStatus,
    recurrenceInterval: (row.recurrence_interval as BillRecurrenceInterval) ?? null,
    recurrenceDayOfMonth: row.recurrence_day_of_month != null ? Number(row.recurrence_day_of_month) : null,
    recurrenceDayOfWeek: row.recurrence_day_of_week != null ? Number(row.recurrence_day_of_week) : null,
    nextBillingDate: (row.next_billing_date as string) ?? null,
    stripeCustomerId: (row.stripe_customer_id as string) ?? null,
    stripePaymentMethodId: (row.stripe_payment_method_id as string) ?? null,
    publicToken: row.public_token as string,
    description: (row.description as string) ?? null,
    internalNote: (row.internal_note as string) ?? null,
    lastReminderSentAt: (row.last_reminder_sent_at as string) ?? null,
    createdByClerkUserId: row.created_by_clerk_user_id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    users: row.users as Bill['users'],
    companies: row.companies as Bill['companies'],
  };
}

function rowToBillCharge(row: Record<string, unknown>): BillCharge {
  return {
    id: row.id as string,
    billId: row.bill_id as string,
    invoiceNumber: row.invoice_number != null ? Number(row.invoice_number) : null,
    lineItemsSnapshot: normalizeInvoiceLineItems(row.line_items_snapshot) ?? [],
    amount: Number(row.amount),
    status: row.status as BillChargeStatus,
    stripePaymentIntentId: (row.stripe_payment_intent_id as string) ?? null,
    failureMessage: (row.failure_message as string) ?? null,
    paidAt: (row.paid_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function getBillDisplayInfo(bill: Bill): { name: string; email: string } {
  return {
    name: bill.recipientName || 'Unknown',
    email: bill.recipientEmail || '',
  };
}

export async function recordBillEvent(params: {
  billId: string;
  billChargeId?: string | null;
  eventType: string;
  message?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getServerSupabaseClient();
  await supabase.from('bill_events').insert({
    bill_id: params.billId,
    bill_charge_id: params.billChargeId ?? null,
    event_type: params.eventType,
    message: params.message ?? null,
    metadata: params.metadata ?? null,
  });
}

export async function resolveCompanyIdForBill(params: {
  userId?: string;
  companyId?: string;
}): Promise<string | null> {
  if (params.companyId) return params.companyId;
  if (!params.userId) return null;
  const supabase = getServerSupabaseClient();
  const { data } = await supabase.from('users').select('company_id').eq('id', params.userId).maybeSingle();
  return data?.company_id ?? null;
}

/** Same lookup order as legacy pay-now / attachCompanyDefaultToPaymentRequests. */
export async function findCompanySavedPaymentMethod(
  companyId: string,
  adminUserId?: string
): Promise<SavedPaymentMethod | null> {
  const companyMethod =
    (await getDefaultPaymentMethod({ companyId })) ||
    (await getPaymentMethodForBilling(companyId, 'one_time')) ||
    (await getAnySavedMethodForCompany(companyId));
  if (companyMethod?.stripeCustomerId && companyMethod?.stripePaymentMethodId) {
    return companyMethod;
  }
  if (!adminUserId) return companyMethod;
  return (
    (await getDefaultPaymentMethod({ userId: adminUserId })) ||
    (await getPaymentMethodForUserBilling(adminUserId, 'one_time'))
  );
}

/** Fresh Stripe customer + PM from saved methods — always overwrites stale bill Stripe fields. */
export async function resolveStripePaymentMethodForBill(
  billId: string,
  companyId: string,
  options?: { adminUserId?: string }
): Promise<{ stripeCustomerId: string; stripePaymentMethodId: string }> {
  const method = await findCompanySavedPaymentMethod(companyId, options?.adminUserId);
  if (!method?.stripeCustomerId || !method?.stripePaymentMethodId) {
    throw new Error('No payment method on file. Add one under Payment methods, then try again.');
  }
  await updateBillStripeInfo(billId, method.stripeCustomerId, method.stripePaymentMethodId);
  return {
    stripeCustomerId: method.stripeCustomerId,
    stripePaymentMethodId: method.stripePaymentMethodId,
  };
}

export async function attachCompanyPaymentMethodToBill(
  billId: string,
  companyId: string,
  adminUserId?: string
): Promise<boolean> {
  try {
    await resolveStripePaymentMethodForBill(billId, companyId, { adminUserId });
    return true;
  } catch (e) {
    console.error('[bills] attachCompanyPaymentMethodToBill failed', e);
    return false;
  }
}

/**
 * Attach company default payment method to active auto-charge bills missing Stripe info.
 * Mirrors attachCompanyDefaultToPaymentRequests for the unified bills engine.
 */
export async function attachCompanyDefaultToActiveAutoChargeBills(
  companyId: string
): Promise<{ updated: number; methodFound: boolean }> {
  const method =
    (await getDefaultPaymentMethod({ companyId })) ||
    (await getPaymentMethodForBilling(companyId, 'one_time')) ||
    (await getAnySavedMethodForCompany(companyId));
  if (!method) return { updated: 0, methodFound: false };

  const supabase = getServerSupabaseClient();
  const { data: bills, error } = await supabase
    .from('bills')
    .select('id')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .eq('collection_mode', 'auto_charge')
    .or('stripe_customer_id.is.null,stripe_payment_method_id.is.null');

  if (error) {
    console.error('[bills] attachCompanyDefaultToActiveAutoChargeBills fetch failed', error);
    return { updated: 0, methodFound: true };
  }

  let updated = 0;
  for (const row of bills || []) {
    if (await attachCompanyPaymentMethodToBill(row.id, companyId)) updated++;
  }
  return { updated, methodFound: true };
}

/** Company IDs with at least one due active bill (for cron attach scope). */
export async function getCompanyIdsWithDueBills(asOfDate?: string): Promise<string[]> {
  const due = await getDueBills(asOfDate);
  return [...new Set(due.map((b) => b.companyId).filter((id): id is string => Boolean(id)))];
}

export async function attachUserPaymentMethodToBill(billId: string, userId: string): Promise<boolean> {
  const method =
    (await getPaymentMethodForUserBilling(userId, 'one_time')) || (await getDefaultPaymentMethod({ userId }));
  if (!method) return false;

  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('bills')
    .update({
      stripe_customer_id: method.stripeCustomerId,
      stripe_payment_method_id: method.stripePaymentMethodId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', billId);

  if (error) {
    console.error('[bills] attachUserPaymentMethodToBill failed', error);
    return false;
  }
  return true;
}

function billRecurrenceToInterval(
  recurrence: BillRecurrenceInterval | null | undefined
): 'daily' | 'weekly' | 'monthly' {
  if (recurrence === 'daily') return 'daily';
  if (recurrence === 'weekly') return 'weekly';
  return 'monthly';
}

export function calculateBillNextBillingDate(
  bill: Pick<Bill, 'recurrenceInterval' | 'recurrenceDayOfMonth' | 'recurrenceDayOfWeek'>,
  fromDate?: Date
): Date {
  const interval = billRecurrenceToInterval(bill.recurrenceInterval);
  return calculateNextBillingDate(interval, fromDate, {
    dayOfMonth: bill.recurrenceDayOfMonth ?? undefined,
    dayOfWeek: bill.recurrenceDayOfWeek ?? undefined,
  });
}

/** Resolve first due date from admin input or recurrence anchors. */
export function resolveBillDueDate(params: {
  scheduleType: BillScheduleType;
  recurrenceInterval?: BillRecurrenceInterval;
  recurrenceDayOfMonth?: number;
  recurrenceDayOfWeek?: number;
  dueDate?: string;
}): string {
  const explicit = params.dueDate?.trim().split('T')[0];
  if (explicit) return explicit;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (params.scheduleType === 'one_time') {
    return today.toISOString().split('T')[0];
  }

  const interval = billRecurrenceToInterval(params.recurrenceInterval);
  if (interval === 'daily') {
    return today.toISOString().split('T')[0];
  }
  const next = calculateNextBillingDate(interval, today, {
    dayOfMonth: params.recurrenceDayOfMonth,
    dayOfWeek: params.recurrenceDayOfWeek,
  });
  return next.toISOString().split('T')[0];
}

export async function createBillCharge(params: {
  billId: string;
  amount: number;
  lineItemsSnapshot: InvoiceLineItem[];
  status?: BillChargeStatus;
}): Promise<BillCharge> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('bill_charges')
    .insert({
      bill_id: params.billId,
      amount: params.amount,
      line_items_snapshot: params.lineItemsSnapshot,
      status: params.status ?? 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('[bills] createBillCharge failed', error);
    throw new Error('Failed to create bill charge');
  }
  return rowToBillCharge(data as Record<string, unknown>);
}

export async function getOpenBillCharge(billId: string): Promise<BillCharge | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('bill_charges')
    .select('*')
    .eq('bill_id', billId)
    .in('status', ['pending', 'invoiced'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[bills] getOpenBillCharge failed', error);
    throw new Error('Failed to fetch open bill charge');
  }
  return data ? rowToBillCharge(data as Record<string, unknown>) : null;
}

export async function getLatestPaidBillCharge(billId: string): Promise<BillCharge | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('bill_charges')
    .select('*')
    .eq('bill_id', billId)
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[bills] getLatestPaidBillCharge failed', error);
    throw new Error('Failed to fetch paid bill charge');
  }
  return data ? rowToBillCharge(data as Record<string, unknown>) : null;
}

export async function createBill(params: {
  recipientEmail: string;
  recipientName: string;
  userId?: string;
  companyId?: string;
  scheduleType: BillScheduleType;
  collectionMode: BillCollectionMode;
  attachCompanyPaymentMethod?: boolean;
  lineItems: InvoiceLineItem[];
  status?: BillStatus;
  recurrenceInterval?: BillRecurrenceInterval;
  recurrenceDayOfMonth?: number;
  recurrenceDayOfWeek?: number;
  nextBillingDate?: string;
  dueDate?: string;
  description?: string;
  internalNote?: string;
  createdByClerkUserId: string;
}): Promise<Bill> {
  const validated = validateLineItemsForCreate(params.lineItems);
  if (!validated.ok) {
    throw new Error(validated.error);
  }

  const companyId = await resolveCompanyIdForBill({
    userId: params.userId,
    companyId: params.companyId,
  });

  if (params.attachCompanyPaymentMethod && !companyId) {
    throw new Error('Company is required when attaching a company payment method.');
  }

  const amount = totalFromLineItems(validated.items);
  const publicToken = generatePublicToken(16);
  const status = params.status ?? 'active';

  const nextBillingDate = resolveBillDueDate({
    scheduleType: params.scheduleType,
    recurrenceInterval: params.recurrenceInterval,
    recurrenceDayOfMonth: params.recurrenceDayOfMonth,
    recurrenceDayOfWeek: params.recurrenceDayOfWeek,
    dueDate: params.dueDate ?? params.nextBillingDate,
  });

  const recurrenceInterval = normalizeBillRecurrenceInterval(
    params.scheduleType,
    params.recurrenceInterval
  );

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('bills')
    .insert({
      recipient_email: params.recipientEmail.trim(),
      recipient_name: params.recipientName.trim(),
      user_id: params.userId ?? null,
      company_id: companyId,
      schedule_type: params.scheduleType,
      collection_mode: params.collectionMode,
      attach_company_payment_method: params.attachCompanyPaymentMethod ?? false,
      line_items: validated.items,
      amount,
      status,
      recurrence_interval: recurrenceInterval,
      recurrence_day_of_month: params.recurrenceDayOfMonth ?? null,
      recurrence_day_of_week: params.recurrenceDayOfWeek ?? null,
      next_billing_date: nextBillingDate,
      description: params.description ?? null,
      internal_note: params.internalNote ?? null,
      public_token: publicToken,
      created_by_clerk_user_id: params.createdByClerkUserId,
    })
    .select('*, users (email, first_name, last_name), companies (name)')
    .single();

  if (error) {
    console.error('[bills] createBill failed', error);
    throw billDbError(error, 'Failed to create bill');
  }

  let bill = rowToBill(data as Record<string, unknown>);

  if (params.attachCompanyPaymentMethod && companyId) {
    await attachCompanyPaymentMethodToBill(bill.id, companyId);
    const refreshed = await getBillById(bill.id);
    if (refreshed) bill = refreshed;
  } else if (params.userId) {
    await attachUserPaymentMethodToBill(bill.id, params.userId);
    const refreshed = await getBillById(bill.id);
    if (refreshed) bill = refreshed;
  }

  await recordBillEvent({
    billId: bill.id,
    eventType: 'created',
    message: `Bill created (${bill.scheduleType}, ${bill.collectionMode})`,
  });

  return bill;
}

export async function getBillById(id: string): Promise<Bill | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('bills')
    .select('*, users (email, first_name, last_name), companies (name)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[bills] getBillById failed', error);
    throw new Error('Failed to fetch bill');
  }
  return data ? rowToBill(data as Record<string, unknown>) : null;
}

export async function getBillByToken(token: string): Promise<Bill | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('bills')
    .select('*, users (email, first_name, last_name), companies (name)')
    .eq('public_token', token)
    .maybeSingle();

  if (error) {
    console.error('[bills] getBillByToken failed', error);
    throw new Error('Failed to fetch bill');
  }
  return data ? rowToBill(data as Record<string, unknown>) : null;
}

export type AdminBillsListResult = {
  bills: Bill[];
  chargesByBillId: Record<
    string,
    Array<{
      id: string;
      billId: string;
      invoiceNumber: number | null;
      amount: number;
      status: string;
      paidAt: string | null;
      createdAt: string;
    }>
  >;
};

async function listBillsFromTable(companyId: string | null): Promise<Bill[]> {
  const supabase = getServerSupabaseClient();
  let query = supabase
    .from('bills')
    .select('*, users (email, first_name, last_name), companies (name)')
    .order('created_at', { ascending: false });
  if (companyId) query = query.eq('company_id', companyId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => rowToBill(row as Record<string, unknown>));
}

/** Bills for admin UI; uses RPC with recent charges when available. */
export async function listAdminBillsWithCharges(
  companyId: string | null
): Promise<AdminBillsListResult> {
  const { fetchListAdminBillsWithCharges } = await import('@/lib/admin-db-rpc');
  const rpc = await fetchListAdminBillsWithCharges(companyId, 12);
  if (rpc) {
    const bills = rpc.bills.map((row) => rowToBill(row as Record<string, unknown>));
    const chargesByBillId: AdminBillsListResult['chargesByBillId'] = {};
    for (const [billId, rows] of Object.entries(rpc.chargesByBillId)) {
      chargesByBillId[billId] = (rows || []).map((c) => ({
        id: c.id,
        billId: c.billId ?? billId,
        invoiceNumber: c.invoiceNumber ?? null,
        amount: Number(c.amount),
        status: c.status,
        paidAt: c.paidAt ?? null,
        createdAt: c.createdAt,
      }));
    }
    return { bills, chargesByBillId };
  }

  const bills = await listBillsFromTable(companyId);
  return { bills, chargesByBillId: {} };
}

export async function getAllBills(): Promise<Bill[]> {
  try {
    return (await listAdminBillsWithCharges(null)).bills;
  } catch (error) {
    console.error('[bills] getAllBills failed', error);
    throw new Error('Failed to fetch bills');
  }
}

export async function getBillsByCompany(companyId: string): Promise<Bill[]> {
  try {
    return (await listAdminBillsWithCharges(companyId)).bills;
  } catch (error) {
    console.error('[bills] getBillsByCompany failed', error);
    throw new Error('Failed to fetch company bills');
  }
}

export async function getBillCharges(billId: string): Promise<BillCharge[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('bill_charges')
    .select('*')
    .eq('bill_id', billId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[bills] getBillCharges failed', error);
    throw new Error('Failed to fetch bill charges');
  }
  return (data || []).map((row) => rowToBillCharge(row as Record<string, unknown>));
}

export async function getBillChargeById(chargeId: string): Promise<BillCharge | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('bill_charges')
    .select('*')
    .eq('id', chargeId)
    .maybeSingle();

  if (error) {
    throw new Error('Failed to fetch bill charge');
  }
  return data ? rowToBillCharge(data as Record<string, unknown>) : null;
}

export async function updateBillStatus(billId: string, status: BillStatus): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('bills')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', billId);

  if (error) throw new Error('Failed to update bill status');
}

export async function updateBillStripeInfo(
  billId: string,
  stripeCustomerId: string | null,
  stripePaymentMethodId: string | null
): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('bills')
    .update({
      stripe_customer_id: stripeCustomerId,
      stripe_payment_method_id: stripePaymentMethodId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', billId);

  if (error) throw new Error('Failed to update bill payment method');
}

export async function updateBillCharge(params: {
  chargeId: string;
  status?: BillChargeStatus;
  invoiceNumber?: number;
  amount?: number;
  lineItemsSnapshot?: InvoiceLineItem[];
  stripePaymentIntentId?: string | null;
  failureMessage?: string | null;
  paidAt?: string | null;
}): Promise<void> {
  const supabase = getServerSupabaseClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.status != null) patch.status = params.status;
  if (params.invoiceNumber != null) patch.invoice_number = params.invoiceNumber;
  if (params.amount != null) patch.amount = params.amount;
  if (params.lineItemsSnapshot != null) patch.line_items_snapshot = params.lineItemsSnapshot;
  if (params.stripePaymentIntentId !== undefined) patch.stripe_payment_intent_id = params.stripePaymentIntentId;
  if (params.failureMessage !== undefined) patch.failure_message = params.failureMessage;
  if (params.paidAt !== undefined) patch.paid_at = params.paidAt;

  const { error } = await supabase.from('bill_charges').update(patch).eq('id', params.chargeId);
  if (error) throw new Error('Failed to update bill charge');
}

/** Assign a global invoice number to a charge if it does not have one yet. */
export async function ensureBillChargeInvoiceNumber(charge: BillCharge): Promise<BillCharge> {
  if (charge.invoiceNumber != null) return charge;
  const invoiceNumber = await getNextInvoiceNumber();
  await updateBillCharge({ chargeId: charge.id, invoiceNumber });
  return { ...charge, invoiceNumber };
}

export async function updateBillDetails(
  billId: string,
  params: {
    recipientEmail?: string;
    recipientName?: string;
    description?: string | null;
    internalNote?: string | null;
    nextBillingDate?: string | null;
    lineItems?: InvoiceLineItem[];
    recurrenceInterval?: BillRecurrenceInterval;
    recurrenceDayOfMonth?: number | null;
    recurrenceDayOfWeek?: number | null;
  }
): Promise<Bill> {
  const bill = await getBillById(billId);
  if (!bill) throw new Error('Bill not found');
  if (bill.status === 'cancelled' || bill.status === 'completed') {
    throw new Error('Cannot edit a cancelled or completed bill');
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.recipientEmail != null) patch.recipient_email = params.recipientEmail.trim();
  if (params.recipientName != null) patch.recipient_name = params.recipientName.trim();
  if (params.description !== undefined) patch.description = params.description;
  if (params.internalNote !== undefined) patch.internal_note = params.internalNote;
  if (params.nextBillingDate !== undefined) patch.next_billing_date = params.nextBillingDate;
  if (params.recurrenceInterval != null) {
    patch.recurrence_interval = normalizeBillRecurrenceInterval(bill.scheduleType, params.recurrenceInterval);
  }
  if (params.recurrenceDayOfMonth !== undefined) patch.recurrence_day_of_month = params.recurrenceDayOfMonth;
  if (params.recurrenceDayOfWeek !== undefined) patch.recurrence_day_of_week = params.recurrenceDayOfWeek;

  let lineItems = bill.lineItems;
  let amount = bill.amount;
  if (params.lineItems) {
    const validated = validateLineItemsForCreate(params.lineItems);
    if (!validated.ok) throw new Error(validated.error);
    lineItems = validated.items;
    amount = totalFromLineItems(lineItems);
    patch.line_items = lineItems;
    patch.amount = amount;
  }

  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from('bills').update(patch).eq('id', billId);
  if (error) throw billDbError(error, 'Failed to update bill');

  const openCharge = await getOpenBillCharge(billId);
  if (openCharge && params.lineItems) {
    await updateBillCharge({
      chargeId: openCharge.id,
      amount,
      lineItemsSnapshot: lineItems,
    });
  }

  const updated = await getBillById(billId);
  if (!updated) throw new Error('Bill not found after update');
  return updated;
}

export async function updateBillNextBillingDate(billId: string, nextDate: string | null): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('bills')
    .update({ next_billing_date: nextDate, updated_at: new Date().toISOString() })
    .eq('id', billId);

  if (error) throw new Error('Failed to update next billing date');
}

export async function markBillChargePaid(
  chargeId: string,
  invoiceNumber: number,
  stripePaymentIntentId?: string | null
): Promise<BillCharge> {
  await updateBillCharge({
    chargeId,
    status: 'paid',
    invoiceNumber,
    stripePaymentIntentId: stripePaymentIntentId ?? null,
    paidAt: new Date().toISOString(),
    failureMessage: null,
  });
  const charge = await getBillChargeById(chargeId);
  if (!charge) throw new Error('Bill charge not found after update');
  return charge;
}

/** Record payment received outside Stripe (check, wire, etc.). */
export async function markBillPaidManually(billId: string): Promise<{ invoiceNumber: number }> {
  let bill = await getBillById(billId);
  if (!bill) throw new Error('Bill not found');
  if (bill.status === 'completed') throw new Error('Bill is already paid');
  if (bill.status === 'cancelled') throw new Error('Cannot mark a cancelled bill as paid');

  if (bill.status === 'draft' || bill.status === 'paused') {
    await updateBillStatus(billId, 'active');
    bill = await getBillById(billId);
    if (!bill) throw new Error('Bill not found');
  }

  let charge = await getOpenBillCharge(billId);
  if (!charge) {
    const lineItems =
      bill.lineItems.length > 0
        ? bill.lineItems
        : [{ description: bill.description?.trim() || 'Bill payment', quantity: 1, unit_amount: bill.amount }];
    charge = await createBillCharge({
      billId,
      amount: bill.amount,
      lineItemsSnapshot: lineItems,
    });
  }

  const invoiceNumber = charge.invoiceNumber ?? (await getNextInvoiceNumber());
  await markBillChargePaid(charge.id, invoiceNumber, null);

  if (bill.scheduleType === 'one_time') {
    await updateBillStatus(billId, 'completed');
    await updateBillNextBillingDate(billId, null);
  } else {
    const next = calculateBillNextBillingDate(bill, new Date());
    await updateBillNextBillingDate(billId, next.toISOString().split('T')[0]);
  }

  await recordBillEvent({
    billId,
    billChargeId: charge.id,
    eventType: 'manual_payment',
    message: `Marked paid manually ($${bill.amount.toFixed(2)})`,
    metadata: { invoiceNumber },
  });

  return { invoiceNumber };
}

export async function getDueBills(asOfDate?: string): Promise<Bill[]> {
  const supabase = getServerSupabaseClient();
  const today = asOfDate ?? new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('bills')
    .select('*, users (email, first_name, last_name), companies (name)')
    .eq('status', 'active')
    .not('next_billing_date', 'is', null)
    .lte('next_billing_date', today);

  if (error) {
    console.error('[bills] getDueBills failed', error);
    throw new Error('Failed to fetch due bills');
  }
  return (data || []).map((row) => rowToBill(row as Record<string, unknown>));
}

/**
 * Overdue bills for entitlement / authorization (same rules as legacy payment requests + subscriptions).
 */
export async function getCompanyBillPaymentContribution(companyId: string): Promise<{
  overdueBills: number;
  maxDaysOverdueFromBills: number;
}> {
  const supabase = getServerSupabaseClient();

  const { data: companyUsers } = await supabase.from('users').select('id').eq('company_id', companyId);
  const userIds = companyUsers?.map((u) => u.id) ?? [];

  let query = supabase
    .from('bills')
    .select('id, schedule_type, status, next_billing_date, created_at, company_id, user_id')
    .eq('status', 'active');

  if (userIds.length > 0) {
    query = query.or(`company_id.eq.${companyId},user_id.in.(${userIds.join(',')})`);
  } else {
    query = query.eq('company_id', companyId);
  }

  const { data: bills, error } = await query;

  if (error) {
    console.error('[bills] getCompanyBillPaymentContribution failed', error);
    return { overdueBills: 0, maxDaysOverdueFromBills: 0 };
  }

  const now = new Date();
  const msPerDay = 86_400_000;
  let overdueBills = 0;
  let maxDaysOverdueFromBills = 0;

  for (const row of bills || []) {
    const scheduleType = row.schedule_type as string;
    let dueTime: number | null = null;

    if (scheduleType === 'recurring') {
      if (!row.next_billing_date) continue;
      dueTime = new Date(row.next_billing_date).getTime();
      if (dueTime >= now.getTime()) continue;
    } else {
      if (row.next_billing_date) {
        dueTime = new Date(row.next_billing_date).getTime();
        if (dueTime > now.getTime()) continue;
      } else {
        dueTime = new Date(row.created_at as string).getTime();
      }
    }

    overdueBills++;
    const days = Math.max(0, Math.floor((now.getTime() - dueTime) / msPerDay));
    if (days > maxDaysOverdueFromBills) maxDaysOverdueFromBills = days;
  }

  return { overdueBills, maxDaysOverdueFromBills };
}

export async function duplicateBillAsDraft(
  billId: string,
  createdByClerkUserId: string
): Promise<Bill> {
  const source = await getBillById(billId);
  if (!source) throw new Error('Bill not found');

  return createBill({
    recipientEmail: source.recipientEmail,
    recipientName: source.recipientName,
    userId: source.userId ?? undefined,
    companyId: source.companyId ?? undefined,
    scheduleType: source.scheduleType,
    collectionMode: source.collectionMode,
    attachCompanyPaymentMethod: source.attachCompanyPaymentMethod,
    lineItems: source.lineItems,
    status: 'draft',
    recurrenceInterval: source.recurrenceInterval ?? undefined,
    recurrenceDayOfMonth: source.recurrenceDayOfMonth ?? undefined,
    recurrenceDayOfWeek: source.recurrenceDayOfWeek ?? undefined,
    dueDate: source.nextBillingDate ?? undefined,
    description: source.description ?? undefined,
    internalNote: source.internalNote ?? undefined,
    createdByClerkUserId,
  });
}

export { getNextInvoiceNumber };
