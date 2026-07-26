'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  DollarSign,
  History,
  Download,
  Loader2,
  FileText,
  PlayCircle,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import PaymentMethodsManagement from '@/components/admin/payment-methods-management';
import CompanyPaymentsAttach from '@/components/admin/company-payments-attach';
import HistoryRowLineItems from '@/components/admin/history-row-line-items';

const GRACE_PERIOD_DAYS = 3;

interface BillingHistoryTransaction {
  id: string;
  type: 'fee' | 'subscription' | 'bill' | 'payment';
  feeName: string | null;
  subscriptionName: string | null;
  billDescription?: string | null;
  billRecipientName?: string | null;
  billId?: string | null;
  chargeId?: string | null;
  projectTitle: string | null;
  amount: number;
  invoiceNumber: number | null;
  paymentRequestId: string | null;
  stripePaymentIntentId: string | null;
  transactionDate: string;
}

interface PaymentStatus {
  allUpToDate: boolean;
  pendingFees: number;
  overdueSubscriptions: number;
  overdueBills: number;
  maxDaysOverdue: number;
}

interface CompanyBillingPaymentsProps {
  currentUser: any;
}

interface CompanyBillRow {
  id: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  status: string;
  scheduleType: string;
  collectionMode: string;
  publicToken: string;
  nextBillingDate: string | null;
}

export default function CompanyBillingPayments({ currentUser }: CompanyBillingPaymentsProps) {
  const [history, setHistory] = useState<BillingHistoryTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [runningBilling, setRunningBilling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [companyBills, setCompanyBills] = useState<CompanyBillRow[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [hasSavedPaymentMethod, setHasSavedPaymentMethod] = useState(false);
  const [loadingSavedMethods, setLoadingSavedMethods] = useState(true);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [expandedHistoryRowId, setExpandedHistoryRowId] = useState<string | null>(null);

  const companyId = currentUser?.company_id;

  const refreshPaymentData = async () => {
    setRefreshing(true);
    setLoadingHistory(true);
    if (companyId) setLoadingStatus(true);
    try {
      const [historyRes, statusRes, billsRes, methodsRes] = await Promise.all([
        fetch('/api/admin/payments/billing-history'),
        companyId
          ? fetch(`/api/companies/${companyId}/payment-status?skipPreemptive=1`)
          : Promise.resolve(null),
        fetch('/api/admin/bills'),
        fetch('/api/payments/saved-methods'),
      ]);
      if (historyRes?.ok) {
        const historyData = await historyRes.json();
        if (Array.isArray(historyData.transactions)) setHistory(historyData.transactions);
      }
      if (statusRes?.ok) {
        const statusData = await statusRes.json();
        if (statusData.status) setPaymentStatus(statusData.status);
      }
      if (billsRes?.ok) {
        const billsData = await billsRes.json();
        setCompanyBills(billsData.bills || []);
      }
      if (methodsRes?.ok) {
        const methodsData = await methodsRes.json();
        setHasSavedPaymentMethod((methodsData.methods?.length ?? 0) > 0);
      }
    } catch {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
      setLoadingHistory(false);
      if (companyId) setLoadingStatus(false);
    }
  };

  // Load billing history and payment status in parallel (one round-trip each)
  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    setLoadingStatus(!!companyId);
    setLoadingBills(true);

    const historyPromise = fetch('/api/admin/payments/billing-history').then((res) =>
      res.ok ? res.json() : { transactions: [] }
    );
    const billsPromise = fetch('/api/admin/bills').then((res) => (res.ok ? res.json() : { bills: [] }));
    const methodsPromise = fetch('/api/payments/saved-methods').then((res) =>
      res.ok ? res.json() : { methods: [] }
    );
    const statusPromise = companyId
      ? fetch(`/api/companies/${companyId}/payment-status?skipPreemptive=1`).then((res) =>
          res.ok ? res.json() : { status: null }
        )
      : Promise.resolve({ status: null });

    Promise.all([historyPromise, statusPromise, billsPromise, methodsPromise])
      .then(([historyData, statusData, billsData, methodsData]) => {
        if (cancelled) return;
        if (Array.isArray(historyData.transactions)) setHistory(historyData.transactions);
        if (statusData.status) setPaymentStatus(statusData.status);
        else if (!companyId) setPaymentStatus(null);
        setCompanyBills(billsData.bills || []);
        setHasSavedPaymentMethod((methodsData.methods?.length ?? 0) > 0);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load payment data');
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingHistory(false);
          setLoadingStatus(false);
          setLoadingBills(false);
          setLoadingSavedMethods(false);
        }
      });

    return () => { cancelled = true; };
  }, [companyId]);

  const getReceiptDownloadUrl = (tx: BillingHistoryTransaction): string | null => {
    if (tx.type === 'bill' && tx.billId && tx.chargeId) {
      return `/api/admin/bills/${tx.billId}/receipt?chargeId=${encodeURIComponent(tx.chargeId)}&format=pdf`;
    }
    if (!tx.paymentRequestId) return null;
    const base = `/api/admin/payments/${tx.paymentRequestId}/receipt?format=pdf`;
    if (tx.stripePaymentIntentId) return `${base}&paymentIntentId=${tx.stripePaymentIntentId}`;
    return base;
  };

  const description = (tx: BillingHistoryTransaction) => {
    if (tx.type === 'bill') {
      const label = tx.billDescription?.trim() || 'Bill';
      return tx.billRecipientName ? `${label} · ${tx.billRecipientName}` : label;
    }
    if (tx.type === 'payment') {
      return tx.billRecipientName?.trim() || 'Payment request';
    }
    if (tx.type === 'fee') {
      return [tx.feeName, tx.projectTitle].filter(Boolean).join(' · ') || 'Fee';
    }
    return [tx.subscriptionName, tx.projectTitle].filter(Boolean).join(' · ') || 'Subscription';
  };

  const runBillingNow = async () => {
    setRunningBilling(true);
    try {
      const res = await fetch('/api/admin/payments/run-company-billing', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Failed to run billing');
        return;
      }
      const total =
        (data.processed ?? 0) + (data.processedPaymentRequests ?? 0) + (data.processedBills ?? 0);
      const errs = (data.errors ?? 0) + (data.paymentRequestErrors ?? 0) + (data.billErrors ?? 0);
      if (errs > 0) {
        toast.warning(`Billing run complete. ${total} charged, ${errs} failed. Check payment methods for failed items.`);
      } else if (total > 0) {
        toast.success(`${total} item(s) charged. Entitlement should update shortly.`);
      } else {
        toast.info(data.hint || 'No due items to charge.');
      }
      await refreshPaymentData();
    } catch (err) {
      toast.error('Failed to run billing');
    } finally {
      setRunningBilling(false);
      setLoadingHistory(false);
    }
  };

  const isSuspended = paymentStatus && !paymentStatus.allUpToDate && paymentStatus.maxDaysOverdue > GRACE_PERIOD_DAYS;
  const isWarning = paymentStatus && !paymentStatus.allUpToDate && paymentStatus.maxDaysOverdue <= GRACE_PERIOD_DAYS;
  const daysRemaining = isWarning && paymentStatus ? GRACE_PERIOD_DAYS - paymentStatus.maxDaysOverdue : 0;

  const activeCompanyBills = useMemo(
    () => companyBills.filter((b) => b.status !== 'cancelled' && b.status !== 'completed'),
    [companyBills]
  );

  const pastCompanyBills = useMemo(
    () => companyBills.filter((b) => b.status === 'completed'),
    [companyBills]
  );

  const billPaymentUrl = (publicToken: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/payments?token=${encodeURIComponent(publicToken)}`;

  const payBillWithSavedMethod = async (billId: string) => {
    setPayingBillId(billId);
    try {
      const res = await fetch(`/api/admin/bills/${billId}/charge-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payWithSavedMethod: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Payment failed');
        return;
      }
      if (data.charged) {
        toast.success(
          data.processing
            ? 'Payment submitted (processing). Receipt will appear in payment history.'
            : 'Payment successful. Receipt will appear in payment history.'
        );
      } else {
        toast.info('No charge was made. Check that a payment method is on file.');
      }
      await refreshPaymentData();
    } catch {
      toast.error('Failed to process payment');
    } finally {
      setPayingBillId(null);
    }
  };

  return (
    <div className="space-y-10">
      {/* Red alerts: billing failed / about to stop authorization */}
      {!loadingStatus && paymentStatus && !paymentStatus.allUpToDate && (
        <div
          className="flex items-start gap-3 rounded-lg border-2 border-red-600/90 bg-red-50 p-4 shadow-sm"
          role="alert"
        >
          {isSuspended ? (
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
          ) : (
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-red-900">
              {isSuspended
                ? 'Access to your projects is suspended'
                : `Payment overdue – access will be suspended in ${daysRemaining} day(s)`}
            </p>
            <p className="mt-1 text-sm text-red-800">
              {isSuspended
                ? 'Overdue payments exceed the grace period. Resolve outstanding payments below to restore access.'
                : 'You have overdue payments. Pay now to avoid suspension of project authorization.'}
            </p>
            {(paymentStatus.pendingFees > 0 ||
              paymentStatus.overdueSubscriptions > 0 ||
              (paymentStatus.overdueBills ?? 0) > 0) && (
              <p className="mt-2 text-sm text-red-700">
                {paymentStatus.pendingFees > 0 && `${paymentStatus.pendingFees} pending fee(s). `}
                {paymentStatus.overdueSubscriptions > 0 &&
                  `${paymentStatus.overdueSubscriptions} overdue subscription(s). `}
                {(paymentStatus.overdueBills ?? 0) > 0 &&
                  `${paymentStatus.overdueBills} overdue bill(s).`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* All billing OK */}
      {!loadingStatus && paymentStatus && paymentStatus.allUpToDate && (
        <div
          className="flex items-start gap-3 rounded-lg border-2 border-primary/35 bg-primary/5 p-4 shadow-sm"
          role="status"
        >
          <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">Billing up to date</p>
            <p className="mt-0.5 text-sm text-[#111]/55">
              All payments are current. Project access is in good standing.
            </p>
          </div>
        </div>
      )}

      {/* Bills (new unified billing) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5" />
            Bills (new)
          </CardTitle>
          <p className="text-sm text-[#111]/55">
            Bills assigned to your company. Pay with your saved payment method below, or use a payment link when offered.
          </p>
        </CardHeader>
        <CardContent>
          {loadingBills ? (
            <p className="text-sm text-[#111]/55 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading bills…
            </p>
          ) : activeCompanyBills.length === 0 && pastCompanyBills.length === 0 ? (
            <p className="text-sm text-[#111]/55">No active bills for your company.</p>
          ) : (
            <ul className="space-y-3">
              {activeCompanyBills.map((bill) => (
                <li
                  key={bill.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/[0.08] p-3"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {bill.recipientName} <span className="text-[#111]/55">({bill.recipientEmail})</span>
                    </p>
                    <p className="text-xs text-[#111]/55 mt-0.5">
                      ${bill.amount.toFixed(2)} · {bill.status} ·{' '}
                      {bill.collectionMode === 'auto_charge' ? 'Auto-charge' : 'Invoice link'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {bill.status === 'active' && hasSavedPaymentMethod && !loadingSavedMethods && (
                      <Button
                        size="sm"
                        disabled={payingBillId === bill.id}
                        onClick={() => payBillWithSavedMethod(bill.id)}
                      >
                        {payingBillId === bill.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                        )}
                        {payingBillId === bill.id ? 'Processing…' : 'Pay with saved method'}
                      </Button>
                    )}
                    {bill.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.open(billPaymentUrl(bill.publicToken), '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        Pay another way
                      </Button>
                    )}
                    {bill.collectionMode === 'invoice_link' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(billPaymentUrl(bill.publicToken));
                          toast.success('Link copied');
                        }}
                      >
                        Copy link
                      </Button>
                    )}
                  </div>
                </li>
              ))}
              {pastCompanyBills.length > 0 && (
                <>
                  <li className="pt-2 text-xs font-semibold uppercase tracking-wide text-[#111]/55">
                    Completed bills
                  </li>
                  {pastCompanyBills.map((bill) => (
                    <li
                      key={bill.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/[0.08]/60 bg-black/[0.04]/20 p-3"
                    >
                      <div>
                        <p className="font-medium text-sm text-[#111]/55">
                          {bill.recipientName} <span>({bill.recipientEmail})</span>
                        </p>
                        <p className="text-xs text-[#111]/55 mt-0.5">
                          ${bill.amount.toFixed(2)} · completed · see payment history for receipt
                        </p>
                      </div>
                    </li>
                  ))}
                </>
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Section 1: Payment methods */}
      <Card id="company-payment-methods">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="w-5 h-5" />
            Payment methods
          </CardTitle>
          <p className="text-sm text-[#111]/55">
            Cards and bank accounts used for billing. Add or remove methods below.
          </p>
        </CardHeader>
        <CardContent>
          <PaymentMethodsManagement
            isSuperAdmin={false}
            currentUser={currentUser}
            hideTitle
          />
        </CardContent>
      </Card>

      {/* Section 2: Payments & subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <DollarSign className="w-5 h-5" />
            Payments & subscriptions
          </CardTitle>
          <p className="text-sm text-[#111]/55">
            Your recurring and one-time charges. Attach a payment method or pay when due.
          </p>
          <div className="mt-3">
            <Button
              variant="destructive"
              size="lg"
              onClick={runBillingNow}
              disabled={runningBilling}
              className="font-semibold text-base"
              title="Run billing for your company now (auto-attach default method and charge all due items). Helps entitlement reflect quickly after fixing payment issues."
            >
              {runningBilling ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="w-5 h-5 mr-2" />
              )}
              Run billing now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CompanyPaymentsAttach currentUser={currentUser} hideTitle />
        </CardContent>
      </Card>

      {/* Section 3: Payment history */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <History className="w-5 h-5" />
                Payment history
              </CardTitle>
              <p className="text-sm text-[#111]/55 mt-1">
                Completed payments and invoices. Download a receipt for any row below.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPaymentData}
              disabled={refreshing}
              title="Refresh payment status and history"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12 text-[#111]/55">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading history…
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-[#111]/55">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No payment history yet.</p>
              <p className="text-sm mt-1">Completed charges will appear here with download links for receipts.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-black/[0.08]/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[0.08]/60 bg-black/[0.04]/40">
                    <th className="text-left font-semibold px-4 py-3">Date</th>
                    <th className="text-left font-semibold px-4 py-3">Description</th>
                    <th className="text-right font-semibold px-4 py-3">Amount</th>
                    <th className="text-center font-semibold px-4 py-3">Invoice #</th>
                    <th className="text-center font-semibold px-4 py-3">Line items</th>
                    <th className="text-center font-semibold px-4 py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx) => {
                    const url = getReceiptDownloadUrl(tx);
                    const rowKey = tx.id;
                    const canShowLineItems = tx.type === 'payment' || tx.type === 'bill';
                    const isExpanded = expandedHistoryRowId === rowKey;
                    return (
                      <Fragment key={rowKey}>
                      <tr className="border-b border-black/[0.08]/40 hover:bg-black/[0.04]/20">
                        <td className="px-4 py-3 whitespace-nowrap text-[#111]/55">
                          {new Date(tx.transactionDate).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3">{description(tx)}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          ${tx.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center text-[#111]/55">
                          {tx.invoiceNumber ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {canShowLineItems ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() =>
                                setExpandedHistoryRowId((prev) => (prev === rowKey ? null : rowKey))
                              }
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {isExpanded ? 'Hide' : 'View'}
                            </Button>
                          ) : (
                            <span className="text-[#111]/55">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 hover:underline"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          ) : (
                            <span className="text-[#111]/55">—</span>
                          )}
                        </td>
                      </tr>
                      {canShowLineItems && isExpanded && (
                        <tr className="border-b border-black/[0.08]/40 bg-black/[0.04]/10">
                          <td colSpan={6} className="px-4 py-3">
                            <HistoryRowLineItems
                              row={{
                                type: tx.type,
                                paymentRequestId: tx.paymentRequestId,
                                billId: tx.billId,
                                chargeId: tx.chargeId,
                              }}
                              active={isExpanded}
                            />
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
