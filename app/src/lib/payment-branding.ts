/**
 * Payment branding: company name and contact on receipts, invoices, and payment pages.
 * Defaults are ELSIAA — override with env when needed.
 */

/** Default business line — used on invoices, receipts, footers, and contact cards unless env overrides. */
export const DEFAULT_PAYMENT_CONTACT_PHONE = "(732) 686-6669";

/** Full brand logo in payment cards */
export const POEL_PAYMENTS_HEADER_LOGO_CLASS =
  "mx-auto mb-4 h-12 w-auto max-h-20 sm:h-14 md:h-16 lg:h-[4.5rem] xl:h-20 object-contain";

/** Public path for payment/header logos */
export const PAYMENT_BRAND_LOGO_SRC = "/assets/elsiaa-lion.png";

function sanitizePaymentBrand(raw: string | undefined): string | undefined {
  const name = raw?.trim();
  if (!name) return undefined;
  if (/poel/i.test(name)) return undefined;
  return name;
}

export function getPaymentCompanyName(): string {
  return (
    sanitizePaymentBrand(process.env.NEXT_PUBLIC_PAYMENT_COMPANY_NAME) ||
    sanitizePaymentBrand(process.env.PAYMENT_COMPANY_NAME) ||
    sanitizePaymentBrand(process.env.NEXT_PUBLIC_OPERATIONAL_BRAND_NAME) ||
    "ELSIAA"
  );
}

function sanitizeElsiaaEmail(raw: string | undefined, fallback: string): string {
  const email = raw?.trim();
  if (!email) return fallback;
  // Never fall back to a Poel mailbox on this product.
  if (/@poel\.ai$/i.test(email) || /poel/i.test(email.split("@")[0] ?? "")) {
    return fallback;
  }
  return email;
}

export function getPaymentContactEmail(): string {
  return sanitizeElsiaaEmail(
    process.env.NEXT_PUBLIC_PAYMENT_CONTACT_EMAIL ||
      process.env.PAYMENT_CONTACT_EMAIL,
    "hello@elsiaa.com",
  );
}

export function getPaymentContactPhone(): string {
  return (
    process.env.NEXT_PUBLIC_PAYMENT_CONTACT_PHONE ||
    process.env.PAYMENT_CONTACT_PHONE ||
    DEFAULT_PAYMENT_CONTACT_PHONE
  );
}

/** `tel:` href for click-to-call links (e.g. footers, contact cards). */
export function getPaymentContactPhoneTelHref(): string {
  const digits = getPaymentContactPhone().replace(/\D/g, "");
  return digits.length === 10 ? `tel:+1${digits}` : `tel:${digits}`;
}

/** Zelle enrolled tag / search name. Override: NEXT_PUBLIC_PAYMENT_ZELLE_TAG */
export function getPaymentZelleTag(): string {
  const tag = process.env.NEXT_PUBLIC_PAYMENT_ZELLE_TAG?.trim();
  if (!tag || /poel/i.test(tag)) return "elsiaa";
  return tag;
}

/** Zelle email recipients can use. Override: NEXT_PUBLIC_PAYMENT_ZELLE_EMAIL */
export function getPaymentZelleEmail(): string {
  return sanitizeElsiaaEmail(
    process.env.NEXT_PUBLIC_PAYMENT_ZELLE_EMAIL,
    "payments@elsiaa.com",
  );
}

/** Copied on customer invoices, receipts, and payment confirmations. Override: PAYMENTS_OPERATIONS_EMAIL */
export function getPaymentsOperationsEmail(): string {
  return sanitizeElsiaaEmail(
    process.env.PAYMENTS_OPERATIONS_EMAIL || process.env.PAYMENT_OPERATIONS_CC,
    getPaymentZelleEmail(),
  );
}
