'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { DollarSign, Loader2, Link2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { type PaymentRequest, getRequestDisplayInfo } from '@/lib/payments-shared';

/** Payment request as returned by /api/admin/payments/with-projects (may be fee/subscription or standalone) */
type PaymentRequestWithProject = PaymentRequest & {
  isSubscription?: boolean;
  subscriptionId?: string;
  payment_request_id?: string | null;
  isFee?: boolean;
  feeId?: string;
  projectItemName?: string;
  project?: { title?: string } | null;
  projectItemType?: string;
  last_billed_date?: string | null;
};

interface PaymentMethod {
  id: string;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  paymentMethodType: 'card' | 'us_bank_account';
  displayName: string | null;
  last4?: string;
  brand?: string;
  isDefault: boolean;
  createdAt: string;
}


interface CompanyPaymentsAttachProps {
  currentUser: any;
  /** When true, do not render the section title/description (for use inside consolidated billing view) */
  hideTitle?: boolean;
}

function getPaymentFrequency(payment: any): string {
  if (payment.billingInterval) {
    return payment.billingInterval.charAt(0).toUpperCase() + payment.billingInterval.slice(1);
  }
  switch (payment.payment_type) {
    case 'one_time': return 'One-Time';
    case 'monthly': return 'Monthly';
    case 'interval_billing': return 'Interval Billing';
    default: return 'One-Time';
  }
}

function isOneTimePayment(payment: any): boolean {
  const frequency = getPaymentFrequency(payment);
  return frequency === 'One-Time' || frequency === 'One-time' || frequency === 'one-time';
}

/** True if this is a recurring subscription (monthly, interval, etc.), false if one-time fee/payment */
function isSubscriptionPayment(payment: any): boolean {
  return payment.isSubscription === true || !isOneTimePayment(payment);
}

function getNextBillingDate(payment: any): Date | null {
  if (isOneTimePayment(payment)) return null;
  if (payment.next_billing_date) {
    const date = new Date(payment.next_billing_date);
    if (!isNaN(date.getTime())) return date;
  }
  const frequency = getPaymentFrequency(payment);
  if (frequency === 'One-Time' || frequency === 'One-time' || frequency === 'one-time') return null;
  let baseDate: Date;
  if (payment.last_billed_date) baseDate = new Date(payment.last_billed_date);
  else if (payment.created_at) baseDate = new Date(payment.created_at);
  else baseDate = new Date();
  const next = new Date(baseDate);
  if (frequency === 'Daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'Weekly') next.setDate(next.getDate() + 7);
  else {
    const dayOfMonth = baseDate.getDate();
    const month = baseDate.getMonth();
    const year = baseDate.getFullYear();
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) { nextMonth = 0; nextYear = year + 1; }
    next.setFullYear(nextYear, nextMonth, 1);
    const daysInMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    next.setDate(Math.min(dayOfMonth, daysInMonth));
  }
  return next;
}

function isPaymentDue(payment: any): boolean {
  const frequency = getPaymentFrequency(payment);
  const hasPaymentMethod = !!payment.stripe_payment_method_id;
  if (frequency === 'One-time') {
    if (payment.status === 'completed') return false;
    // If due date set, only due on or after that date
    if (payment.next_billing_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(payment.next_billing_date);
      due.setHours(0, 0, 0, 0);
      return due <= today;
    }
    return true;
  }
  if (frequency !== 'One-time') {
    const nextBillingDateObj = getNextBillingDate(payment);
    if (nextBillingDateObj) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextBilling = new Date(nextBillingDateObj);
      nextBilling.setHours(0, 0, 0, 0);
      return nextBilling <= today;
    }
    if (!hasPaymentMethod) return true;
    return false;
  }
  return false;
}

export default function CompanyPaymentsAttach({
  currentUser,
  hideTitle = false,
}: CompanyPaymentsAttachProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [attachingPaymentId, setAttachingPaymentId] = useState<string | null>(null);
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<PaymentRequestWithProject | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set());
  const [transactionsMap, setTransactionsMap] = useState<Map<string, any[]>>(new Map());
  const [loadingTransactions, setLoadingTransactions] = useState<Set<string>>(new Set());
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [failureReasons, setFailureReasons] = useState<Map<string, string>>(new Map());
  const [loadingFailureReasons, setLoadingFailureReasons] = useState<Set<string>>(new Set());
  const checkedFailureReasonsRef = useRef<Set<string>>(new Set());


  useEffect(() => {
    void Promise.all([loadPaymentMethods(), loadPaymentRequests()]);
  }, []);

  // Load failure reasons for due payments with payment methods (single batch request)
  useEffect(() => {
    if (paymentRequests.length === 0 || loadingPayments) return;

    const idsToLoad: string[] = [];
    paymentRequests.forEach((req) => {
      const paymentId = req.id;
      const hasPaymentMethod = !!req.stripe_payment_method_id;
      const isDue = isPaymentDue(req);
      if (isDue && hasPaymentMethod && !checkedFailureReasonsRef.current.has(paymentId) && !loadingFailureReasons.has(paymentId)) {
        idsToLoad.push(paymentId);
      }
    });

    if (idsToLoad.length === 0) return;

    idsToLoad.forEach((id) => checkedFailureReasonsRef.current.add(id));
    setLoadingFailureReasons((prev) => new Set([...prev, ...idsToLoad]));

    const params = new URLSearchParams({ ids: idsToLoad.join(',') });
    fetch(`/api/admin/payments/failure-reasons?${params}`)
      .then((res) => (res.ok ? res.json() : { reasons: {} }))
      .then((data) => {
        const reasons = data.reasons || {};
        setFailureReasons((prev) => {
          const newMap = new Map(prev);
          idsToLoad.forEach((id) => {
            newMap.set(id, reasons[id] ?? ''); // '' = checked, no failure
          });
          return newMap;
        });
      })
      .catch((err) => {
        console.error('Error loading failure reasons:', err);
        idsToLoad.forEach((id) => checkedFailureReasonsRef.current.delete(id));
      })
      .finally(() => {
        setLoadingFailureReasons((prev) => {
          const next = new Set(prev);
          idsToLoad.forEach((id) => next.delete(id));
          return next;
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentRequests.length, loadingPayments]);

  const loadPaymentMethods = async () => {
    try {
      const res = await fetch('/api/payments/saved-methods');
      if (res.ok) {
        const data = await res.json();
        // Handle both { methods: [...] } and direct array response
        const methods = data.methods || data || [];
        setPaymentMethods(methods);
        console.log('Loaded payment methods:', methods.length);
      } else {
        console.error('Failed to load payment methods:', res.status);
      }
    } catch (err) {
      console.error('Error loading payment methods:', err);
      toast.error('Failed to load payment methods');
    }
  };

  const loadPaymentRequests = async () => {
    setLoadingPayments(true);
    try {
      const res = await fetch('/api/admin/payments/with-projects');
      if (res.ok) {
        const { payments } = await res.json();
        const paymentsArray = payments || [];

        // Deduplicate payments by ID to prevent duplicates
        const uniquePaymentsMap = new Map<string, any>();
        paymentsArray.forEach((payment: any) => {
          if (payment.id && !uniquePaymentsMap.has(payment.id)) {
            uniquePaymentsMap.set(payment.id, payment);
          }
        });
        const deduplicatedPayments = Array.from(uniquePaymentsMap.values()).filter(
          (p: { status?: string }) => p.status !== 'cancelled'
        );

        // Sort payments: due (red) payments first, then others
        // Helper function to check if payment is due (inline for sorting)
        const checkDue = (p: any) => {
          const getFreq = (pay: any) => {
            if (pay.billingInterval) {
              return pay.billingInterval.charAt(0).toUpperCase() + pay.billingInterval.slice(1);
            }
            switch (pay.payment_type) {
              case 'one_time': return 'One-time';
              case 'monthly': return 'Monthly';
              case 'interval_billing': return 'Interval Billing';
              default: return 'One-Time';
            }
          };
          const freq = getFreq(p);
          const hasPM = !!p.stripe_payment_method_id;
          if (freq === 'One-time') return p.status !== 'completed';
          if (freq !== 'One-time') {
            if (p.next_billing_date) {
              const next = new Date(p.next_billing_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              next.setHours(0, 0, 0, 0);
              return next <= today;
            }
            if (!hasPM) return true;
            return p.status !== 'active' && p.status !== 'completed';
          }
          return false;
        };

        const sortedPayments = deduplicatedPayments.sort((a, b) => {
          const aDue = checkDue(a);
          const bDue = checkDue(b);
          if (aDue && !bDue) return -1; // a is due, b is not - a comes first
          if (!aDue && bDue) return 1;  // b is due, a is not - b comes first
          return 0; // Both same status, keep original order
        });

        // Final deduplication check before setting state
        const finalDeduplicated = Array.from(
          new Map(sortedPayments.map((p: any) => [p.id, p])).values()
        );

        setPaymentRequests(finalDeduplicated);
      } else {
        // Fallback to regular endpoint if new one fails
        const fallbackRes = await fetch('/api/admin/payments');
        if (fallbackRes.ok) {
          const { requests } = await fallbackRes.json();
          setPaymentRequests((requests || []).filter((r: { status?: string }) => r.status !== 'cancelled'));
        }
      }

      // Reset checked failure reasons when payments are reloaded
      checkedFailureReasonsRef.current.clear();
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoadingPayments(false);
      setLoading(false);
    }
  };

  const loadTransactions = async (paymentId: string) => {
    setLoadingTransactions(prev => new Set(prev).add(paymentId));
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactionsMap(prev => {
          const newMap = new Map(prev);
          newMap.set(paymentId, data.transactions || []);
          return newMap;
        });
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoadingTransactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  const handlePayNow = async (payment: any) => {
    const paymentId = payment.id;
    setProcessingPaymentId(paymentId);

    try {
      // Determine payment type
      let paymentType = 'payment_request';
      if (payment.isSubscription) {
        paymentType = 'subscription';
      } else if (payment.isFee) {
        paymentType = 'fee';
      }

      const res = await fetch('/api/admin/payments/pay-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id, // Use the full ID (subscription-{id}, fee-{id}, or payment-{id})
          paymentType,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Clear failure reason cache for this payment
        setFailureReasons(prev => {
          const newMap = new Map(prev);
          newMap.delete(paymentId);
          return newMap;
        });
        checkedFailureReasonsRef.current.delete(paymentId);

        // Reload payments to get updated billing dates
        await loadPaymentRequests();
      } else {
        // Payment failed - show the error reason
        const errorMessage = data.error || 'Failed to process payment';
        toast.error(errorMessage);

        // Update failure reason cache so it shows in the UI
        if (data.error) {
          setFailureReasons(prev => {
            const newMap = new Map(prev);
            newMap.set(paymentId, data.error);
            return newMap;
          });
        }

        // Reload payments to refresh the display
        await loadPaymentRequests();
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      toast.error('Failed to process payment');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleAttachPayment = async () => {
    if (!selectedPaymentRequest || !selectedPaymentMethodId) {
      toast.error('Please select a payment method');
      return;
    }

    setAttachingPaymentId(selectedPaymentRequest.id);
    try {
      const paymentMethod = paymentMethods.find(m => m.id === selectedPaymentMethodId);
      if (!paymentMethod) {
        toast.error('Payment method not found');
        return;
      }

      const requestBody: any = {
        stripeCustomerId: paymentMethod.stripeCustomerId,
        stripePaymentMethodId: paymentMethod.stripePaymentMethodId,
      };

      // Determine what type of payment this is
      if (selectedPaymentRequest.isSubscription) {
        if (!selectedPaymentRequest.payment_request_id) {
          requestBody.subscriptionId = selectedPaymentRequest.subscriptionId;
        } else {
          requestBody.paymentRequestId = selectedPaymentRequest.payment_request_id;
        }
      } else if (selectedPaymentRequest.isFee) {
        requestBody.feeId = selectedPaymentRequest.feeId;
      } else {
        // Regular payment request - check if ID is in format fee-{id} or subscription-{id}
        if (selectedPaymentRequest.id.startsWith('fee-')) {
          requestBody.feeId = selectedPaymentRequest.id.replace('fee-', '');
        } else if (selectedPaymentRequest.id.startsWith('subscription-')) {
          requestBody.subscriptionId = selectedPaymentRequest.id.replace('subscription-', '');
        } else {
          requestBody.paymentRequestId = selectedPaymentRequest.id;
        }
      }

      const res = await fetch('/api/admin/payments/attach-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.paymentProcessed) {
          toast.success('Payment method attached and payment processed successfully');
        } else if (result.paymentStatus) {
          toast.warning(`Payment method attached, but payment ${result.paymentStatus}: ${result.error || ''}`);
        } else {
          toast.success('Payment method attached successfully');
        }
        // Clear failure reason cache for this payment
        if (selectedPaymentRequest) {
          const paymentId = selectedPaymentRequest.id;
          setFailureReasons(prev => {
            const newMap = new Map(prev);
            newMap.delete(paymentId);
            return newMap;
          });
          checkedFailureReasonsRef.current.delete(paymentId);
        }
        loadPaymentRequests();
        setShowAttachDialog(false);
        setSelectedPaymentRequest(null);
        setSelectedPaymentMethodId('');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to attach payment');
      }
    } catch (err) {
      toast.error('Failed to attach payment');
    } finally {
      setAttachingPaymentId(null);
    }
  };

  const openAttachDialog = (paymentRequest: PaymentRequestWithProject) => {
    setSelectedPaymentRequest(paymentRequest);
    setSelectedPaymentMethodId('');
    setShowAttachDialog(true);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'invoiced': return <Badge variant="outline">Invoiced</Badge>;
      case 'completed': return <Badge variant="default">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      case 'active': return <Badge variant="outline">Active</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const [attachingDefault, setAttachingDefault] = useState(false);
  const attachDefaultToAll = async () => {
    setAttachingDefault(true);
    try {
      const res = await fetch('/api/admin/payments/attach-default-to-company', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(data.updated ? `Attached default payment method to ${data.updated} payment(s).` : 'No payments needed updating.');
      loadPaymentRequests();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to attach default');
    } finally {
      setAttachingDefault(false);
    }
  };

  return (
    <div className="space-y-6">
      {!hideTitle && (
      <div>
        <h2 className="text-2xl font-bold">Payments</h2>
        <p className="text-muted-foreground">
          View all payments and attach payment methods to them.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={attachingDefault}
            onClick={attachDefaultToAll}
          >
            {attachingDefault ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Attach default to all
          </Button>
          <span className="text-xs text-muted-foreground">Apply company default payment method to all payments missing one</span>
        </div>
      </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : paymentRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No payments found</p>
          </CardContent>
        </Card>
      ) : (
        (() => {
          const seenIds = new Set<string>();
          const uniquePayments = paymentRequests.filter((req: any) => {
            if (!req.id) return false;
            if (req.status === 'cancelled') return false;
            if (seenIds.has(req.id)) {
              console.warn('[COMPANY-PAYMENTS] Duplicate payment filtered out during render:', req.id);
              return false;
            }
            seenIds.add(req.id);
            return true;
          });
          const subscriptionsList = uniquePayments.filter((req: any) => isSubscriptionPayment(req));
          const oneTimeList = uniquePayments.filter((req: any) => !isSubscriptionPayment(req));

          const renderPaymentItem = (req: PaymentRequestWithProject) => {
            const paymentId = req.id;
            const isSubscription = isSubscriptionPayment(req);
            const displayName = req.isSubscription
              ? (req.projectItemName || req.recipient_name || 'Subscription')
              : (req.projectItemName || req.recipient_name || getRequestDisplayInfo(req).name);
            const projectName = req.project?.title || 'No Project';
            const hasPaymentMethod = !!req.stripe_payment_method_id;
            const amount = req.amount || 0;
            const isDue = isPaymentDue(req);
            const failureReason = failureReasons.get(paymentId);
            const hasBillingFailure = !!failureReason;
            const nextChargeDate = isSubscription ? getNextBillingDate(req) : null;
            const lastChargedDate = isSubscription && req.last_billed_date
              ? new Date(req.last_billed_date)
              : null;
            return (
              <AccordionItem
                key={req.id}
                value={paymentId}
                className={`border rounded-lg ${hasBillingFailure ? 'border-l-4 border-l-red-600 dark:border-l-red-500' : ''}`}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="w-full text-left space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{displayName}</span>
                      <span className="text-muted-foreground text-sm">{projectName}</span>
                      <span className="font-medium">${amount.toFixed(2)}</span>
                      <div className="flex items-center gap-2">
                        {hasBillingFailure && (
                          <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 shrink-0">
                            Billing failed
                          </Badge>
                        )}
                        {statusBadge(req.status)}
                      </div>
                    </div>
                    {isSubscription && (
                      <p className="text-xs text-muted-foreground">
                        Next charge: {nextChargeDate ? nextChargeDate.toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}
                        {' · '}
                        Last charged: {lastChargedDate ? lastChargedDate.toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Never'}
                      </p>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {hasBillingFailure && (
                    <div
                      className="mb-3 rounded-md border border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-950/40 p-3 flex items-start gap-2"
                      role="alert"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-semibold text-red-800 dark:text-red-200 text-sm">Billing failed</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">{failureReason}</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Update payment method or pay now to retry.</p>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAttachDialog(req)}
                      disabled={attachingPaymentId === paymentId}
                    >
                      <Link2 className="w-4 h-4 mr-1" />
                      Attach method
                    </Button>
                    {hasPaymentMethod && isDue && (
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => handlePayNow(req)}
                        disabled={processingPaymentId === paymentId}
                      >
                        {processingPaymentId === paymentId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Pay now
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          };

          return (
            <Accordion type="multiple" value={Array.from(expandedPayments)} onValueChange={(values) => {
              setExpandedPayments(new Set(values));
              values.forEach((value) => {
                if (!transactionsMap.has(value) && !loadingTransactions.has(value)) {
                  loadTransactions(value);
                }
              });
            }}>
              <div className="space-y-8">
                {/* Subscriptions */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Subscriptions</h3>
                  <p className="text-sm text-muted-foreground -mt-1">
                    Recurring charges (monthly, interval billing, etc.). Attach a payment method for automatic billing.
                  </p>
                  {subscriptionsList.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No subscriptions.</p>
                  ) : (
                    <div className="space-y-2">
                      {subscriptionsList.map((req) => renderPaymentItem(req))}
                    </div>
                  )}
                </div>

                {/* One-time payments */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">One-time payments</h3>
                  <p className="text-sm text-muted-foreground -mt-1">
                    Single charges and fees. Attach a payment method and pay when due.
                  </p>
                  {oneTimeList.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No one-time payments.</p>
                  ) : (
                    <div className="space-y-2">
                      {oneTimeList.map((req) => renderPaymentItem(req))}
                    </div>
                  )}
                </div>
              </div>
            </Accordion>
          );
        })()
      )}

      <Dialog open={showAttachDialog} onOpenChange={setShowAttachDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach Payment Method</DialogTitle>
            <DialogDescription>
              Select a payment method to attach to this payment.
            </DialogDescription>
          </DialogHeader>
          {selectedPaymentRequest && (
            <div className="space-y-4">
              <div>
                <Label>Payment</Label>
                <p className="text-sm font-medium">
                  {selectedPaymentRequest.projectItemName || getRequestDisplayInfo(selectedPaymentRequest).name} - ${(selectedPaymentRequest.amount || 0).toFixed(2)}
                </p>
                {selectedPaymentRequest.isSubscription && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Subscription: {selectedPaymentRequest.projectItemName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                {paymentMethods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved payment methods. Add one from the payment methods section.</p>
                ) : (
                  <Select value={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.displayName || (m.last4 ? `•••• ${m.last4}` : 'Payment method')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {attachingPaymentId === selectedPaymentRequest.id && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Attaching...
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAttachDialog(false);
                setSelectedPaymentRequest(null);
                setSelectedPaymentMethodId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAttachPayment}
              disabled={!selectedPaymentMethodId || attachingPaymentId === selectedPaymentRequest?.id}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {attachingPaymentId === selectedPaymentRequest?.id ? 'Attaching...' : 'Attach'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

