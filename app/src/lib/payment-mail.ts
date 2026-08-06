import { getPaymentCompanyName, getPaymentsOperationsEmail } from "@/lib/payment-branding";
import { getTransactionalSenderEmail } from "@/lib/operational-brand";

/** From header for ELSIAA payment transactional mail (uses SMTP_FROM_EMAIL / ELSIAA mail). */
export function getPaymentTransactionalFrom(): string {
  return `"${getPaymentCompanyName()}" <${getTransactionalSenderEmail()}>`;
}

/** BCC payments@elsiaa.com (or PAYMENTS_OPERATIONS_EMAIL) on customer-facing payment mail. */
export function getPaymentOperationsBcc(): string {
  return getPaymentsOperationsEmail();
}

/** Default inbox for internal payment notifications. */
export function getPaymentAdminNotifyEmail(): string {
  return (
    process.env.PAYMENT_ADMIN_NOTIFY_EMAIL?.trim() ||
    process.env.BILLING_MANAGEMENT_EMAIL?.trim() ||
    getPaymentsOperationsEmail()
  );
}
