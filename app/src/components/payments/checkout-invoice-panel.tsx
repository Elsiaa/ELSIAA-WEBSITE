'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { getRequestDisplayInfo } from '@/lib/payments-shared';
import type { InvoiceLineItem } from '@/lib/invoice-line-items';
import { toast } from 'sonner';

type CheckoutRequest = {
  amount?: number | null;
  status?: string;
  invoice_number?: number | string | null;
  invoice_line_items?: InvoiceLineItem[] | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  recipient_email?: string;
  recipient_name?: string;
  payment_type?: string;
  users?: { email: string; first_name?: string | null; last_name?: string | null } | null;
};

function formatMoney(n: number): string {
  return n.toFixed(2);
}

function lineAmount(row: InvoiceLineItem): number {
  return row.quantity * row.unit_amount;
}

function statusBadge(status?: string): { label: string; className: string } {
  switch (status) {
    case 'completed':
      return { label: 'Paid', className: 'bg-[#ecfdf5] text-[#166534] border-transparent' };
    case 'cancelled':
      return { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-transparent' };
    case 'invoiced':
      return { label: 'Invoiced', className: 'bg-mist/50 text-navy border-transparent' };
    default:
      return { label: 'Due', className: 'bg-mist/50 text-navy border-transparent' };
  }
}

export function isCheckoutPaid(request: CheckoutRequest | null | undefined): boolean {
  return request?.status === 'completed';
}

export function CheckoutInvoicePanel({
  paymentRequest,
  publicToken,
}: {
  paymentRequest: CheckoutRequest;
  publicToken: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const paid = isCheckoutPaid(paymentRequest);
  const { name, email } = getRequestDisplayInfo(paymentRequest as any);
  const lineItems =
    paymentRequest.invoice_line_items && paymentRequest.invoice_line_items.length > 0
      ? paymentRequest.invoice_line_items
      : null;
  const amount = Number(paymentRequest.amount) || 0;
  const invoiceNumber =
    paymentRequest.invoice_number != null && String(paymentRequest.invoice_number).trim() !== ''
      ? String(paymentRequest.invoice_number)
      : null;
  const dateIso = paymentRequest.created_at || paymentRequest.updated_at;
  const dateLabel = dateIso
    ? new Date(dateIso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;
  const badge = statusBadge(paymentRequest.status);

  const handleDownload = async () => {
    if (!publicToken) return;
    setDownloading(true);
    try {
      const kind = paid ? 'receipt' : 'invoice';
      const res = await fetch(
        `/api/payments/document?token=${encodeURIComponent(publicToken)}&kind=${kind}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to download');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || (paid ? 'receipt.pdf' : 'invoice.pdf');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-5 h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {paid ? 'Receipt' : 'Invoice'}
            {invoiceNumber ? (
              <span className="text-foreground font-medium"> #{invoiceNumber}</span>
            ) : null}
          </p>
          {dateLabel ? <p className="text-xs text-muted-foreground mt-1">{dateLabel}</p> : null}
        </div>
        <Badge className={badge.className}>{badge.label}</Badge>
      </div>

      {(name && name !== 'Unknown') || (email && email !== 'Unknown') ? (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bill to</p>
          {name && name !== 'Unknown' ? (
            <p className="text-sm font-medium text-foreground">{name}</p>
          ) : null}
          {email && email !== 'Unknown' ? (
            <p className="text-sm text-muted-foreground break-all">{email}</p>
          ) : null}
        </div>
      ) : null}

      {paymentRequest.description ? (
        <p className="text-sm text-slate">{paymentRequest.description}</p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {lineItems ? 'Items' : 'Amount due'}
        </p>
        {lineItems ? (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-mist/30 text-left">
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((row, i) => (
                  <tr key={`${row.description}-${i}`} className="border-b last:border-0">
                    <td className="px-3 py-2.5 text-foreground">{row.description}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">
                      {row.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      ${formatMoney(lineAmount(row))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md border px-3 py-3 flex justify-between text-sm">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium tabular-nums">${formatMoney(amount)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-baseline border-t pt-4">
        <span className="text-sm font-semibold">{paid ? 'Total paid' : 'Total due'}</span>
        <span className="text-2xl font-semibold tabular-nums tracking-tight">
          ${formatMoney(amount)}
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full min-h-11"
        onClick={handleDownload}
        disabled={downloading || !publicToken}
      >
        <Download className="size-4 mr-2" aria-hidden />
        {downloading
          ? 'Preparing…'
          : paid
            ? 'Download receipt'
            : 'Download invoice'}
      </Button>
    </div>
  );
}
