'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import {
  PAYMENT_METHOD_LABEL_ACH,
  PAYMENT_METHOD_LABEL_CARD,
} from '@/lib/payment-method-labels';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

interface PaymentMethodsManagementProps {
  isSuperAdmin: boolean;
  currentUser: any;
  /** When true, do not render the section title/description (for use inside consolidated billing view) */
  hideTitle?: boolean;
}

function PaymentMethodForm({ 
  onSuccess, 
  onCancel,
  clientSecret,
  paymentMethodType: initialType = 'card',
  onTypeChange
}: { 
  onSuccess: () => void; 
  onCancel: () => void;
  clientSecret: string;
  paymentMethodType?: 'card' | 'us_bank_account';
  onTypeChange?: (type: 'card' | 'us_bank_account') => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethodType, setPaymentMethodType] = useState<'card' | 'us_bank_account'>(initialType);

  const handleTypeChange = (type: 'card' | 'us_bank_account') => {
    setPaymentMethodType(type);
    onTypeChange?.(type);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Setup failed');
        setIsLoading(false);
        return;
      }

      if (setupIntent?.status === 'succeeded' && setupIntent.payment_method) {
        // Save payment method
        const response = await fetch('/api/payments/saved-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setupIntentId: setupIntent.id,
            isDefault: false, // Will be set as default if it's the first one
          }),
        });

        if (response.ok) {
          toast.success('Payment method added successfully');
          onSuccess();
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to save payment method');
          setIsLoading(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
            variant={paymentMethodType === 'card' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('card')}
          >
            {PAYMENT_METHOD_LABEL_CARD}
          </Button>
          <Button
            type="button"
            variant={paymentMethodType === 'us_bank_account' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('us_bank_account')}
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
          {isLoading ? 'Saving...' : 'Save Payment Method'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function PaymentMethodsManagement({
  isSuperAdmin,
  currentUser,
  hideTitle = false,
}: PaymentMethodsManagementProps) {
  // Only show for company admins, not super admins
  if (isSuperAdmin) {
    return null;
  }
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/saved-methods');
      if (res.ok) {
        const { methods } = await res.json();
        setPaymentMethods(methods || []);
      }
    } catch (err) {
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (methodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    setDeletingId(methodId);
    try {
      const res = await fetch(`/api/payments/saved-methods?id=${methodId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Payment method deleted');
        loadPaymentMethods();
      } else {
        toast.error('Failed to delete payment method');
      }
    } catch (err) {
      toast.error('Failed to delete payment method');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    setClientSecret('');
    loadPaymentMethods();
  };

  const [selectedPaymentType, setSelectedPaymentType] = useState<'card' | 'us_bank_account'>('card');

  const handleOpenAddDialog = async (type: 'card' | 'us_bank_account' = 'card') => {
    setSelectedPaymentType(type);
    setShowAddDialog(true);
    // Create setup intent when dialog opens
    try {
      const response = await fetch('/api/payments/create-setup-intent-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: type === 'us_bank_account' ? 'us_bank_account' : 'card',
          email: currentUser?.email || '',
        }),
      });

      if (response.ok) {
        const { clientSecret: secret } = await response.json();
        setClientSecret(secret);
      } else {
        toast.error('Failed to initialize payment form');
        setShowAddDialog(false);
      }
    } catch (err) {
      toast.error('Failed to initialize payment form');
      setShowAddDialog(false);
    }
  };

  const handleTypeChange = async (type: 'card' | 'us_bank_account') => {
    setSelectedPaymentType(type);
    try {
      const response = await fetch('/api/payments/create-setup-intent-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: type === 'us_bank_account' ? 'us_bank_account' : 'card',
          email: currentUser?.email || '',
        }),
      });

      if (response.ok) {
        const { clientSecret: secret } = await response.json();
        setClientSecret(secret);
      }
    } catch (err) {
      toast.error('Failed to switch payment method type');
    }
  };

  return (
    <div className="space-y-6">
      {!hideTitle && (
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Methods</h2>
          <p className="text-[#111]/55">
            Manage payment methods for your account. These will be used for automatic billing.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenAddDialog('card')} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </Button>
          <Button onClick={() => handleOpenAddDialog('us_bank_account')} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add {PAYMENT_METHOD_LABEL_ACH}
          </Button>
        </div>
      </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-[#111]/55" />
            <p className="text-[#111]/55">No payment methods added yet</p>
            <div className="flex gap-2 justify-center mt-4">
              <Button onClick={() => handleOpenAddDialog('card')} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
              <Button onClick={() => handleOpenAddDialog('us_bank_account')} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add {PAYMENT_METHOD_LABEL_ACH}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-5 h-5" />
                      <span className="font-semibold">{method.displayName || 'Payment Method'}</span>
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#111]/55 capitalize">
                      {method.paymentMethodType === 'us_bank_account' ? PAYMENT_METHOD_LABEL_ACH : PAYMENT_METHOD_LABEL_CARD}
                    </p>
                    {method.last4 && (
                      <p className="text-xs text-[#111]/55 mt-1">
                        •••• {method.last4}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(method.id)}
                    disabled={deletingId === method.id}
                  >
                    {deletingId === method.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new payment method to your account. This will be saved for future use.
            </DialogDescription>
          </DialogHeader>
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentMethodForm 
                onSuccess={handleAddSuccess}
                onCancel={() => {
                  setShowAddDialog(false);
                  setClientSecret('');
                }}
                clientSecret={clientSecret}
                paymentMethodType={selectedPaymentType}
                onTypeChange={handleTypeChange}
              />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

