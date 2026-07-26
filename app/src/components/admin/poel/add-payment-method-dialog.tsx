'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentMethodForm } from './payment-method-form';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddPaymentMethodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    currentUser: any;
    defaultType?: 'card' | 'us_bank_account';
}

export default function AddPaymentMethodDialog({
    open,
    onOpenChange,
    onSuccess,
    currentUser,
    defaultType = 'card'
}: AddPaymentMethodDialogProps) {
    const [clientSecret, setClientSecret] = useState('');
    const [selectedPaymentType, setSelectedPaymentType] = useState<'card' | 'us_bank_account'>(defaultType);

    // Initialize when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedPaymentType(defaultType); // Reset to default calling type
            createSetupIntent(defaultType);
        } else {
            setClientSecret('');
        }
    }, [open, defaultType]);

    const createSetupIntent = async (type: 'card' | 'us_bank_account') => {
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
                onOpenChange(false);
            }
        } catch (err) {
            toast.error('Failed to initialize payment form');
            onOpenChange(false);
        }
    };

    const handleTypeChange = (type: 'card' | 'us_bank_account') => {
        setSelectedPaymentType(type);
        createSetupIntent(type);
    };

    const handleSuccess = () => {
        onSuccess();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Payment Method</DialogTitle>
                    <DialogDescription>
                        Add a new payment method to your account. This will be saved for future use.
                    </DialogDescription>
                </DialogHeader>
                {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentMethodForm
                            onSuccess={handleSuccess}
                            onCancel={() => onOpenChange(false)}
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
    );
}
