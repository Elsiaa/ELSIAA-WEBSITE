'use client';

import { useState, useEffect, Suspense } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useSearchParams, useRouter } from 'next/navigation';
import { PAYMENT_METHOD_ACH_PENDING_MESSAGE } from '@/lib/payment-method-labels';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PAYMENT_BRAND_LOGO_SRC, POEL_PAYMENTS_HEADER_LOGO_CLASS } from '@/lib/payment-branding';
import { getRequestDisplayInfo } from '@/lib/payments-shared';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentIntent {
  id: string;
  amount: number;
  status: string;
  metadata: {
    originalAmount: string;
    fee: string;
    public_token?: string;
    method?: string;
    payer_email?: string;
    customer_name?: string;
  };
}

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  // Stripe redirect uses payment_intent_client_secret; older links used client_secret
  const clientSecretParam = searchParams.get('client_secret');
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
  const clientSecret = paymentIntentClientSecret || clientSecretParam;
  const paymentIntentIdParam = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');
  const publicTokenParam = searchParams.get('public_token');
  const isSetupIntentParam = searchParams.get('setup_intent') === 'true';
  const customerNameParam = searchParams.get('customer_name');
  const customerEmailParam = searchParams.get('customer_email');
  // Detect SetupIntent by client secret prefix (seti_xxx) vs PaymentIntent (pi_xxx)
  const isSetupIntent = isSetupIntentParam || (clientSecret?.startsWith('seti_') ?? false);
  
  // Get from sessionStorage as fallback if URL params are missing
  const getStoredName = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('payment_customer_name') || '';
    }
    return '';
  };
  const getStoredEmail = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('payment_customer_email') || sessionStorage.getItem('payment_payer_email') || '';
    }
    return '';
  };
  
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const initialName = customerNameParam || getStoredName();
  const initialEmail = customerEmailParam || getStoredEmail();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Only show form if we don't have both name and email
  const [showForm, setShowForm] = useState(!(initialName && initialEmail));
  const [error, setError] = useState('');
  const [statusUpdated, setStatusUpdated] = useState(false);
  const [isACH, setIsACH] = useState(false);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const [invoiceAutoSent, setInvoiceAutoSent] = useState(false);
  const [serverFinalizeDone, setServerFinalizeDone] = useState(false);

  // Helper function to log to server
  const logToServer = (level: string, message: string, data?: any) => {
    fetch('/api/debug/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, data }),
    }).catch(() => {}); // Silently fail if logging fails
    console.log(`[PAYMENT SUCCESS] ${message}`, data);
  };

  useEffect(() => {
    stripePromise.then((stripeInstance) => {
      if (stripeInstance) {
        setStripe(stripeInstance);
      }
    });
  }, []);

  // Sync stored values from sessionStorage if URL params are missing
  useEffect(() => {
    let updatedName = name;
    let updatedEmail = email;
    
    if (!customerNameParam && typeof window !== 'undefined') {
      const storedName = sessionStorage.getItem('payment_customer_name');
      if (storedName && !name) {
        updatedName = storedName;
        setName(storedName);
      }
    }
    if (!customerEmailParam && typeof window !== 'undefined') {
      const storedEmail = sessionStorage.getItem('payment_customer_email') || sessionStorage.getItem('payment_payer_email');
      if (storedEmail && !email) {
        updatedEmail = storedEmail;
        setEmail(storedEmail);
      }
    }
    
    // Update form visibility based on whether we have both name and email
    if (updatedName && updatedEmail) {
      setShowForm(false);
    }
  }, [customerNameParam, customerEmailParam, name, email]);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch('/api/users/me');
          if (res.ok) {
            const data = await res.json();
            // Check if user is admin (company admin or super admin)
            if (data.user?.role === 'admin' || data.isSuperAdmin) {
              setIsAdmin(true);
            }
          }
        } catch (err) {
          console.error('Error checking admin status:', err);
        }
      }
    };
    checkAdmin();
  }, [session?.user?.id]);

  // Prefill name/email for invoice links (no duplicate forms on success page)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlToken = publicTokenParam;
    const storedToken =
      urlToken || sessionStorage.getItem('payment_public_token');
    if (!storedToken) return;
    fetch(`/api/payments/request?token=${encodeURIComponent(storedToken)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const req = data?.request;
        if (req) {
          const { name: n, email: em } = getRequestDisplayInfo(req);
          if (n) setName(n);
          if (em) setEmail(em);
          setShowForm(false);
        }
      })
      .catch(() => {});
  }, [publicTokenParam]);

  // When Stripe strips client_secret from the URL, finalize server-side using payment_intent id (ACH redirects)
  useEffect(() => {
    if (isSetupIntent || serverFinalizeDone || paymentIntent) return;
    if (!paymentIntentIdParam?.startsWith('pi_')) return;
    if (clientSecret) return;

    let cancelled = false;
    const run = async () => {
      logToServer('info', 'Finalize via payment_intent id (no client_secret in URL)', {
        paymentIntentIdParam,
        redirectStatus,
      });
      const stored =
        typeof window !== 'undefined'
          ? publicTokenParam || sessionStorage.getItem('payment_public_token')
          : publicTokenParam;
      try {
        const res = await fetch('/api/payments/record-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntentIdParam,
            publicToken: stored || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as { error?: string }).error || 'record-success failed');
        if (cancelled) return;
        const amt = typeof (data as { displayAmount?: number }).displayAmount === 'number'
          ? Math.round((data as { displayAmount: number }).displayAmount * 100)
          : 0;
        const st = (data as { paymentIntentStatus?: string }).paymentIntentStatus || 'succeeded';
        setPaymentIntent({
          id: paymentIntentIdParam,
          amount: amt,
          status: st,
          metadata: {
            originalAmount: '0',
            fee: '0',
            public_token: stored || '',
            method: 'ach',
          },
        });
        setIsACH(true);
        setStatusUpdated(true);
        setShowForm(false);
        setServerFinalizeDone(true);
        toast.success(
          (data as { alreadyCompleted?: boolean }).alreadyCompleted
            ? 'Payment confirmed.'
            : 'Payment recorded successfully!'
        );
      } catch (e) {
        logToServer('error', 'Server finalize from payment_intent id failed', { error: String(e) });
        if (!cancelled) {
          setError('Could not confirm payment with the server. If you were charged, contact support.');
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [
    isSetupIntent,
    serverFinalizeDone,
    paymentIntent,
    paymentIntentIdParam,
    clientSecret,
    redirectStatus,
    publicTokenParam,
  ]);

  useEffect(() => {
    logToServer('info', 'useEffect triggered', {
      clientSecret: clientSecret?.substring(0, 24) + '...',
      stripe: !!stripe,
      isSetupIntent,
      hasPaymentIntentClientSecret: !!paymentIntentClientSecret,
    });

    if (clientSecret && stripe) {
      if (isSetupIntent) {
        logToServer('info', 'Processing Setup Intent');
        // Handle Setup Intent (for interval_billing - no charge)
        stripe.retrieveSetupIntent(clientSecret).then(({ setupIntent }) => {
          logToServer('info', 'Setup Intent retrieved', { id: setupIntent?.id, status: setupIntent?.status });
          if (setupIntent) {
            const metadata = (setupIntent as any).metadata || {};
            // Try to get public_token from metadata, URL param, or setup intent metadata
            const publicToken = metadata.public_token || publicTokenParam;
            
            if (setupIntent.status === 'succeeded') {
              toast.success('Payment method saved successfully!');
              
              // Save payment method for interval_billing
              if (publicToken && setupIntent.payment_method) {
                console.log('Saving payment method with:', { publicToken, setup_intent_id: setupIntent.id, payment_method: setupIntent.payment_method });
                fetch('/api/payments/save-payment-method', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    public_token: publicToken,
                    setup_intent_id: setupIntent.id,
                  }),
                }).then(async (response) => {
                  // Also save to account if this is an account-based payment
                  if (publicToken) {
                    try {
                      await fetch('/api/payments/save-payment-method-to-account', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          public_token: publicToken,
                          setup_intent_id: setupIntent.id,
                        }),
                      });
                    } catch (err) {
                      // Continue even if account save fails
                      console.error('Error saving payment method to account:', err);
                    }
                  }
                  
                  if (!response.ok) {
                    const error = await response.json();
                    console.error('Failed to save payment method:', error);
                    toast.error('Failed to save payment method. Please contact support.');
                  } else {
                    setStatusUpdated(true);
                    console.log('Payment method saved successfully');
                    // Status will be updated to 'invoiced' by the save-payment-method API
                  }
                }).catch((err) => {
                  console.error('Failed to save payment method:', err);
                  toast.error('Failed to save payment method. Please contact support.');
                });
              } else {
                console.error('Missing publicToken or payment_method:', { 
                  publicToken, 
                  publicTokenParam,
                  metadata,
                  payment_method: setupIntent.payment_method 
                });
                toast.error('Missing payment information. Please contact support.');
              }
              
              // Set a dummy payment intent for display
              setPaymentIntent({
                id: setupIntent.id,
                amount: 0,
                status: 'succeeded',
                metadata: {
                  originalAmount: '0',
                  fee: '0',
                  public_token: publicToken,
                  method: metadata.method || 'card',
                  payer_email: metadata.payer_email || '',
                },
              });
            } else {
              setError('Setup not confirmed as successful.');
              router.push('/payments');
            }
          } else {
            setError('Setup not confirmed as successful.');
            router.push('/payments');
          }
        }).catch((err) => {
          console.error('Error retrieving setup intent:', err);
          setError('Failed to verify setup.');
          router.push('/payments');
        });
      } else {
        logToServer('info', 'Processing Payment Intent');
        // Handle Payment Intent (regular payments)
        stripe.retrievePaymentIntent(clientSecret).then(async ({ paymentIntent }) => {
          logToServer('info', 'Payment Intent retrieved', { 
            id: paymentIntent?.id, 
            status: paymentIntent?.status,
            amount: paymentIntent?.amount,
            customer: (paymentIntent as any)?.customer,
            payment_method: (paymentIntent as any)?.payment_method 
          });
          if (paymentIntent) {
            const metadata = (paymentIntent as any).metadata || {};
            logToServer('info', 'Payment Intent metadata', metadata);
            // Get actual payment method used from Stripe (user may have switched from CC to ACH)
            let actualMethod: 'card' | 'ach' = metadata.method === 'ach' ? 'ach' : 'card';
            try {
              const res = await fetch(`/api/payments/payment-intent-method?paymentIntentId=${paymentIntent.id}`);
              if (res.ok) {
                const data = await res.json();
                if (data.method === 'ach' || data.method === 'card') actualMethod = data.method;
              }
            } catch (e) {
              logToServer('warn', 'Could not fetch actual payment method, using metadata', { error: String(e) });
            }
            const pi: PaymentIntent = {
              id: paymentIntent.id,
              amount: paymentIntent.amount,
              status: paymentIntent.status,
              metadata: {
                originalAmount: metadata.originalAmount || '0',
                fee: metadata.fee || '0',
                public_token: metadata.public_token,
                method: actualMethod,
                payer_email: metadata.payer_email,
                customer_name: metadata.customer_name,
              },
            };
            const achMethod = actualMethod === 'ach';
            // For card payments, both 'succeeded' and 'processing' are valid success states
            // 'processing' can happen when payment requires additional confirmation but will succeed
            const isValidStatus = pi.status === 'succeeded' || pi.status === 'processing';
            logToServer('info', 'Payment Intent status check', { 
              status: pi.status, 
              achMethod, 
              actualMethod,
              isValidStatus
            });
            if (isValidStatus) {
              setPaymentIntent(pi);
              setIsACH(achMethod);
              if (achMethod && pi.metadata.payer_email) {
                setEmail(pi.metadata.payer_email);
              }

              // Send notification email for standalone payments (no public_token) - only for credit card/ACH
              const isStandalonePayment = !pi.metadata.public_token || pi.metadata.public_token === '';
              const paymentMethodType = actualMethod;
              const isCardOrACH = paymentMethodType === 'card' || paymentMethodType === 'ach';
              // Try to get customer name from metadata first, then from URL params, then sessionStorage
              const storedName = typeof window !== 'undefined' ? (sessionStorage.getItem('payment_customer_name') || '') : '';
              const customerName = pi.metadata.customer_name || customerNameParam || storedName || name;
              
              logToServer('info', 'Checking notification conditions', {
                isStandalonePayment,
                paymentMethodType,
                isCardOrACH,
                customerName,
                customerNameFromMetadata: pi.metadata.customer_name,
                customerNameFromParam: customerNameParam,
                hasCustomerName: !!customerName,
                notificationSent,
                metadata: pi.metadata
              });
              
              if (isStandalonePayment && isCardOrACH && customerName && !notificationSent) {
                const total = paymentIntent.amount / 100;
                setNotificationSent(true);
                
                logToServer('info', 'Sending payment notification email', {
                  customerName,
                  amount: total,
                  paymentMethod: paymentMethodType
                });
                
                fetch('/api/payments/notify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    customerName,
                    amount: total,
                    paymentMethod: paymentMethodType,
                  }),
                })
                .then(async (response) => {
                  if (!response.ok) {
                    const errorText = await response.text();
                    logToServer('error', 'Payment notification email failed', {
                      status: response.status,
                      error: errorText
                    });
                  } else {
                    logToServer('info', 'Payment notification email sent successfully');
                  }
                })
                .catch((err) => {
                  logToServer('error', 'Failed to send payment notification email', { error: String(err) });
                });
              } else {
                logToServer('info', 'Notification email not sent', {
                  reason: !isStandalonePayment ? 'not standalone' : 
                          !isCardOrACH ? 'not card/ACH' : 
                          !customerName ? 'no customer name' : 
                          notificationSent ? 'already sent' : 'unknown'
                });
              }

              // Auto-send receipt for standalone checkouts — invoice-link payments use record-success (send-receipt there)
              // Try to get email from: URL param > sessionStorage > metadata payer_email > state
              const storedEmail = typeof window !== 'undefined' ? (sessionStorage.getItem('payment_customer_email') || sessionStorage.getItem('payment_payer_email') || '') : '';
              const invoiceEmail = customerEmailParam || storedEmail || (achMethod ? (pi.metadata.payer_email || '') : '') || email;
              
              if (customerName && invoiceEmail && !invoiceAutoSent && !pi.metadata.public_token) {
                setInvoiceAutoSent(true);
                
                const invoiceName = customerName;
                
                // Calculate amounts
                const total = paymentIntent.amount / 100;
                let originalAmount = parseFloat(pi.metadata.originalAmount || '0');
                let fee = parseFloat(pi.metadata.fee || '0');
                
                if (originalAmount === 0 && fee === 0 && total > 0) {
                  originalAmount = Math.round((total / 1.03) * 100) / 100;
                  fee = total - originalAmount;
                }
                
                logToServer('info', 'Auto-sending payment receipt email', {
                    name: invoiceName,
                    email: invoiceEmail,
                    amount: total,
                    emailSource: customerEmailParam ? 'url_param' : (pi.metadata.payer_email ? 'metadata' : 'state')
                  });
                  
                  fetch('/api/payments/send-receipt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      recipientName: invoiceName,
                      recipientEmail: invoiceEmail,
                      paymentIntentId: paymentIntent.id,
                      amount: originalAmount,
                      fee,
                      total,
                      paymentMethod: actualMethod,
                    }),
                  })
                  .then(async (response) => {
                    if (response.ok) {
                      setShowForm(false);
                      setName(invoiceName);
                      setEmail(invoiceEmail);
                      // Clear sessionStorage after successful send
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('payment_customer_name');
                        sessionStorage.removeItem('payment_customer_email');
                        sessionStorage.removeItem('payment_payer_email');
                      }
                      logToServer('info', 'Receipt email auto-sent successfully');
                      toast.success('Payment receipt sent to your email!');
                    } else {
                      logToServer('error', 'Failed to auto-send receipt', { status: response.status });
                      // If auto-send fails, show form so user can manually enter
                      setInvoiceAutoSent(false);
                      setName(invoiceName);
                      setEmail(invoiceEmail);
                    }
                  })
                  .catch((err) => {
                    logToServer('error', 'Error auto-sending receipt', { error: String(err) });
                    setInvoiceAutoSent(false);
                    setName(invoiceName);
                    setEmail(invoiceEmail);
                  });
              } else if (pi.metadata.public_token) {
                // Invoice link: recipient is on the request — do not ask again on success
                setShowForm(false);
                logToServer('info', 'Invoice link payment; skipping invoice details form', {
                  public_token: pi.metadata.public_token,
                });
              } else if (customerName && !invoiceEmail) {
                // We have name but no email - prefill name and show form for email
                setName(customerName);
                setShowForm(true);
                logToServer('info', 'Prefilling name, showing form for email', { name: customerName });
              } else if (!customerName && invoiceEmail) {
                // We have email but no name - prefill email and show form for name
                setEmail(invoiceEmail);
                setShowForm(true);
                logToServer('info', 'Prefilling email, showing form for name', { email: invoiceEmail });
              } else {
                // We don't have name or email - show form
                setShowForm(true);
                logToServer('info', 'No name or email found, showing form');
              }

              // Invoice-link payments: mark complete in DB first (record-success), then best-effort save PM
              if (pi.metadata.public_token) {
                logToServer('info', 'Processing payment with public_token', { public_token: pi.metadata.public_token });
                const pmRaw = (paymentIntent as any).payment_method;
                const paymentMethodId =
                  typeof pmRaw === 'string' ? pmRaw : pmRaw && typeof pmRaw === 'object' ? pmRaw.id : null;
                logToServer('info', 'Payment method ID extracted', { paymentMethodId });

                const callRecordSuccess = () =>
                  fetch('/api/payments/record-success', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      paymentIntentId: paymentIntent.id,
                      publicToken: pi.metadata.public_token,
                    }),
                  }).then(async (response) => {
                    const data = await response.json().catch(() => ({}));
                    if (!response.ok) {
                      throw new Error((data as { error?: string }).error || 'Failed to record payment');
                    }
                    return data as { invoiceNumber?: number | null; alreadyCompleted?: boolean };
                  });

                callRecordSuccess()
                  .then((data) => {
                    logToServer('info', 'Payment recorded via record-success', data);
                    setStatusUpdated(true);
                    toast.success(
                      data.alreadyCompleted ? 'Payment confirmed.' : 'Payment recorded successfully!'
                    );
                  })
                  .catch((err) => {
                    logToServer('error', 'record-success failed', { error: String(err) });
                    toast.error('Payment completed, but recording failed. Contact support.');
                  });

                if (paymentMethodId) {
                  logToServer('info', 'Calling save-payment-method API (non-blocking after record-success)');
                  fetch('/api/payments/save-payment-method', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      public_token: pi.metadata.public_token,
                      payment_intent_id: paymentIntent.id,
                    }),
                  })
                    .then(async (response) => {
                      logToServer('info', 'save-payment-method response received', {
                        ok: response.ok,
                        status: response.status,
                      });
                      try {
                        await fetch('/api/payments/save-payment-method-to-account', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            public_token: pi.metadata.public_token,
                            payment_intent_id: paymentIntent.id,
                          }),
                        });
                      } catch (err) {
                        logToServer('warn', 'Error saving payment method to account', { error: String(err) });
                      }
                      if (!response.ok) {
                        logToServer('warn', 'Payment method save returned non-ok');
                      }
                    })
                    .catch((err) => {
                      logToServer('warn', 'save-payment-method failed (status already recorded)', {
                        error: String(err),
                      });
                    });
                }
              }
            } else {
              logToServer('error', 'Payment not succeeded', { 
                status: pi.status, 
                achMethod,
                requiredStatus: 'succeeded or processing'
              });
              setError(`Payment not confirmed as successful. Status: ${pi.status}`);
              router.push('/payments');
            }
          } else {
            logToServer('error', 'Payment Intent is null');
            setError('Payment not confirmed as successful.');
            router.push('/payments');
          }
        }).catch((err) => {
          logToServer('error', 'Error retrieving payment intent', {
            message: err?.message,
            stack: err?.stack,
            clientSecret: clientSecret?.substring(0, 20) + '...'
          });
          // If error indicates it's a SetupIntent secret, try retrieving as SetupIntent
          if (err.message && err.message.includes('SetupIntent')) {
            stripe.retrieveSetupIntent(clientSecret).then(({ setupIntent }) => {
              if (setupIntent) {
                const metadata = (setupIntent as any).metadata || {};
                const publicToken = metadata.public_token;
                
                if (setupIntent.status === 'succeeded') {
                  toast.success('Payment method saved successfully!');
                  
                  // Save payment method for interval_billing
                  if (publicToken && setupIntent.payment_method) {
                    fetch('/api/payments/save-payment-method', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        public_token: publicToken,
                        setup_intent_id: setupIntent.id,
                      }),
                    }).then(() => {
                      setStatusUpdated(true);
                    }).catch((err) => {
                      console.error('Failed to save payment method:', err);
                    });
                  }
                  
                  // Set a dummy payment intent for display
                  setPaymentIntent({
                    id: setupIntent.id,
                    amount: 0,
                    status: 'succeeded',
                    metadata: {
                      originalAmount: '0',
                      fee: '0',
                      public_token: publicToken,
                      method: metadata.method || 'card',
                      payer_email: metadata.payer_email || '',
                    },
                  });
                } else {
                  setError('Setup not confirmed as successful.');
                  router.push('/payments');
                }
              } else {
                setError('Setup not confirmed as successful.');
                router.push('/payments');
              }
            }).catch((setupErr) => {
              console.error('Error retrieving setup intent:', setupErr);
              setError('Failed to verify setup.');
              router.push('/payments');
            });
          } else {
            setError('Failed to verify payment.');
            router.push('/payments');
          }
        });
      }
    } else if (clientSecret && !stripe) {
      logToServer('info', 'Waiting for Stripe to load');
      // Wait for Stripe to load
      return;
    } else if (
      !isSetupIntent &&
      paymentIntentIdParam?.startsWith('pi_') &&
      !clientSecret
    ) {
      // ACH / redirect flows may omit client_secret; server finalize uses payment_intent id only
      logToServer('info', 'Waiting for server finalize (payment_intent without client_secret)', {
        paymentIntentIdParam,
      });
      return;
    } else {
      logToServer('error', 'No payment information found', { 
        clientSecret: !!clientSecret, 
        stripe: !!stripe,
        searchParams: Object.fromEntries(searchParams.entries())
      });
      setError('No payment information found.');
      router.push('/payments');
    }
  }, [clientSecret, stripe, router, isSetupIntent, searchParams, paymentIntentIdParam]);

  if (!paymentIntent) {
    if (error) {
      return (
        <div className="container mx-auto py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Could not verify payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">{error}</p>
              <Button className="w-full" onClick={() => router.push('/payments')}>
                Back to payments
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Verifying Payment...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">Please wait while we confirm your payment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate amounts - handle missing metadata gracefully
  const total = paymentIntent.amount / 100;
  let originalAmount = parseFloat(paymentIntent.metadata.originalAmount || '0');
  let fee = parseFloat(paymentIntent.metadata.fee || '0');
  
  // If metadata is empty, calculate from total (assume 3% fee for card payments)
  if (originalAmount === 0 && fee === 0 && total > 0) {
    // For card payments with 3% fee: total = originalAmount * 1.03
    // So originalAmount = total / 1.03, fee = total - originalAmount
    originalAmount = Math.round((total / 1.03) * 100) / 100;
    fee = total - originalAmount;
  }
  
  const payerEmail = paymentIntent.metadata.payer_email;
  const isSetupOnly = total === 0 && isSetupIntent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let submitEmail = email;
    if (isACH && payerEmail && !submitEmail) {
      submitEmail = payerEmail;
    }
    if (!name || !submitEmail) {
      setError('Please provide your name and email.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/payments/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: name,
          recipientEmail: submitEmail,
          paymentIntentId: paymentIntent.id,
          amount: originalAmount,
          fee,
          total,
          paymentMethod: isACH ? 'ach' : 'card',
        }),
      });

      if (response.ok) {
        toast.success('Payment receipt sent to your email!');
        setShowForm(false);
        // Clear sessionStorage after successful send
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('payment_customer_name');
          sessionStorage.removeItem('payment_customer_email');
          sessionStorage.removeItem('payment_payer_email');
        }
      } else {
        const { error } = await response.json();
        setError(error || 'Failed to send receipt.');
      }
    } catch (err) {
      setError('An error occurred while sending your receipt.');
    }

    setIsSubmitting(false);
  };

  const successMessage = isSetupOnly
    ? 'Your payment method has been saved successfully! You\'ll be billed as needed in the future.'
    : isACH 
    ? PAYMENT_METHOD_ACH_PENDING_MESSAGE 
    : 'Thank you for your payment.';

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <img src={PAYMENT_BRAND_LOGO_SRC} alt="ELSIAA" className={POEL_PAYMENTS_HEADER_LOGO_CLASS} />
          <CardTitle>{isSetupOnly ? 'Payment Method Saved!' : 'Payment Successful!'}</CardTitle>
          <CardDescription>
            {successMessage} {!isSetupOnly && `Total charged: $${total.toFixed(2)}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSetupOnly ? (
            <div className="text-center">
              <p className="text-primary mb-4">Your payment method has been securely saved. No charge was made.</p>
              <p className="text-sm text-muted-foreground mb-4">
                You'll receive email notifications when you're billed in the future.
              </p>
              <Button onClick={() => router.push('/')} className="mt-4">
                Back to Home
              </Button>
            </div>
          ) : showForm ? (
            <>
              <p>To email your payment receipt, confirm your name and email:</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required={!(isACH && payerEmail)}
                    disabled={!!(isACH && payerEmail)}
                  />
                  {isACH && payerEmail && <p className="text-xs text-muted-foreground">Email prefilled from payment.</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Sending...' : 'Email receipt'}
                </Button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </form>
            </>
          ) : (
            <div className="text-center">
              <p className="text-primary">
                {invoiceAutoSent
                  ? 'Receipt emailed — check your inbox.'
                  : 'Thank you for your payment.'}
              </p>
              <Button onClick={() => router.push('/')} className="mt-4">
                Back to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
