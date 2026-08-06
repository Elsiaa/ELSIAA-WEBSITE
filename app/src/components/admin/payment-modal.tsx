"use client";

import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AnimatedPoelLogo from "@/components/AnimatedPoelLogo";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentModalForm({
  total,
  clientSecret,
  public_token,
  paymentRequest,
  isSetupIntent = false,
  onSuccess,
  onClose,
}: {
  total: number;
  clientSecret: string;
  public_token?: string;
  paymentRequest?: any;
  isSetupIntent?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Check when PaymentElement is ready
  useEffect(() => {
    if (!stripe || !elements || isPaymentElementReady) return;

    const checkPaymentElement = () => {
      if (formRef.current) {
        const stripeElement =
          formRef.current.querySelector('[data-testid="payment-element"]') ||
          formRef.current.querySelector(".InputElement") ||
          formRef.current.querySelector("input[data-elements-stable-field-name]") ||
          formRef.current.querySelector('iframe[src*="js.stripe.com"]');

        if (stripeElement) {
          setTimeout(() => {
            setIsPaymentElementReady(true);
          }, 500);
          return true;
        }
      }
      return false;
    };

    if (checkPaymentElement()) return;

    const observer = new MutationObserver(() => {
      if (checkPaymentElement()) {
        observer.disconnect();
      }
    });

    const initTimeout = setTimeout(() => {
      if (formRef.current) {
        observer.observe(formRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
        });
      }
    }, 50);

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
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
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

    try {
      if (isSetupIntent) {
        const { error: confirmError } = await stripe.confirmSetup({
          elements,
          redirect: "if_required",
        });

        if (confirmError) {
          setError(confirmError.message || "Setup failed");
          setIsLoading(false);
          return;
        }

        // Handle setup success
        if (public_token) {
          const setupIntent = await stripe.retrieveSetupIntent(clientSecret);
          if (
            setupIntent.setupIntent?.status === "succeeded" &&
            setupIntent.setupIntent.payment_method
          ) {
            // Save payment method
            await fetch("/api/payments/save-payment-method", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                public_token,
                setup_intent_id: setupIntent.setupIntent.id,
              }),
            });

            toast.success("Payment method saved successfully!");
            onSuccess?.();
            onClose?.();
          }
        }
      } else {
        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
          elements,
          redirect: "if_required",
        });

        if (confirmError) {
          setError(confirmError.message || "Payment failed");
          setIsLoading(false);
          return;
        }

        // Handle payment success
        if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
          if (public_token && paymentIntent.id) {
            // Save payment method first for recurring payments
            const paymentMethodId = (paymentIntent as any).payment_method;
            if (paymentMethodId) {
              await fetch("/api/payments/save-payment-method", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  public_token,
                  payment_intent_id: paymentIntent.id,
                }),
              }).catch(() => {}); // Continue even if this fails
            }

            const recordRes = await fetch("/api/payments/record-success", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                publicToken: public_token,
              }),
            });
            if (!recordRes.ok) {
              const errBody = await recordRes.json().catch(() => ({}));
              throw new Error((errBody as { error?: string }).error || "Failed to record payment");
            }

            toast.success("Payment completed successfully!");
            onSuccess?.();
            onClose?.();
          } else {
            toast.success("Payment completed successfully!");
            onSuccess?.();
            onClose?.();
          }
        }
      }
    } catch (err) {
      console.error("Error confirming payment:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[400px]">
      <div
        className={`absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-md min-h-[400px] w-full transition-opacity duration-200 ${
          !isPaymentElementReady
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="text-center">
          <AnimatedPoelLogo width="200px" height="200px" speed={3} />
          <p className="mt-6 text-sm text-muted-foreground">Loading secure payment form...</p>
        </div>
      </div>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <Button
          type="submit"
          disabled={!stripe || isLoading || !isPaymentElementReady}
          className="w-full"
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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  public_token: string;
  paymentRequest: any;
  onSuccess?: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  public_token,
  paymentRequest,
  onSuccess,
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isSetupIntent = paymentRequest?.payment_type === "interval_billing";
  const amount = paymentRequest?.amount || 1.0;
  const total = amount;

  useEffect(() => {
    if (isOpen && public_token) {
      loadPaymentIntent();
    }
  }, [isOpen, public_token]);

  const loadPaymentIntent = async () => {
    setLoading(true);
    setError("");

    try {
      if (isSetupIntent) {
        // Create setup intent for interval_billing
        const response = await fetch("/api/payments/create-setup-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "card",
            public_token,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create setup intent");
        }

        const { clientSecret: secret } = await response.json();
        setClientSecret(secret);
      } else {
        // Create payment intent
        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount,
            method: "card",
            public_token,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create payment intent");
        }

        const { clientSecret: secret } = await response.json();
        setClientSecret(secret);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize payment");
      toast.error(err instanceof Error ? err.message : "Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    onSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isSetupIntent ? "Save Payment Method" : `Pay $${total.toFixed(2)}`}
          </DialogTitle>
          <DialogDescription>
            {isSetupIntent
              ? "Save your payment method for future billing. No charge will be made."
              : "Complete your payment securely using the form below."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AnimatedPoelLogo width="200px" height="200px" speed={3} />
              <p className="mt-6 text-sm text-muted-foreground">Initializing payment...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadPaymentIntent}>Retry</Button>
          </div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentModalForm
              total={total}
              clientSecret={clientSecret}
              public_token={public_token}
              paymentRequest={paymentRequest}
              isSetupIntent={isSetupIntent}
              onSuccess={handleSuccess}
              onClose={onClose}
            />
          </Elements>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
