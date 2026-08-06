"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { PAYMENT_METHOD_LABEL_ACH, PAYMENT_METHOD_LABEL_CARD } from "@/lib/payment-method-labels";

export interface PaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  clientSecret: string;
  paymentMethodType?: "card" | "us_bank_account";
  onTypeChange?: (type: "card" | "us_bank_account") => void;
}

export function PaymentMethodForm({
  onSuccess,
  onCancel,
  clientSecret,
  paymentMethodType: initialType = "card",
  onTypeChange,
}: PaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethodType, setPaymentMethodType] = useState<"card" | "us_bank_account">(
    initialType,
  );

  const handleTypeChange = (type: "card" | "us_bank_account") => {
    setPaymentMethodType(type);
    onTypeChange?.(type);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Setup failed");
        setIsLoading(false);
        return;
      }

      if (setupIntent?.status === "succeeded" && setupIntent.payment_method) {
        // Save payment method
        const response = await fetch("/api/payments/saved-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            setupIntentId: setupIntent.id,
            isDefault: false, // Will be set as default if it's the first one
          }),
        });

        if (response.ok) {
          toast.success("Payment method added successfully");
          onSuccess();
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to save payment method");
          setIsLoading(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Payment Method Type</label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={paymentMethodType === "card" ? "default" : "outline"}
            onClick={() => handleTypeChange("card")}
          >
            {PAYMENT_METHOD_LABEL_CARD}
          </Button>
          <Button
            type="button"
            variant={paymentMethodType === "us_bank_account" ? "default" : "outline"}
            onClick={() => handleTypeChange("us_bank_account")}
          >
            {PAYMENT_METHOD_LABEL_ACH}
          </Button>
        </div>
      </div>
      <PaymentElement />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isLoading}>
          {isLoading ? "Saving..." : "Save Payment Method"}
        </Button>
      </DialogFooter>
    </form>
  );
}
