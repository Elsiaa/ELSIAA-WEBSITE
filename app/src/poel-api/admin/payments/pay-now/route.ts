import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin as checkSuperAdmin } from '@/lib/permissions';
import { getCurrentUser } from '@/lib/permissions';
import {
  getAnySavedMethodForCompany,
  getDefaultPaymentMethod,
  getPaymentMethodForBilling,
  getPaymentRequestById,
  getRequestDisplayInfo,
} from '@/lib/payments';
import { 
  getProjectSubscriptionById, 
  updateSubscriptionBillingDates,
  createProjectSubscriptionTransaction,
  calculateNextBillingDate,
  createProjectFeeTransaction,
  getFeeByPaymentRequestId,
} from '@/lib/project-payments';
import { getServerSupabaseClient } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function resolveSavedMethodForAdmin(dbUser: { id: string; company_id?: string | null }) {
  if (dbUser.company_id) {
    const companyMethod =
      (await getDefaultPaymentMethod({ companyId: dbUser.company_id })) ||
      (await getPaymentMethodForBilling(dbUser.company_id, 'one_time')) ||
      (await getAnySavedMethodForCompany(dbUser.company_id));
    if (companyMethod) return companyMethod;
  }
  return getDefaultPaymentMethod({ userId: dbUser.id });
}

export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let subscriptionId: string | null = null;
  let feeId: string | null = null;
  let paymentRequestId: string | null = null;
  let amount = 0;
  let customerId: string | null = null;
  let paymentMethodId: string | null = null;
  let billingInterval: 'daily' | 'weekly' | 'monthly' = 'monthly';
  let chargeNameForReceipt: string | null = null;

  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await getCurrentUser();
    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only company admins can process payments' }, { status: 403 });
    }

    const body = await request.json();
    const { paymentId, paymentType } = body; // paymentType: 'subscription' | 'fee' | 'payment_request'

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }

    // Auto-detect payment type from ID format if not provided
    let detectedType = paymentType;
    if (!detectedType) {
      if (paymentId.startsWith('subscription-')) {
        detectedType = 'subscription';
      } else if (paymentId.startsWith('fee-')) {
        detectedType = 'fee';
      } else {
        detectedType = 'payment_request';
      }
    }

    const supabase = getServerSupabaseClient();

    // Get payment details based on type
    if (detectedType === 'subscription') {
      const subId = paymentId.replace('subscription-', '');
      const subscription = await getProjectSubscriptionById(subId);
      if (!subscription) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }
      
      subscriptionId = subscription.id;
      amount = subscription.amount;
      billingInterval = subscription.billingInterval || 'monthly';

      // Get payment method from payment request or saved methods
      if (subscription.paymentRequestId) {
        const { data: pr } = await supabase
          .from('payments_requests')
          .select('stripe_customer_id, stripe_payment_method_id')
          .eq('id', subscription.paymentRequestId)
          .single();
        
        if (pr) {
          customerId = pr.stripe_customer_id;
          paymentMethodId = pr.stripe_payment_method_id;
        }
      }

      // If no payment method from payment request, try saved methods
      if (!customerId || !paymentMethodId) {
        const defaultMethod = await resolveSavedMethodForAdmin(dbUser);
        if (defaultMethod) {
          customerId = defaultMethod.stripeCustomerId;
          paymentMethodId = defaultMethod.stripePaymentMethodId;
        }
      }
    } else if (detectedType === 'fee') {
      const feeIdFromPayment = paymentId.replace('fee-', '');
      const { data: fee } = await supabase
        .from('project_fees')
        .select('id, amount, payment_request_id, name')
        .eq('id', feeIdFromPayment)
        .single();

      if (!fee) {
        return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
      }

      feeId = fee.id;
      amount = parseFloat(fee.amount.toString());
      paymentRequestId = fee.payment_request_id;
      chargeNameForReceipt = (fee as { name?: string })?.name?.trim() || 'One-time payment';

      // Get payment method
      if (paymentRequestId) {
        const { data: pr } = await supabase
          .from('payments_requests')
          .select('stripe_customer_id, stripe_payment_method_id')
          .eq('id', paymentRequestId)
          .single();
        
        if (pr) {
          customerId = pr.stripe_customer_id;
          paymentMethodId = pr.stripe_payment_method_id;
        }
      }

      if (!customerId || !paymentMethodId) {
        const defaultMethod = await resolveSavedMethodForAdmin(dbUser);
        if (defaultMethod) {
          customerId = defaultMethod.stripeCustomerId;
          paymentMethodId = defaultMethod.stripePaymentMethodId;
        }
      }
    } else {
      // payment_request type
      const { data: pr } = await supabase
        .from('payments_requests')
        .select('id, amount, stripe_customer_id, stripe_payment_method_id, payment_type')
        .eq('id', paymentId)
        .single();

      if (!pr) {
        return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
      }

      paymentRequestId = pr.id;
      amount = parseFloat(pr.amount.toString());
      customerId = pr.stripe_customer_id;
      paymentMethodId = pr.stripe_payment_method_id;

      if (pr.payment_type === 'monthly') {
        billingInterval = 'monthly';
      }
    }

    if (!customerId || !paymentMethodId) {
      const fallback = await resolveSavedMethodForAdmin(dbUser);
      if (fallback) {
        customerId = fallback.stripeCustomerId;
        paymentMethodId = fallback.stripePaymentMethodId;
      }
    }

    if (!customerId || !paymentMethodId) {
      return NextResponse.json({
        error: 'No payment method on file. Add one under Payment methods, then try again.',
      }, { status: 400 });
    }

    // Get payment method type to calculate fee
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const isCard = paymentMethod.type === 'card';
    const fee = isCard ? amount * 0.03 : 0;
    const totalAmount = amount + fee;
    const totalCents = Math.round(totalAmount * 100);

    let paymentIntent: Stripe.PaymentIntent;
    let paymentError: any = null;

    // Create and confirm payment intent
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          payment_type: paymentType,
          payment_id: paymentId,
          original_amount: amount.toString(),
          fee: fee.toString(),
          method: isCard ? 'card' : 'ach',
          paid_by: userId,
        },
      });
    } catch (stripeError: any) {
      // Handle Stripe errors (card declined, etc.)
      paymentError = stripeError;
      
      // Extract failure reason from Stripe error
      let failureReason = 'Payment failed';
      if (stripeError.decline_code) {
        failureReason = `Card declined: ${stripeError.decline_code}`;
      } else if (stripeError.code) {
        failureReason = `Payment error: ${stripeError.code}`;
      } else if (stripeError.message) {
        failureReason = stripeError.message;
      }

      // Try to get payment intent from error if available
      if (stripeError.payment_intent) {
        paymentIntent = stripeError.payment_intent as Stripe.PaymentIntent;
      } else {
        // If no payment intent, we still need to record the failure
        const now = new Date();
        
        // Record the failure in transaction history
        if (subscriptionId) {
          await createProjectSubscriptionTransaction({
            projectSubscriptionId: subscriptionId,
            paymentRequestId: paymentRequestId,
            stripePaymentIntentId: null,
            amount,
            invoiceNumber: null,
            billingPeriodStart: null,
            billingPeriodEnd: null,
          });
        } else if (feeId) {
          await createProjectFeeTransaction({
            projectFeeId: feeId,
            paymentRequestId: paymentRequestId,
            stripePaymentIntentId: null,
            amount,
            invoiceNumber: null,
          });
        }

        return NextResponse.json({ 
          success: false,
          error: failureReason,
          paymentStatus: 'failed',
          declineCode: stripeError.decline_code,
          code: stripeError.code,
        }, { status: 200 }); // Return 200 with error details, not 500
      }
    }

    // Handle payment status - record transaction even if failed
    const now = new Date();
    const lastBilledDate = now.toISOString();
    
    if (paymentIntent.status === 'succeeded') {
      if (subscriptionId) {
        // Calculate next billing date based on interval
        const nextBillingDate = calculateNextBillingDate(billingInterval, now);
        
        // Update subscription billing dates
        await updateSubscriptionBillingDates(
          subscriptionId,
          lastBilledDate,
          nextBillingDate.toISOString()
        );

        // Create transaction record
        await createProjectSubscriptionTransaction({
          projectSubscriptionId: subscriptionId,
          paymentRequestId: null,
          stripePaymentIntentId: paymentIntent.id,
          amount,
          invoiceNumber: null,
          billingPeriodStart: lastBilledDate,
          billingPeriodEnd: nextBillingDate.toISOString(),
        });

        // Send receipt to customer every time we bill the subscription
        try {
          const subscription = await getProjectSubscriptionById(subscriptionId);
          let recipientEmail: string;
          let recipientName: string;
          if (subscription?.paymentRequestId) {
            const pr = await getPaymentRequestById(subscription.paymentRequestId);
            const info = pr ? getRequestDisplayInfo(pr) : { email: '', name: '' };
            recipientEmail = info.email || '';
            recipientName = info.name || subscription.name || 'Subscription';
          } else {
            recipientEmail = dbUser.email || '';
            recipientName = `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || dbUser.email || 'Customer';
          }
          if (recipientEmail) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            await fetch(`${baseUrl}/api/payments/send-receipt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                amount,
                fee,
                total: totalAmount,
                paymentMethod: isCard ? 'card' : 'ach',
                recipientEmail,
                recipientName,
                invoiceNumber: null,
              }),
            });
          }
        } catch (receiptErr) {
          console.error('Error sending subscription receipt email:', receiptErr);
        }
      } else if (feeId) {
        // Create fee transaction
        await createProjectFeeTransaction({
          projectFeeId: feeId,
          paymentRequestId: paymentRequestId,
          stripePaymentIntentId: paymentIntent.id,
          amount,
          invoiceNumber: null,
        });
      }

      // Send receipt to customer for every charge (fee or payment_request; subscription already sent above)
      if (!subscriptionId) {
        try {
          let recipientEmail: string;
          let recipientName: string;
          if (paymentRequestId) {
            const pr = await getPaymentRequestById(paymentRequestId);
            const info = pr ? getRequestDisplayInfo(pr) : { email: '', name: '' };
            recipientEmail = info.email || '';
            recipientName = info.name || 'Customer';
            if (!chargeNameForReceipt && paymentRequestId) {
              const linkedFee = await getFeeByPaymentRequestId(paymentRequestId);
              chargeNameForReceipt = linkedFee?.name?.trim() || 'One-time payment';
            }
          } else {
            recipientEmail = dbUser.email || '';
            recipientName = `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || dbUser.email || 'Customer';
          }
          if (recipientEmail) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            await fetch(`${baseUrl}/api/payments/send-receipt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                amount,
                fee,
                total: totalAmount,
                paymentMethod: isCard ? 'card' : 'ach',
                recipientEmail,
                recipientName,
                invoiceNumber: null,
                chargeName: chargeNameForReceipt || 'Payment',
              }),
            });
          }
        } catch (receiptErr) {
          console.error('Error sending receipt email:', receiptErr);
        }
      }

      return NextResponse.json({ 
        success: true,
        paymentIntentId: paymentIntent.id,
        amount,
        nextBillingDate: subscriptionId ? calculateNextBillingDate(billingInterval, now).toISOString() : null
      });
    } else {
      // Payment failed - extract failure reason from payment intent or error
      let failureReason = `Payment failed with status: ${paymentIntent.status}`;
      let declineCode: string | undefined;
      
      // Try to get last payment error from payment intent
      if (paymentIntent.last_payment_error) {
        const error = paymentIntent.last_payment_error;
        if (error.decline_code) {
          failureReason = `Card declined: ${error.decline_code}`;
          declineCode = error.decline_code;
        } else if (error.code) {
          failureReason = `Payment error: ${error.code}`;
        } else if (error.message) {
          failureReason = error.message;
        }
      } else if (paymentError) {
        // Use error from Stripe exception if available
        if (paymentError.decline_code) {
          failureReason = `Card declined: ${paymentError.decline_code}`;
          declineCode = paymentError.decline_code;
        } else if (paymentError.code) {
          failureReason = `Payment error: ${paymentError.code}`;
        } else if (paymentError.message) {
          failureReason = paymentError.message;
        }
      }

      // Record the failed transaction attempt
      if (subscriptionId) {
        await createProjectSubscriptionTransaction({
          projectSubscriptionId: subscriptionId,
          paymentRequestId: paymentRequestId,
          stripePaymentIntentId: paymentIntent.id,
          amount,
          invoiceNumber: null,
          billingPeriodStart: null,
          billingPeriodEnd: null,
        });
      } else if (feeId) {
        await createProjectFeeTransaction({
          projectFeeId: feeId,
          paymentRequestId: paymentRequestId,
          stripePaymentIntentId: paymentIntent.id,
          amount,
          invoiceNumber: null,
        });
      }

      return NextResponse.json({ 
        success: false,
        error: failureReason,
        paymentIntentId: paymentIntent.id,
        paymentStatus: paymentIntent.status,
        declineCode,
      }, { status: 200 }); // Return 200 with error details, not 400/500
    }
  } catch (error: any) {
    console.error('Error processing payment:', error);
    
    // Extract failure reason from error
    let failureReason = 'Failed to process payment';
    let declineCode: string | undefined;
    
    if (error.decline_code) {
      failureReason = `Card declined: ${error.decline_code}`;
      declineCode = error.decline_code;
    } else if (error.code) {
      failureReason = `Payment error: ${error.code}`;
    } else if (error.message) {
      failureReason = error.message;
    }
    
    // Try to record the failure if we have payment info
    try {
      if (subscriptionId) {
        await createProjectSubscriptionTransaction({
          projectSubscriptionId: subscriptionId,
          paymentRequestId: paymentRequestId,
          stripePaymentIntentId: null,
          amount: amount || 0,
          invoiceNumber: null,
          billingPeriodStart: null,
          billingPeriodEnd: null,
        });
      } else if (feeId) {
        await createProjectFeeTransaction({
          projectFeeId: feeId,
          paymentRequestId: paymentRequestId,
          stripePaymentIntentId: null,
          amount: amount || 0,
          invoiceNumber: null,
        });
      }
    } catch (recordError) {
      console.error('Error recording failed transaction:', recordError);
    }
    
    // Return 200 with error details instead of 500, so UI can display the reason
    return NextResponse.json({
      success: false,
      error: failureReason,
      paymentStatus: 'failed',
      declineCode,
      code: error.code,
    }, { status: 200 });
  }
}

