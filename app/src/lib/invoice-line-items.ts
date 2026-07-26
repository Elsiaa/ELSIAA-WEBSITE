/**
 * Invoice line items for one-time payment requests (stored on payments_requests.invoice_line_items).
 * Amounts are in USD dollars (same as payments_requests.amount).
 */

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_amount: number;
}

export function normalizeInvoiceLineItems(raw: unknown): InvoiceLineItem[] | null {
  if (raw == null) return null;
  let arr: unknown[] = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      arr = Array.isArray(parsed) ? parsed : [];
    } catch {
      return null;
    }
  } else {
    return null;
  }
  const out: InvoiceLineItem[] = [];
  for (const row of arr) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const description = typeof r.description === 'string' ? r.description.trim() : '';
    const quantity = typeof r.quantity === 'number' && Number.isFinite(r.quantity) ? r.quantity : Number(r.quantity);
    const unit_amount =
      typeof r.unit_amount === 'number' && Number.isFinite(r.unit_amount)
        ? r.unit_amount
        : Number(r.unit_amount);
    if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unit_amount) || unit_amount < 0) {
      continue;
    }
    out.push({ description, quantity, unit_amount });
  }
  return out.length ? out : null;
}

export function totalFromLineItems(items: InvoiceLineItem[]): number {
  return Math.round(items.reduce((sum, row) => sum + row.quantity * row.unit_amount, 0) * 100) / 100;
}

export function validateLineItemsForCreate(items: unknown): { ok: true; items: InvoiceLineItem[] } | { ok: false; error: string } {
  const normalized = normalizeInvoiceLineItems(items);
  if (!normalized || normalized.length === 0) {
    return { ok: false, error: 'Add at least one line item with description, quantity, and unit price.' };
  }
  const total = totalFromLineItems(normalized);
  if (total <= 0) {
    return { ok: false, error: 'Invoice total must be greater than zero.' };
  }
  return { ok: true, items: normalized };
}
