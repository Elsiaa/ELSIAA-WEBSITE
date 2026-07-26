import type { InvoiceLineItem } from '@/lib/invoice-line-items';

interface InvoiceLineItemsTableProps {
  items: InvoiceLineItem[];
  className?: string;
}

/** Read-only line-item table (matches Pending accordion styling in payments-management). */
export default function InvoiceLineItemsTable({ items, className }: InvoiceLineItemsTableProps) {
  if (!items.length) return null;

  return (
    <div className={`border rounded-md overflow-hidden text-sm ${className ?? ''}`}>
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
            <th className="p-2 font-medium">Item</th>
            <th className="p-2 font-medium text-right">Qty</th>
            <th className="p-2 font-medium text-right">Unit</th>
            <th className="p-2 font-medium text-right">Line</th>
          </tr>
        </thead>
        <tbody>
          {items.map((line, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{line.description}</td>
              <td className="p-2 text-right tabular-nums">{line.quantity}</td>
              <td className="p-2 text-right tabular-nums">${line.unit_amount.toFixed(2)}</td>
              <td className="p-2 text-right tabular-nums font-medium">
                ${(line.quantity * line.unit_amount).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
