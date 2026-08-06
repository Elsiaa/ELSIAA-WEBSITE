"use client";

import { useState, useEffect, Suspense, useRef, useMemo, type ReactNode } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getRequestDisplayInfo } from "@/lib/payments-shared";
import {
  PAYMENT_BRAND_LOGO_SRC,
  POEL_PAYMENTS_HEADER_LOGO_CLASS,
  getPaymentZelleEmail,
  getPaymentZelleTag,
} from "@/lib/payment-branding";
import {
  PAYMENT_METHOD_LABEL_ACH,
  PAYMENT_METHOD_LABEL_CARD,
  PAYMENT_METHOD_PHRASE_ACH,
} from "@/lib/payment-method-labels";
import AnimatedPoelLogo from "@/components/AnimatedPoelLogo";
import { CheckoutInvoicePanel, isCheckoutPaid } from "@/components/payments/checkout-invoice-panel";
import { ArrowRightLeft, CreditCard, Landmark } from "lucide-react";

const paymentMethodButtonClass =
  "h-auto min-h-[5.75rem] w-full flex flex-row items-center justify-center gap-4 px-6 py-4 text-base font-medium";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/** Legacy interval_billing = $1 setup; bill invoice links always pay the real amount unless setup-only. */
function isSetupOnlyCheckout(request: { payment_type?: string; source?: string } | null): boolean {
  if (!request) return false;
  if (request.source === "bill") {
    return request.payment_type === "interval_billing";
  }
  return request.payment_type === "interval_billing";
}

const stripePaymentAppearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#1e6b3c",
    colorBackground: "#ffffff",
    colorText: "#1c2d3f",
    colorTextSecondary: "#4a6680",
    colorDanger: "#b32e18",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    borderRadius: "8px",
  },
};

function CheckoutForm({
  total,
  clientSecret,
  public_token,
  paymentRequest,
  isSetupIntent = false,
  customerName,
  customerEmail,
  onFormReady,
}: {
  total: number;
  clientSecret: string;
  public_token?: string;
  paymentRequest?: any;
  isSetupIntent?: boolean;
  customerName?: string;
  customerEmail?: string;
  onFormReady?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Notify parent when payment element is ready
  useEffect(() => {
    if (isPaymentElementReady && onFormReady) {
      onFormReady();
    }
  }, [isPaymentElementReady, onFormReady]);

  // Check when PaymentElement is ready using MutationObserver
  useEffect(() => {
    if (!stripe || !elements || isPaymentElementReady) return;

    // Use MutationObserver to detect when PaymentElement renders
    const checkPaymentElement = () => {
      if (formRef.current) {
        // Check if Stripe's payment element has rendered
        const stripeElement =
          formRef.current.querySelector('[data-testid="payment-element"]') ||
          formRef.current.querySelector(".InputElement") ||
          formRef.current.querySelector("input[data-elements-stable-field-name]") ||
          formRef.current.querySelector('iframe[src*="js.stripe.com"]') ||
          formRef.current.querySelector('[class*="StripeElement"]') ||
          formRef.current.querySelector('[id*="card"]');

        if (stripeElement) {
          // Add a small delay to ensure it's fully rendered
          setTimeout(() => {
            setIsPaymentElementReady(true);
          }, 500);
          return true;
        }
      }
      return false;
    };

    // Start checking immediately, no delay
    // Check immediately first
    if (checkPaymentElement()) return;

    // Use MutationObserver to watch for changes
    const observer = new MutationObserver(() => {
      if (checkPaymentElement()) {
        observer.disconnect();
      }
    });

    // Wait a tiny bit for the form ref to be set
    const initTimeout = setTimeout(() => {
      if (formRef.current) {
        observer.observe(formRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
        });
      }
    }, 50);

    // Fallback: show form after 3 seconds even if not detected
    const timeout = setTimeout(() => {
      setIsPaymentElementReady(true);
      observer.disconnect();
    }, 3000);

    return () => {
      clearTimeout(initTimeout);
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [stripe, elements, isPaymentElementReady]);

  if (!stripe || !elements) {
    return (
      <div className="space-y-4 min-h-[400px]">
        <div className="flex items-center justify-center py-8 min-h-[400px]">
          <div className="text-center">
            {/* Simple spinner that shows immediately */}
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <AnimatedPoelLogo width="200px" height="200px" speed={3} />
            <p className="mt-6 text-sm text-muted-foreground">Loading secure payment form...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true);
    setError("");

    // Build return URL with customer info for standalone payments
    let returnUrl = `${window.location.origin}/payments/success?client_secret=${clientSecret}`;
    if (public_token) {
      returnUrl += `&public_token=${encodeURIComponent(public_token)}`;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("payment_public_token", public_token);
      }
      if (paymentRequest) {
        const { name: bn, email: be } = getRequestDisplayInfo(paymentRequest);
        if (bn && bn !== "Unknown") {
          returnUrl += `&customer_name=${encodeURIComponent(bn)}`;
          if (typeof window !== "undefined") {
            sessionStorage.setItem("payment_customer_name", bn);
          }
        }
        if (be && be !== "Unknown") {
          returnUrl += `&customer_email=${encodeURIComponent(be)}`;
          if (typeof window !== "undefined") {
            sessionStorage.setItem("payment_customer_email", be);
            sessionStorage.setItem("payment_payer_email", be);
          }
        }
      }
    }
    if (isSetupIntent) {
      returnUrl += "&setup_intent=true";
    }
    // Add customer info for standalone payments
    if (!public_token && customerName) {
      returnUrl += `&customer_name=${encodeURIComponent(customerName)}`;
      // Also store in sessionStorage as backup
      if (typeof window !== "undefined") {
        sessionStorage.setItem("payment_customer_name", customerName);
      }
    }
    if (!public_token && customerEmail) {
      returnUrl += `&customer_email=${encodeURIComponent(customerEmail)}`;
      // Also store in sessionStorage as backup
      if (typeof window !== "undefined") {
        sessionStorage.setItem("payment_customer_email", customerEmail);
        // Also store as payer_email for ACH payments
        sessionStorage.setItem("payment_payer_email", customerEmail);
      }
    }

    console.log("[PAYMENT] Submitting payment", {
      isSetupIntent,
      clientSecret: clientSecret?.substring(0, 20) + "...",
      public_token,
      customerName,
      customerEmail,
      returnUrl,
    });

    try {
      if (isSetupIntent) {
        // For setup intents (interval_billing), just confirm setup without charging
        console.log("[PAYMENT] Confirming setup intent");
        const { error: confirmError } = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: returnUrl,
          },
        });

        if (confirmError) {
          console.error("[PAYMENT] Setup intent confirmation error:", confirmError);
          setError(confirmError.message || "Setup failed");
          setIsLoading(false);
        } else {
          console.log("[PAYMENT] Setup intent confirmed, redirecting to:", returnUrl);
        }
        // If no error, Stripe will redirect to return_url, so we don't set isLoading to false
      } else {
        // For payment intents, confirm payment
        // Note: setup_future_usage is already set when creating the PaymentIntent,
        // so we don't need to (and shouldn't) pass it here
        console.log("[PAYMENT] Confirming payment intent");
        const { error: confirmError } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: returnUrl,
          },
        });

        if (confirmError) {
          console.error("[PAYMENT] Payment intent confirmation error:", confirmError);
          setError(confirmError.message || "Payment failed");
          setIsLoading(false);
        } else {
          console.log("[PAYMENT] Payment intent confirmed, redirecting to:", returnUrl);
        }
        // If no error, Stripe will redirect to return_url, so we don't set isLoading to false
      }
    } catch (err) {
      console.error("Error confirming payment:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[400px]">
      {!isPaymentElementReady && (
        <div
          className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-md min-h-[400px] w-full"
          style={{ opacity: 1 }}
        >
          <div className="text-center">
            {/* Simple spinner that shows immediately */}
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <AnimatedPoelLogo width="200px" height="200px" speed={3} />
            <p className="mt-6 text-sm text-muted-foreground">Loading secure payment form...</p>
          </div>
        </div>
      )}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <Button
          type="submit"
          disabled={!stripe || isLoading || !isPaymentElementReady}
          className="w-full min-h-12 text-base px-8"
        >
          {isLoading
            ? "Processing..."
            : isSetupIntent
              ? "Save Payment Method"
              : `Pay $${total.toFixed(2)}`}
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </div>
  );
}

function PaymentsPageContent() {
  const searchParams = useSearchParams();
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState(searchParams.get("amount") || "");
  const [total, setTotal] = useState(0);
  const [fee, setFee] = useState(0);
  const [showAmountForm, setShowAmountForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [invoiceName, setInvoiceName] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [invoiceSuccess, setInvoiceSuccess] = useState(false);
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [public_token, setPublicToken] = useState(
    searchParams.get("public_token") || searchParams.get("token") || "",
  );
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [loadingRequest, setLoadingRequest] = useState(!!public_token);
  const [payerEmail, setPayerEmail] = useState("");
  const [showUpdatePaymentMethodDialog, setShowUpdatePaymentMethodDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [isStripeFormLoading, setIsStripeFormLoading] = useState(true);
  // Account-based payment method collection
  const [isAccountBasedPayment, setIsAccountBasedPayment] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([]);
  const [loadingSavedMethods, setLoadingSavedMethods] = useState(false);
  const [showPaymentMethodCollection, setShowPaymentMethodCollection] = useState(false);
  const [collectingPaymentMethod, setCollectingPaymentMethod] = useState(false);

  // If public_token, fetch request
  useEffect(() => {
    if (public_token) {
      const fetchRequest = async () => {
        try {
          setLoadingRequest(true);
          const response = await fetch(`/api/payments/request?token=${public_token}`);

          if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            if (response.status === 403 && errBody.code === "AUTO_CHARGE_SIGN_IN_REQUIRED") {
              setError(
                errBody.error ||
                  "Sign in to your account and add a payment method under Billing & Payments.",
              );
            } else if (response.status === 404) {
              setError("Invalid payment request token.");
            } else {
              setError(errBody.error || "Failed to load payment request.");
            }
            setLoadingRequest(false);
            return;
          }

          const { request } = await response.json();
          if (request) {
            // Check if this is an account-based payment (has user_id)
            const isAccountBased = !!request.user_id;
            setIsAccountBasedPayment(isAccountBased);

            if (isAccountBased) {
              // For account-based payments, check if they have saved payment methods
              setLoadingSavedMethods(true);
              try {
                const methodsRes = await fetch("/api/payments/saved-methods");
                if (methodsRes.ok) {
                  const { methods } = await methodsRes.json();
                  setSavedPaymentMethods(methods || []);

                  // If no saved payment methods, show collection flow
                  if (!methods || methods.length === 0) {
                    setShowPaymentMethodCollection(true);
                  }
                }
              } catch (err) {
                console.error("Error fetching saved payment methods:", err);
              } finally {
                setLoadingSavedMethods(false);
              }
            }

            if (isSetupOnlyCheckout(request)) {
              setAmount("1.00");
              setInvoiceAmount("1.00");
            } else if (request.amount != null && Number(request.amount) > 0) {
              setAmount(String(request.amount));
              setInvoiceAmount(String(request.amount));
            }
            setPaymentRequest(request);
            // Prefill invoice info
            const { name, email } = getRequestDisplayInfo(request);
            setInvoiceName(name);
            setInvoiceEmail(email);
            setPayerEmail(email);

            // Check if payment method is already saved - ask if they want to update it
            // Only for non-account-based payments (account-based uses saved methods)
            if (!isAccountBased) {
              const isRecurring =
                request.payment_type === "interval_billing" || request.payment_type === "monthly";
              if (isRecurring && request.stripe_payment_method_id) {
                setShowUpdatePaymentMethodDialog(true);
              }
            }
          } else {
            setError("Invalid payment request token.");
          }
        } catch (err) {
          console.error("Error fetching payment request:", err);
          setError("Failed to load payment request.");
        } finally {
          setLoadingRequest(false);
        }
      };
      fetchRequest();
    }
  }, [public_token]);

  useEffect(() => {
    if (!public_token) {
      const paramAmountStr = searchParams.get("amount") || "";
      if (paramAmountStr) {
        setAmount(paramAmountStr);
        setInvoiceAmount(paramAmountStr);
      }
    }
  }, [searchParams, public_token]);

  const stripeElementsOptions = useMemo(() => {
    const base = {
      clientSecret,
      appearance: stripePaymentAppearance,
    };
    if (!clientSecret) return base;
    if (public_token && paymentRequest) {
      const { name, email } = getRequestDisplayInfo(paymentRequest);
      const billingDetails: { name?: string; email?: string } = {};
      if (name && name !== "Unknown") billingDetails.name = name;
      if (email && email !== "Unknown") billingDetails.email = email;
      if (Object.keys(billingDetails).length > 0) {
        return { ...base, defaultValues: { billingDetails } };
      }
    }
    return base;
  }, [clientSecret, public_token, paymentRequest]);

  async function proceedToPayment(numAmount: number, method: string) {
    const isCC = method === "cc";
    const isIntervalBilling = isSetupOnlyCheckout(paymentRequest);

    setSelectedMethod(method);
    setError("");

    // Setup-only checkout (legacy interval_billing or bill auto-charge without PM)
    if (isIntervalBilling) {
      setShowPreview(true);
      setIsStripeFormLoading(true); // Show loading immediately, before API call
      setFee(0);
      setTotal(0);
      try {
        let body: any = {
          method: method === "ach" ? "us_bank_account" : "card",
          public_token: public_token,
        };
        if (method === "ach") {
          let emailToSend = public_token ? getRequestDisplayInfo(paymentRequest).email : payerEmail;
          if (!emailToSend) {
            throw new Error(`Email required for ${PAYMENT_METHOD_PHRASE_ACH}`);
          }
          body.email = emailToSend;
        }
        const response = await fetch("/api/payments/create-setup-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Failed to create setup intent" }));
          throw new Error(errorData.error || "Failed to create setup intent");
        }
        const { clientSecret: secret } = await response.json();
        if (secret) {
          setClientSecret(secret);
          toast.success("Ready to save your payment method");
        } else {
          throw new Error("No client secret received");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        toast.error(message);
        setShowPreview(false);
      }
      return;
    }

    // For regular payments, use payment intent
    const calculatedFee = isCC ? numAmount * 0.03 : 0;
    const calculatedTotal = numAmount + calculatedFee;
    setFee(calculatedFee);
    setTotal(calculatedTotal);
    setShowPreview(true);
    setIsStripeFormLoading(true); // Show loading immediately, before API call
    setError("");

    try {
      let body: any = {
        amount: numAmount,
        method: method === "ach" ? "us_bank_account" : "card",
      };
      if (public_token) {
        body.public_token = public_token;
      }
      // For standalone payments (no public_token), include customer name
      if (!public_token && customerName) {
        body.customer_name = customerName;
      }
      if (method === "ach") {
        let emailToSend = public_token ? getRequestDisplayInfo(paymentRequest).email : payerEmail;
        if (!emailToSend) {
          throw new Error(`Email required for ${PAYMENT_METHOD_PHRASE_ACH}`);
        }
        body.email = emailToSend;
      }
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to create payment intent" }));
        throw new Error(errorData.error || "Failed to create payment intent");
      }
      const { clientSecret: secret } = await response.json();
      if (secret) {
        setClientSecret(secret);
        const feeText = isCC ? " (includes 3% fee)" : " (no processing fee)";
        toast.success(`Total to pay: $${calculatedTotal.toFixed(2)}${feeText}`);
      } else {
        throw new Error("No client secret received");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
      setShowPreview(false);
      setShowAmountForm(true);
      // Ensure amount is set to preset
      const fallbackAmount = public_token
        ? paymentRequest?.amount || 0
        : parseFloat(searchParams.get("amount") || "0");
      if (fallbackAmount > 0) {
        setAmount(fallbackAmount.toString());
      }
    }
  }

  if (loadingRequest) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AnimatedPoelLogo width="300px" height="300px" speed={3} />
          <p className="mt-6 text-muted-foreground text-lg">Loading payment request...</p>
        </div>
      </div>
    );
  }

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setError("");

    const isSetupOnly = isSetupOnlyCheckout(paymentRequest);
    const isMonthly = paymentRequest?.payment_type === "monthly";
    const isLegacyInterval =
      paymentRequest?.payment_type === "interval_billing" && paymentRequest?.source !== "bill";
    const isRecurring = isSetupOnly || isMonthly || isLegacyInterval;

    if (isRecurring && (method === "cc" || method === "ach")) {
      // For recurring payments, use $1.00 to save payment method (minimal charge)
      proceedToPayment(1.0, method);
      return;
    }

    const presetAmount = public_token
      ? paymentRequest?.amount || 0
      : parseFloat(searchParams.get("amount") || "0");
    const hasPreset = presetAmount > 0;

    if (method === "cc") {
      if (hasPreset) {
        proceedToPayment(presetAmount, method);
      } else {
        setShowAmountForm(true);
      }
    } else if (method === "ach") {
      if (hasPreset && (public_token || payerEmail)) {
        proceedToPayment(presetAmount, method);
      } else {
        setShowAmountForm(true);
      }
    } else {
      // For non-cc, prefill invoice if ?amount=
      if (!public_token && searchParams.get("amount")) {
        setInvoiceAmount(searchParams.get("amount") || "");
      }
      setShowDialog(true);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    setError("");
  };

  const handleAmountSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    // For standalone payments (no public_token), require name
    if (!public_token && !customerName) {
      setError("Please provide your name");
      return;
    }

    if (selectedMethod === "ach") {
      let emailToSend = public_token ? getRequestDisplayInfo(paymentRequest).email : payerEmail;
      if (!emailToSend) {
        setError(`Please provide your email address for ${PAYMENT_METHOD_PHRASE_ACH}`);
        return;
      }
    }

    const isCC = selectedMethod === "cc";
    const calculatedFee = isCC ? numAmount * 0.03 : 0;
    const calculatedTotal = numAmount + calculatedFee;
    setFee(calculatedFee);
    setTotal(calculatedTotal);
    setShowPreview(true);
    setIsStripeFormLoading(true); // Show loading immediately, before API call
    setError("");

    // Automatically create payment intent
    try {
      let body: any = {
        amount: numAmount,
        method: selectedMethod === "ach" ? "us_bank_account" : "card",
      };
      if (public_token) {
        body.public_token = public_token;
      }
      // For standalone payments (no public_token), include customer name
      if (!public_token && customerName) {
        body.customer_name = customerName;
      }
      if (selectedMethod === "ach") {
        const emailToSend = public_token ? getRequestDisplayInfo(paymentRequest).email : payerEmail;
        body.email = emailToSend;
      }
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }

      const { clientSecret: secret } = await response.json();

      if (secret) {
        setClientSecret(secret);
        const feeText = isCC ? " (includes 3% fee)" : " (no processing fee)";
        toast.success(`Total to pay: $${calculatedTotal.toFixed(2)}${feeText}`);
      } else {
        throw new Error("No client secret received");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
      // Optionally reset to amount form on error
      setShowPreview(false);
    }
  };

  const handleEditAmount = () => {
    setShowPreview(false);
    setShowPaymentForm(false);
    setClientSecret("");
    setIsStripeFormLoading(true);
    setAmount(public_token ? (paymentRequest?.amount || 0).toString() : "");
    const { name, email } =
      public_token && paymentRequest
        ? getRequestDisplayInfo(paymentRequest)
        : { name: "", email: "" };
    setInvoiceName(name);
    setInvoiceEmail(email);
    setPayerEmail(email);
    setInvoiceAmount(public_token ? (paymentRequest?.amount || 0).toString() : "");
    setShowAmountForm(true);
    setSelectedMethod("");
    setShowDialog(false);
    setInvoiceSuccess(false);
    setInvoiceError("");
    setError("");
  };

  const handleBackToSelection = () => {
    setShowAmountForm(false);
    setShowPreview(false);
    setShowPaymentForm(false);
    setSelectedMethod("");
    setClientSecret("");
    setIsStripeFormLoading(true);
    setError("");
    setAmount(public_token ? (paymentRequest?.amount || 0).toString() : "");
    const { name, email } =
      public_token && paymentRequest
        ? getRequestDisplayInfo(paymentRequest)
        : { name: "", email: "" };
    setInvoiceName(name);
    setInvoiceEmail(email);
    setPayerEmail(email);
    setInvoiceAmount(public_token ? (paymentRequest?.amount || 0).toString() : "");
  };

  const handleBackToAmount = () => {
    setShowPreview(false);
    setShowPaymentForm(false);
    setClientSecret("");
    setIsStripeFormLoading(true);
    setShowAmountForm(true);
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceName || !invoiceEmail || !invoiceAmount) {
      setInvoiceError("Please provide your name, email, and amount.");
      return;
    }

    const numAmount = parseFloat(invoiceAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setInvoiceError("Please enter a valid amount greater than 0");
      return;
    }

    setIsSubmittingInvoice(true);
    setInvoiceError("");

    try {
      const body: {
        name: string;
        email: string;
        originalAmount: number;
        fee: number;
        total: number;
        paymentIntentId: string;
        public_token?: string;
      } = {
        name: invoiceName,
        email: invoiceEmail,
        originalAmount: numAmount,
        fee: 0, // No fee for invoice methods
        total: numAmount,
        paymentIntentId: `DUMMY-${Date.now()}-${selectedMethod}`,
        ...(public_token && { public_token }),
      };
      const response = await fetch("/api/payments/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const { error } = await response.json();
        setInvoiceError(error || "Failed to send invoice.");
      } else {
        setInvoiceSuccess(true);
        setInvoiceError("");
        toast.success("Invoice sent to your email!");
        setInvoiceName("");
        setInvoiceEmail("");
        setInvoiceAmount("");
      }
    } catch (err) {
      setInvoiceError("An error occurred while sending the invoice.");
    }

    setIsSubmittingInvoice(false);
  };

  const presetAmount = public_token
    ? paymentRequest?.amount || 0
    : parseFloat(searchParams.get("amount") || "0");
  const hasPreset = presetAmount > 0;
  const isCCorACH = selectedMethod === "cc" || selectedMethod === "ach";
  const numAmount = parseFloat(amount) || 0;
  const showInvoicePanel = Boolean(public_token && paymentRequest);
  const checkoutPaid = isCheckoutPaid(paymentRequest);

  const checkoutShell = (paymentColumn: ReactNode) => (
    <div className={`container mx-auto py-8 px-4 ${showInvoicePanel ? "max-w-5xl" : "max-w-3xl"}`}>
      <div className="flex justify-center mb-6">
        <img
          src={PAYMENT_BRAND_LOGO_SRC}
          alt="ELSIAA"
          className={POEL_PAYMENTS_HEADER_LOGO_CLASS}
        />
      </div>
      {showInvoicePanel ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          <div className="order-2 lg:order-1">
            <CheckoutInvoicePanel paymentRequest={paymentRequest} publicToken={public_token} />
          </div>
          <div className="order-1 lg:order-2">{paymentColumn}</div>
        </div>
      ) : (
        paymentColumn
      )}
    </div>
  );

  if (showPreview && isCCorACH) {
    const methodTitle =
      selectedMethod === "cc" ? PAYMENT_METHOD_LABEL_CARD : PAYMENT_METHOD_LABEL_ACH;
    const feeText =
      selectedMethod === "cc"
        ? ` (includes 3% credit card processing fee—avoidable with ${PAYMENT_METHOD_PHRASE_ACH}, Wire, or Zelle)`
        : " (no processing fee)";
    return checkoutShell(
      <>
        <div className="flex items-center mb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={hasPreset ? handleBackToSelection : handleBackToAmount}
            className="mr-4"
          >
            ← Back
          </Button>
        </div>
        <Card>
          <CardHeader className={showInvoicePanel ? "text-left" : "text-center"}>
            <CardTitle>{methodTitle} Payment</CardTitle>
            <CardDescription>
              {paymentRequest?.payment_type === "interval_billing"
                ? "Setting up your payment method. No charge will be made - we'll just save your payment details for future billing."
                : `Review your payment details. Total: ${total.toFixed(2)}${feeText}`}
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-2">
              Your payment may appear from ELSIAA on your card or bank statement.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentRequest &&
              (paymentRequest.payment_type === "monthly" ||
                paymentRequest.payment_type === "interval_billing") && (
                <div className="rounded-md border border-mist bg-mist/30 p-4">
                  <h4 className="mb-2 font-semibold text-navy">
                    {paymentRequest.payment_type === "interval_billing"
                      ? "Interval Billing Setup"
                      : "Monthly Recurring Payment Setup"}
                  </h4>
                  <p className="text-sm text-slate">
                    {paymentRequest.payment_type === "interval_billing" ? (
                      <>
                        You&apos;re setting up your payment method for interval billing. No charge
                        will be made now - we&apos;ll just save your payment details. After setup,
                        you&apos;ll be billed as needed. You only need to enter your payment details
                        once.
                      </>
                    ) : (
                      <>
                        Your payment method will be saved and you&apos;ll be billed as needed. You
                        only need to enter your payment details once. Only card and{" "}
                        {PAYMENT_METHOD_PHRASE_ACH} payment methods are available.
                      </>
                    )}
                  </p>
                </div>
              )}
            {paymentRequest?.payment_type !== "interval_billing" && (
              <div className="space-y-2">
                <h4 className="font-semibold">Payment Breakdown</h4>
                <div className="border rounded-md p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Service Amount:</span>
                    <span>${numAmount.toFixed(2)}</span>
                  </div>
                  {fee > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>Processing Fee (3%):</span>
                        <span>${fee.toFixed(2)}</span>
                      </div>
                      <hr />
                    </>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Total Due:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            {paymentRequest?.payment_type === "interval_billing" && (
              <div className="rounded-md border border-mist bg-[#ecfdf5] p-4">
                <p className="text-sm text-[#166534]">
                  <strong>No charge will be made.</strong> We&apos;re just saving your payment
                  method securely. You&apos;ll only be charged when you&apos;re billed in the
                  future.
                </p>
              </div>
            )}

            {!clientSecret && isStripeFormLoading && (
              <div className="pt-4 relative min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <AnimatedPoelLogo width="200px" height="200px" speed={3} />
                  <p className="mt-6 text-sm text-muted-foreground">
                    Loading secure payment form...
                  </p>
                </div>
              </div>
            )}

            {clientSecret && (
              <div className="pt-4 relative min-h-[400px]">
                {isStripeFormLoading && (
                  <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-md">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <AnimatedPoelLogo width="200px" height="200px" speed={3} />
                      <p className="mt-6 text-sm text-muted-foreground">
                        Loading secure payment form...
                      </p>
                    </div>
                  </div>
                )}
                <Elements stripe={stripePromise} options={stripeElementsOptions}>
                  <CheckoutForm
                    total={total}
                    clientSecret={clientSecret}
                    public_token={public_token}
                    paymentRequest={paymentRequest}
                    isSetupIntent={paymentRequest?.payment_type === "interval_billing"}
                    customerName={!public_token ? customerName : undefined}
                    customerEmail={
                      !public_token && selectedMethod === "ach" ? payerEmail : undefined
                    }
                    onFormReady={() => setIsStripeFormLoading(false)}
                  />
                </Elements>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={hasPreset ? handleBackToSelection : handleBackToAmount}
                className="min-h-12 min-w-[min(100%,14rem)] flex-1 max-w-md text-base px-8"
              >
                {hasPreset ? "Change Method" : "Edit Amount"}
              </Button>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </CardContent>
        </Card>
      </>,
    );
  }

  if (showAmountForm) {
    const isCC = selectedMethod === "cc";
    const isACH = selectedMethod === "ach";
    const methodDesc = isCC
      ? `Enter the amount you wish to pay. A 3% credit card processing fee will be added (this fee can be avoided by choosing ${PAYMENT_METHOD_PHRASE_ACH}, Wire Transfer, or Zelle).`
      : isACH
        ? `Enter the amount and your email for ${PAYMENT_METHOD_PHRASE_ACH}. No processing fee.`
        : "Enter the amount for your payment.";
    return (
      <div className="container mx-auto py-8 max-w-md">
        <div className="flex items-center mb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBackToSelection}
            className="mr-4"
          >
            ← Back
          </Button>
        </div>
        <Card>
          <CardHeader className="text-center">
            <img
              src={PAYMENT_BRAND_LOGO_SRC}
              alt="ELSIAA"
              className={POEL_PAYMENTS_HEADER_LOGO_CLASS}
            />
            <CardTitle>
              {isCC
                ? PAYMENT_METHOD_LABEL_CARD
                : isACH
                  ? PAYMENT_METHOD_LABEL_ACH
                  : selectedMethod.toUpperCase()}{" "}
              Payment
            </CardTitle>
            <CardDescription>
              {hasPreset ? `Payment request for $${presetAmount.toFixed(2)}.` : methodDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAmountSubmit} className="space-y-4">
              {!public_token && (
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium mb-1">
                    Full Name
                  </label>
                  <Input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      // Store in sessionStorage immediately
                      if (typeof window !== "undefined") {
                        sessionStorage.setItem("payment_customer_name", e.target.value);
                      }
                    }}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium mb-1">
                  Amount ($)
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                  required
                  disabled={hasPreset}
                />
                {hasPreset && (
                  <p className="text-sm text-muted-foreground mt-1">Amount preset by request.</p>
                )}
              </div>
              {isACH && !(public_token && paymentRequest) && (
                <div className="space-y-1">
                  <label htmlFor="payerEmail" className="block text-sm font-medium mb-1">
                    Email Address
                  </label>
                  <Input
                    id="payerEmail"
                    type="email"
                    value={payerEmail}
                    onChange={(e) => {
                      setPayerEmail(e.target.value);
                      // Store in sessionStorage immediately
                      if (typeof window !== "undefined") {
                        sessionStorage.setItem("payment_payer_email", e.target.value);
                      }
                    }}
                    placeholder="Enter your email"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for {PAYMENT_METHOD_PHRASE_ACH} verification.
                  </p>
                </div>
              )}
              <Button type="submit" className="w-full min-h-12 text-base px-8">
                {isCC || isACH ? "Continue to Payment" : "Continue"}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>
            <Button
              type="button"
              variant="outline"
              onClick={handleBackToSelection}
              className="w-full mt-2 min-h-12 text-base px-8"
            >
              Change Method
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show update payment method dialog if payment method already exists
  if (showUpdatePaymentMethodDialog && paymentRequest) {
    return (
      <Dialog open={showUpdatePaymentMethodDialog} onOpenChange={setShowUpdatePaymentMethodDialog}>
        <DialogContent className="poel-light-shell max-w-md border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Update Payment Method?</DialogTitle>
            <DialogDescription>
              You already have a payment method saved for this{" "}
              {paymentRequest.payment_type === "interval_billing" ? "interval billing" : "monthly"}{" "}
              payment. Would you like to update it with a new payment method?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowUpdatePaymentMethodDialog(false);
                // Show message that they already have a payment method
                toast.info("Your existing payment method will be used for future billing.");
              }}
            >
              Keep Existing
            </Button>
            <Button
              onClick={() => {
                setShowUpdatePaymentMethodDialog(false);
                // Proceed to payment method selection to update
              }}
            >
              Update Payment Method
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show payment method collection for account-based payments without saved methods
  if (showPaymentMethodCollection && isAccountBasedPayment) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <img
              src={PAYMENT_BRAND_LOGO_SRC}
              alt="ELSIAA"
              className={POEL_PAYMENTS_HEADER_LOGO_CLASS}
            />
            <CardTitle>Set Up Payment Methods</CardTitle>
            <CardDescription>
              To enable automatic billing for your account, please add at least one payment method.
              You can add multiple payment methods and choose which one to use for each payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {collectingPaymentMethod ? (
              <div className="space-y-4">
                <div className="rounded-md border border-mist bg-mist/30 p-4">
                  <p className="text-sm text-slate">
                    We're setting up your payment method. No charge will be made - we'll just save
                    your payment details for future billing.
                  </p>
                </div>
                {clientSecret && (
                  <Elements stripe={stripePromise} options={stripeElementsOptions}>
                    <CheckoutForm
                      total={0}
                      clientSecret={clientSecret}
                      public_token={public_token}
                      paymentRequest={paymentRequest}
                      isSetupIntent={true}
                      onFormReady={() => setIsStripeFormLoading(false)}
                    />
                  </Elements>
                )}
                {!clientSecret && isStripeFormLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Loading secure payment form...
                      </p>
                    </div>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setCollectingPaymentMethod(false);
                    setClientSecret("");
                    setIsStripeFormLoading(true);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className={paymentMethodButtonClass}
                    onClick={async () => {
                      setCollectingPaymentMethod(true);
                      setIsStripeFormLoading(true);
                      try {
                        const { name, email } = getRequestDisplayInfo(paymentRequest);
                        const response = await fetch("/api/payments/create-setup-intent", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            method: "card",
                            public_token: public_token,
                            email: email,
                          }),
                        });
                        if (!response.ok) {
                          throw new Error("Failed to create setup intent");
                        }
                        const { clientSecret: secret } = await response.json();
                        setClientSecret(secret);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "An error occurred");
                        setCollectingPaymentMethod(false);
                      }
                    }}
                  >
                    <CreditCard
                      className="size-9 shrink-0 text-muted-foreground"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span>Add Credit Card</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={paymentMethodButtonClass}
                    onClick={async () => {
                      setCollectingPaymentMethod(true);
                      setIsStripeFormLoading(true);
                      try {
                        const { name, email } = getRequestDisplayInfo(paymentRequest);
                        const response = await fetch("/api/payments/create-setup-intent", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            method: "us_bank_account",
                            public_token: public_token,
                            email: email,
                          }),
                        });
                        if (!response.ok) {
                          throw new Error("Failed to create setup intent");
                        }
                        const { clientSecret: secret } = await response.json();
                        setClientSecret(secret);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "An error occurred");
                        setCollectingPaymentMethod(false);
                      }
                    }}
                  >
                    <Landmark
                      className="size-9 shrink-0 text-muted-foreground"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span>Add {PAYMENT_METHOD_LABEL_ACH}</span>
                  </Button>
                </div>
                {savedPaymentMethods.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Saved Payment Methods</h4>
                    <div className="space-y-2">
                      {savedPaymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div>
                            <span className="font-medium">{method.displayName}</span>
                            {method.isDefault && (
                              <Badge variant="secondary" className="ml-2">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {savedPaymentMethods.length > 0 && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setShowPaymentMethodCollection(false);
                    }}
                  >
                    Continue with Saved Payment Methods
                  </Button>
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dialog for Wire/Zelle
  return (
    <>
      {checkoutShell(
        <Card>
          <CardHeader className={showInvoicePanel ? "text-left" : "text-center"}>
            <CardTitle>
              {checkoutPaid
                ? "Payment complete"
                : paymentRequest?.status === "cancelled"
                  ? "Invoice cancelled"
                  : "Make a Payment"}
            </CardTitle>
            <CardDescription>
              {checkoutPaid
                ? "This invoice has already been paid. You can download your receipt from the summary."
                : paymentRequest?.status === "cancelled"
                  ? "This invoice is no longer payable. Contact us if you have questions."
                  : `Select your preferred payment method. Note: Credit card payments include a 3% processing fee, which can be avoided with ${PAYMENT_METHOD_PHRASE_ACH}, Wire Transfer, or Zelle.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkoutPaid || paymentRequest?.status === "cancelled" ? (
              <p className="text-sm text-muted-foreground">
                {checkoutPaid
                  ? "Thank you — no further action is needed."
                  : "Payment methods are unavailable for cancelled invoices."}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {(!paymentRequest ||
                    (paymentRequest.payment_type !== "monthly" &&
                      paymentRequest.payment_type !== "interval_billing")) && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className={paymentMethodButtonClass}
                        onClick={() => handleMethodSelect("zelle")}
                      >
                        <img
                          src="/payment-zelle.svg"
                          alt=""
                          className="h-9 w-9 shrink-0"
                          width={36}
                          height={36}
                          aria-hidden
                        />
                        <span>Zelle</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className={paymentMethodButtonClass}
                        onClick={() => handleMethodSelect("wire")}
                      >
                        <ArrowRightLeft
                          className="size-9 shrink-0 text-muted-foreground"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        <span>Wire Transfer</span>
                      </Button>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className={paymentMethodButtonClass}
                    onClick={() => handleMethodSelect("ach")}
                  >
                    <Landmark
                      className="size-9 shrink-0 text-muted-foreground"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span>{PAYMENT_METHOD_LABEL_ACH}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={paymentMethodButtonClass}
                    onClick={() => handleMethodSelect("cc")}
                  >
                    <CreditCard
                      className="size-9 shrink-0 text-muted-foreground"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span>Credit Card</span>
                  </Button>
                </div>
                {paymentRequest &&
                  (paymentRequest.payment_type === "monthly" ||
                    paymentRequest.payment_type === "interval_billing") && (
                    <p className="text-sm text-muted-foreground mt-4 text-center lg:text-left">
                      Only card and {PAYMENT_METHOD_PHRASE_ACH} payment methods are available for
                      recurring payments.
                    </p>
                  )}
              </>
            )}
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </CardContent>
        </Card>,
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="poel-light-shell max-w-md border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>{selectedMethod.toUpperCase()} Payment Instructions</DialogTitle>
            <DialogDescription>
              Follow these steps to complete your payment. These methods are handled off-site.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Wire transfer: bank fields below (only place in app). */}
            {selectedMethod === "wire" && (
              <div className="space-y-2">
                <h4 className="font-semibold">Wire Transfer Details</h4>
                {public_token && paymentRequest?.amount ? (
                  <p className="text-sm">
                    Please initiate a wire transfer for ${paymentRequest.amount}.
                  </p>
                ) : (
                  <p className="text-sm">
                    Please initiate a wire transfer. Contact us to confirm the amount and receive
                    exact details.
                  </p>
                )}
                <div className="border rounded-md p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Bank Name:</span>
                    <span>JPMorgan Chase Bank, N.A.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Number:</span>
                    <span>2917044495</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wire Routing Number:</span>
                    <span>021000021</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Name:</span>
                    <span>ELSIAA</span>
                  </div>
                </div>
              </div>
            )}
            {selectedMethod === "zelle" && (
              <div className="space-y-2">
                <h4 className="font-semibold">Zelle Payment Details</h4>
                {public_token && paymentRequest?.amount ? (
                  <p className="text-sm">Send ${paymentRequest.amount} via Zelle.</p>
                ) : (
                  <p className="text-sm">
                    Send payment via Zelle. Contact us to confirm the amount.
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Send to ELSIAA using the Zelle tag below or the payments email—either works.
                </p>
                <div className="border rounded-md p-3 space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <span>Zelle tag (ELSIAA):</span>
                    <span className="text-right font-medium">{getPaymentZelleTag()}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Email:</span>
                    <span className="text-right font-medium break-all">
                      {getPaymentZelleEmail()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Request Form in Dialog */}
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-3">Request Invoice</h5>
              <p className="text-xs mb-3">
                Provide details including the payment amount to receive an invoice:
              </p>
              <form onSubmit={handleInvoiceSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="invoiceName" className="text-xs font-medium block">
                    Full Name
                  </label>
                  <Input
                    id="invoiceName"
                    value={invoiceName}
                    onChange={(e) => setInvoiceName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="invoiceEmail" className="text-xs font-medium block">
                    Email Address
                  </label>
                  <Input
                    id="invoiceEmail"
                    type="email"
                    value={invoiceEmail}
                    onChange={(e) => setInvoiceEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="invoiceAmount" className="text-xs font-medium block">
                    Amount ($)
                  </label>
                  <Input
                    id="invoiceAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                    disabled={(public_token && paymentRequest) || !!searchParams.get("amount")}
                  />
                  {(public_token && paymentRequest) || !!searchParams.get("amount") ? (
                    <p className="text-xs text-muted-foreground">Amount preset by request.</p>
                  ) : null}
                </div>
                <Button type="submit" size="sm" disabled={isSubmittingInvoice} className="w-full">
                  {isSubmittingInvoice ? "Sending..." : "Send Invoice Request"}
                </Button>
                {invoiceError && <p className="text-red-500 text-xs">{invoiceError}</p>}
                {invoiceSuccess && (
                  <p className="text-primary text-xs">Sent successfully! Check your email.</p>
                )}
              </form>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <PaymentsPageContent />
    </Suspense>
  );
}
