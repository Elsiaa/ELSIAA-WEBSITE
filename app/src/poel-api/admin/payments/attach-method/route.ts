import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin as checkSuperAdmin } from '@/lib/permissions';
import { getCurrentUser } from '@/lib/permissions';
import { updatePaymentRequestStripeInfo, getPaymentRequestById, createPaymentRequest, updatePaymentRequestStatus, getRequestDisplayInfo } from '@/lib/payments';
import { getProjectSubscriptionById, updateSubscriptionBillingDates, createProjectFeeTransaction } from '@/lib/project-payments';
import { getServerSupabaseClient } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    const dbUser = await getCurrentUser();

    // Only company admins can attach payment methods
    if (isSuperAdmin) {
      return NextResponse.json({ error: 'Super admins cannot attach payment methods' }, { status: 403 });
    }

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only company admins can attach payment methods' }, { status: 403 });
    }

    const body = await request.json();
    const { paymentRequestId, subscriptionId, feeId, stripeCustomerId, stripePaymentMethodId } = body;

    if (!stripeCustomerId || !stripePaymentMethodId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Handle fees
    if (feeId) {
      const supabase = getServerSupabaseClient();
      
      // Get the fee
      const { data: fee, error: feeError } = await supabase
        .from('project_fees')
        .select('id, amount, payment_request_id, name')
        .eq('id', feeId)
        .single();

      if (feeError || !fee) {
        return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
      }

      let paymentRequest;
      
      // If fee has a payment request, get it; otherwise create one
      if (fee.payment_request_id) {
        paymentRequest = await getPaymentRequestById(fee.payment_request_id);
        if (!paymentRequest) {
          return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
        }
      } else {
        // Create a payment request for this fee
        paymentRequest = await createPaymentRequest({
          userId: dbUser.id,
          recipientEmail: dbUser.email,
          recipientName: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || dbUser.email,
          amount: parseFloat(fee.amount.toString()),
          createdByClerkUserId: userId,
          paymentType: 'one_time',
        });

        // Link payment request to fee
        await supabase
          .from('project_fees')
          .update({
            payment_request_id: paymentRequest.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', feeId);
      }

      // Update the payment request with the payment method
      await updatePaymentRequestStripeInfo(
        paymentRequest.id,
        stripeCustomerId,
        stripePaymentMethodId
      );

      // For one-time fees, automatically process the payment (only if not already completed — avoid double charge)
      const prFresh = await getPaymentRequestById(paymentRequest.id);
      if (paymentRequest.payment_type === 'one_time' && prFresh?.status !== 'completed') {
        try {
          // Get payment method type to calculate fee
          const paymentMethod = await stripe.paymentMethods.retrieve(stripePaymentMethodId);
          const isCard = paymentMethod.type === 'card';
          const feeAmount = parseFloat(fee.amount.toString());
          const feeCharge = isCard ? feeAmount * 0.03 : 0;
          const totalAmount = feeAmount + feeCharge;
          const totalCents = Math.round(totalAmount * 100);

          // Create and confirm payment intent
          const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: 'usd',
            customer: stripeCustomerId,
            payment_method: stripePaymentMethodId,
            off_session: true,
            confirm: true,
            metadata: {
              payment_type: 'fee',
              fee_id: feeId,
              payment_request_id: paymentRequest.id,
              public_token: paymentRequest.public_token,
              originalAmount: feeAmount.toString(),
              fee: feeCharge.toString(),
              method: isCard ? 'card' : 'ach',
              attached_by: userId,
            },
          });

          if (paymentIntent.status === 'succeeded') {
            // Update payment request status (this assigns one invoice number and creates the single fee transaction via linkPaymentToFee)
            const invoiceNumber = await updatePaymentRequestStatus(
              paymentRequest.public_token,
              'completed',
              paymentIntent.id
            );

            // Send receipt email (in background, don't wait)
            const { email: recipientEmail, name: recipientName } = getRequestDisplayInfo(paymentRequest);
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const sendFeeReceipt = async () => {
              try {
                await fetch(`${baseUrl}/api/payments/send-receipt`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    public_token: paymentRequest.public_token,
                    paymentIntentId: paymentIntent.id,
                    amount: feeAmount,
                    fee: feeCharge,
                    total: totalAmount,
                    paymentMethod: isCard ? 'card' : 'ach',
                    recipientEmail,
                    recipientName,
                    invoiceNumber,
                    chargeName: (fee as { name?: string })?.name?.trim() || 'One-time payment',
                  }),
                });
              } catch (receiptErr) {
                console.error('Error sending fee receipt email:', receiptErr);
              }
            };
            sendFeeReceipt();

            return NextResponse.json({ 
              success: true, 
              paymentRequestId: paymentRequest.id,
              paymentProcessed: true,
              paymentIntentId: paymentIntent.id,
            }, { status: 200 });
          } else {
            // Payment failed - record the failure
            await createProjectFeeTransaction({
              projectFeeId: feeId,
              paymentRequestId: paymentRequest.id,
              stripePaymentIntentId: paymentIntent.id,
              amount: feeAmount,
              invoiceNumber: null,
            });

            return NextResponse.json({ 
              success: true, 
              paymentRequestId: paymentRequest.id,
              paymentProcessed: false,
              paymentStatus: paymentIntent.status,
              error: `Payment failed with status: ${paymentIntent.status}`,
            }, { status: 200 });
          }
        } catch (paymentError: any) {
          console.error('Error processing payment for fee:', paymentError);
          // Still return success for attaching the method, but note the payment failed
          return NextResponse.json({ 
            success: true, 
            paymentRequestId: paymentRequest.id,
            paymentProcessed: false,
            error: paymentError.message || 'Failed to process payment',
          }, { status: 200 });
        }
      }

      return NextResponse.json({ success: true, paymentRequestId: paymentRequest.id }, { status: 200 });
    }

    // Handle subscriptions
    if (subscriptionId) {
      const subscription = await getProjectSubscriptionById(subscriptionId);
      if (!subscription) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }

      let paymentRequest;
      
      // If subscription has a payment request, get it; otherwise create one
      if (subscription.paymentRequestId) {
        paymentRequest = await getPaymentRequestById(subscription.paymentRequestId);
        if (!paymentRequest) {
          return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
        }
      } else {
        // Create a payment request for this subscription
        paymentRequest = await createPaymentRequest({
          userId: dbUser.id,
          recipientEmail: dbUser.email,
          recipientName: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || dbUser.email,
          amount: subscription.amount,
          createdByClerkUserId: userId,
          paymentType: 'monthly',
          nextBillingDate: subscription.nextBillingDate || undefined,
        });

        // Link payment request to subscription
        const supabase = getServerSupabaseClient();
        await supabase
          .from('project_subscriptions')
          .update({
            payment_request_id: paymentRequest.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscriptionId);
      }

      // Update the payment request with the payment method
      await updatePaymentRequestStripeInfo(
        paymentRequest.id,
        stripeCustomerId,
        stripePaymentMethodId
      );

      // Check if subscription is due and automatically process payment
      const now = new Date();
      const isDue = subscription.nextBillingDate 
        ? new Date(subscription.nextBillingDate) <= now
        : true; // If no next billing date, consider it due

      if (isDue && subscription.status === 'active') {
        try {
          // Re-fetch payment request to avoid double charge if another request already completed it
          const prFresh = await getPaymentRequestById(paymentRequest.id);
          if (prFresh?.status === 'completed') {
            return NextResponse.json({ success: true, paymentRequestId: paymentRequest.id, paymentProcessed: true }, { status: 200 });
          }

          // Get payment method type to calculate fee
          const paymentMethod = await stripe.paymentMethods.retrieve(stripePaymentMethodId);
          const isCard = paymentMethod.type === 'card';
          const subscriptionAmount = parseFloat(subscription.amount.toString());
          const fee = isCard ? subscriptionAmount * 0.03 : 0;
          const totalAmount = subscriptionAmount + fee;
          const totalCents = Math.round(totalAmount * 100);

          // Create and confirm payment intent
          const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: 'usd',
            customer: stripeCustomerId,
            payment_method: stripePaymentMethodId,
            off_session: true,
            confirm: true,
            metadata: {
              payment_type: 'subscription',
              subscription_id: subscriptionId,
              payment_request_id: paymentRequest.id,
              public_token: paymentRequest.public_token,
              originalAmount: subscriptionAmount.toString(),
              fee: fee.toString(),
              method: isCard ? 'card' : 'ach',
              attached_by: userId,
            },
          });

          if (paymentIntent.status === 'succeeded') {
            // Calculate next billing date based on interval
            const { calculateNextBillingDate } = await import('@/lib/project-payments');
            const nextBillingDate = calculateNextBillingDate(
              subscription.billingInterval || 'monthly',
              now
            );

            // Update subscription billing dates
            await updateSubscriptionBillingDates(
              subscriptionId,
              now.toISOString(),
              nextBillingDate.toISOString()
            );

            // Create transaction record
            const { createProjectSubscriptionTransaction } = await import('@/lib/project-payments');
            await createProjectSubscriptionTransaction({
              projectSubscriptionId: subscriptionId,
              paymentRequestId: paymentRequest.id,
              stripePaymentIntentId: paymentIntent.id,
              amount: subscriptionAmount,
              invoiceNumber: null,
              billingPeriodStart: now.toISOString(),
              billingPeriodEnd: nextBillingDate.toISOString(),
            });

            // Send receipt email (in background, don't wait)
            const { email: subRecipientEmail, name: subRecipientName } = getRequestDisplayInfo(paymentRequest);
            const baseUrlSub = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const sendSubReceipt = async () => {
              try {
                await fetch(`${baseUrlSub}/api/payments/send-receipt`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    public_token: paymentRequest.public_token,
                    paymentIntentId: paymentIntent.id,
                    amount: subscriptionAmount,
                    fee: fee,
                    total: totalAmount,
                    paymentMethod: isCard ? 'card' : 'ach',
                    recipientEmail: subRecipientEmail,
                    recipientName: subRecipientName,
                    invoiceNumber: null,
                  }),
                });
              } catch (receiptErr) {
                console.error('Error sending subscription receipt email:', receiptErr);
              }
            };
            sendSubReceipt();

            return NextResponse.json({
              success: true,
              paymentRequestId: paymentRequest.id,
              paymentProcessed: true,
              paymentIntentId: paymentIntent.id,
            }, { status: 200 });
          } else {
            // Payment failed - record the failure
            const { createProjectSubscriptionTransaction } = await import('@/lib/project-payments');
            await createProjectSubscriptionTransaction({
              projectSubscriptionId: subscriptionId,
              paymentRequestId: paymentRequest.id,
              stripePaymentIntentId: paymentIntent.id,
              amount: subscriptionAmount,
              invoiceNumber: null,
              billingPeriodStart: null,
              billingPeriodEnd: null,
            });

            return NextResponse.json({ 
              success: true, 
              paymentRequestId: paymentRequest.id,
              paymentProcessed: false,
              paymentStatus: paymentIntent.status,
              error: `Payment failed with status: ${paymentIntent.status}`,
            }, { status: 200 });
          }
        } catch (paymentError: any) {
          console.error('Error processing payment for subscription:', paymentError);
          // Still return success for attaching the method, but note the payment failed
          return NextResponse.json({ 
            success: true, 
            paymentRequestId: paymentRequest.id,
            paymentProcessed: false,
            error: paymentError.message || 'Failed to process payment',
          }, { status: 200 });
        }
      }

      // Calculate and set next billing date if not already set (use shared logic: same month if date still in future)
      if (!subscription.nextBillingDate) {
        const { calculateNextBillingDate } = await import('@/lib/project-payments');
        const nextBillingDate = calculateNextBillingDate(
          subscription.billingInterval || 'monthly',
          now,
          {
            dayOfMonth: subscription.billingDayOfMonth ?? undefined,
            dayOfWeek: subscription.billingDayOfWeek ?? undefined,
          }
        );
        await updateSubscriptionBillingDates(
          subscriptionId,
          now.toISOString(),
          nextBillingDate.toISOString()
        );
      }

      return NextResponse.json({ success: true, paymentRequestId: paymentRequest.id }, { status: 200 });
    }

    // Handle regular payment requests
    if (!paymentRequestId) {
      return NextResponse.json({ error: 'Payment request ID or subscription ID required' }, { status: 400 });
    }

    // Verify the payment request exists
    const paymentRequest = await getPaymentRequestById(paymentRequestId);
    if (!paymentRequest) {
      return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
    }

    // Update the payment request with the payment method
    await updatePaymentRequestStripeInfo(
      paymentRequestId,
      stripeCustomerId,
      stripePaymentMethodId
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error attaching payment method:', error);
    return NextResponse.json(
      { error: 'Failed to attach payment method' },
      { status: 500 }
    );
  }
}

