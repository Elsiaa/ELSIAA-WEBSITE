"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import InvoiceLineItemsTable from "@/components/admin/invoice-line-items-table";
import type { InvoiceLineItem } from "@/lib/invoice-line-items";
import { fetchHistoryLineItems, type HistoryLineItemsSource } from "@/lib/fetch-history-line-items";

interface HistoryRowLineItemsProps {
  row: HistoryLineItemsSource;
  /** When true, fetch immediately (row is expanded). */
  active: boolean;
}

export default function HistoryRowLineItems({ row, active }: HistoryRowLineItemsProps) {
  const [items, setItems] = useState<InvoiceLineItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!active || loaded) return;
    let cancelled = false;
    setLoading(true);
    void fetchHistoryLineItems(row)
      .then((result) => {
        if (!cancelled) {
          setItems(result);
          setLoaded(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, loaded, row]);

  if (!active) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading line items…
      </div>
    );
  }

  if (items && items.length > 0) {
    return <InvoiceLineItemsTable items={items} className="mt-2" />;
  }

  if (row.type === "payment" || row.type === "bill") {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No line-item breakdown stored for this charge.
      </p>
    );
  }

  return null;
}
