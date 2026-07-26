import type { InvoiceLineItem } from '@/lib/invoice-line-items';
import { normalizeInvoiceLineItems } from '@/lib/invoice-line-items';

export type HistoryLineItemsSource = {
  type: 'fee' | 'subscription' | 'bill' | 'payment';
  paymentRequestId?: string | null;
  billId?: string | null;
  chargeId?: string | null;
};

/** Lazy-load line items for a billing history row (payment request or bill charge). */
export async function fetchHistoryLineItems(
  row: HistoryLineItemsSource
): Promise<InvoiceLineItem[] | null> {
  if (row.type === 'payment' && row.paymentRequestId) {
    const res = await fetch(`/api/admin/payments/${row.paymentRequestId}/invoice`);
    if (!res.ok) return null;
    const data = await res.json();
    return normalizeInvoiceLineItems(data.invoice?.lineItems) ?? null;
  }

  if (row.type === 'bill' && row.billId && row.chargeId) {
    const res = await fetch(`/api/admin/bills/${row.billId}/charges`);
    if (!res.ok) return null;
    const data = await res.json();
    const charges = Array.isArray(data.charges) ? data.charges : [];
    const charge = charges.find((c: { id: string }) => c.id === row.chargeId);
    if (!charge) return null;
    return normalizeInvoiceLineItems(charge.lineItemsSnapshot) ?? null;
  }

  return null;
}
