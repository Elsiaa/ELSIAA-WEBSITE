"use client";

import {
  useState,
  useEffect,
  useMemo,
  type ClipboardEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  Check,
  CheckCircle,
  Copy,
  Trash2,
  Mail,
  CreditCard,
  FileText,
  Send,
  Pencil,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { type PaymentRequest, getRequestDisplayInfo } from "@/lib/payments-shared";
import type { InvoiceLineItem } from "@/lib/invoice-line-items";
import { totalFromLineItems } from "@/lib/invoice-line-items";
import { parseDoubleSemicolonInvoiceLines } from "@/lib/invoice-line-paste";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PaymentModal from "@/components/admin/payment-modal";
import InvoiceLineItemsTable from "@/components/admin/invoice-line-items-table";
import {
  PAYMENT_METHOD_LABEL_ACH,
  PAYMENT_METHOD_PHRASE_ACH,
  paymentRailDisplayLabel,
} from "@/lib/payment-method-labels";

type DraftInvoiceLine = { id: string; description: string; quantity: string; unitPrice: string };

function newDraftLine(): DraftInvoiceLine {
  return { id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "" };
}

interface PaymentsManagementProps {
  companies: any[];
  isSuperAdmin: boolean;
  currentUser: any;
  onDataChange?: () => void;
}

export default function PaymentsManagementNew({
  companies,
  isSuperAdmin,
  currentUser,
  onDataChange,
}: PaymentsManagementProps) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [invoiceLines, setInvoiceLines] = useState<DraftInvoiceLine[]>(() => [newDraftLine()]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  /** null = idle; which create action is in progress (draft skips email). */
  const [creatingAction, setCreatingAction] = useState<"draft" | "email" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [billingPayment, setBillingPayment] = useState<string | null>(null);
  const [billingAmount, setBillingAmount] = useState("");
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptDialogMode, setReceiptDialogMode] = useState<"receipt" | "invoice">("receipt");
  const [receiptData, setReceiptData] = useState<any>(null);
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [receiptPaymentIntentId, setReceiptPaymentIntentId] = useState<string | undefined>(
    undefined,
  );
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState<string | null>(null);
  const [billingHistory, setBillingHistory] = useState<Record<string, any[]>>({});
  const [loadingBillingHistory, setLoadingBillingHistory] = useState<Record<string, boolean>>({});
  const [projectTransactions, setProjectTransactions] = useState<any[]>([]);
  const [loadingProjectTransactions, setLoadingProjectTransactions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<any>(null);
  const [oneTimeDueDate, setOneTimeDueDate] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PaymentRequest | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    nextBillingDate: "",
    recipientName: "",
    recipientEmail: "",
  });
  const [editInvoiceLines, setEditInvoiceLines] = useState<DraftInvoiceLine[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [createLinePasteText, setCreateLinePasteText] = useState("");
  const [editLinePasteText, setEditLinePasteText] = useState("");

  const createInvoiceTotal = useMemo(() => {
    const items: InvoiceLineItem[] = [];
    for (const row of invoiceLines) {
      const q = parseFloat(row.quantity);
      const u = parseFloat(row.unitPrice);
      const desc = row.description.trim();
      if (!desc || !Number.isFinite(q) || q <= 0 || !Number.isFinite(u) || u < 0) continue;
      items.push({ description: desc, quantity: q, unit_amount: u });
    }
    return items.length ? totalFromLineItems(items) : 0;
  }, [invoiceLines]);

  const editInvoiceTotal = useMemo(() => {
    const items: InvoiceLineItem[] = [];
    for (const row of editInvoiceLines) {
      const q = parseFloat(row.quantity);
      const u = parseFloat(row.unitPrice);
      const desc = row.description.trim();
      if (!desc || !Number.isFinite(q) || q <= 0 || !Number.isFinite(u) || u < 0) continue;
      items.push({ description: desc, quantity: q, unit_amount: u });
    }
    return items.length ? totalFromLineItems(items) : 0;
  }, [editInvoiceLines]);

  const openEditDialog = (req: PaymentRequest) => {
    const { name: dn, email: de } = getRequestDisplayInfo(req);
    setEditingRequest(req);
    setEditForm({
      amount: String(req.amount),
      nextBillingDate: req.next_billing_date ? req.next_billing_date.slice(0, 10) : "",
      recipientName: req.recipient_name ?? dn,
      recipientEmail: req.recipient_email ?? de,
    });
    if (req.payment_type === "one_time") {
      if (req.invoice_line_items?.length) {
        setEditInvoiceLines(
          req.invoice_line_items.map((row, i) => ({
            id: `${req.id}-edit-${i}`,
            description: row.description,
            quantity: String(row.quantity),
            unitPrice: String(row.unit_amount),
          })),
        );
      } else {
        setEditInvoiceLines([
          {
            id: `${req.id}-edit-0`,
            description: "Invoice",
            quantity: "1",
            unitPrice: String(req.amount),
          },
        ]);
      }
    } else {
      setEditInvoiceLines([]);
    }
    setShowEditDialog(true);
    setEditLinePasteText("");
  };

  const applyCreateLinePaste = () => {
    const parsed = parseDoubleSemicolonInvoiceLines(createLinePasteText);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    setInvoiceLines(parsed.lines);
    setCreateLinePasteText("");
    toast.success(`Loaded ${parsed.lines.length} line item(s).`);
  };

  const applyEditLinePaste = () => {
    const parsed = parseDoubleSemicolonInvoiceLines(editLinePasteText);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    setEditInvoiceLines(parsed.lines);
    setEditLinePasteText("");
    toast.success(`Loaded ${parsed.lines.length} line item(s).`);
  };

  /** Pasting `desc;; qty;; price;;` into any line description field expands into rows. */
  const handleLineDescriptionPaste = (
    e: ClipboardEvent<HTMLInputElement>,
    setLines: Dispatch<SetStateAction<DraftInvoiceLine[]>>,
  ) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text || !text.includes(";;")) return;
    const parsed = parseDoubleSemicolonInvoiceLines(text);
    if (!parsed.ok) {
      e.preventDefault();
      toast.error(parsed.error);
      return;
    }
    e.preventDefault();
    setLines(parsed.lines);
    toast.success(`Loaded ${parsed.lines.length} line item(s) from paste.`);
  };

  // Load payment requests
  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/payments");
        if (res.ok) {
          const { requests } = await res.json();
          setPaymentRequests(requests);
        }
      } catch (err) {
        toast.error("Failed to load payment requests");
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, []);

  // Interval billing history and project transactions load on demand (see UI actions).

  const loadProjectTransactions = async () => {
    setLoadingProjectTransactions(true);
    try {
      const res = await fetch("/api/admin/payments/project-transactions");
      if (res.ok) {
        const { transactions } = await res.json();
        console.log("[PAYMENTS-MANAGEMENT] Received transactions from API:", transactions.length);
        console.log(
          "[PAYMENTS-MANAGEMENT] Transaction IDs:",
          transactions.map((tx: any) => ({
            id: tx.id,
            type: tx.type,
            name: tx.type === "fee" ? tx.feeName : tx.subscriptionName,
            amount: tx.amount,
            invoiceNumber: tx.invoiceNumber,
          })),
        );
        setProjectTransactions(transactions);
        console.log(
          "[PAYMENTS-MANAGEMENT] Set projectTransactions state with:",
          transactions.length,
          "transactions",
        );
      }
    } catch (err) {
      console.error("Failed to load project transactions:", err);
    } finally {
      setLoadingProjectTransactions(false);
    }
  };

  const handleCreateRequest = async (sendEmail: boolean) => {
    if (!recipientName || !recipientEmail) {
      toast.error("Enter recipient name and email");
      return;
    }

    const lineItems: InvoiceLineItem[] = [];
    for (const row of invoiceLines) {
      const q = parseFloat(row.quantity);
      const u = parseFloat(row.unitPrice);
      const desc = row.description.trim();
      if (!desc || !Number.isFinite(q) || q <= 0 || !Number.isFinite(u) || u < 0) continue;
      lineItems.push({ description: desc, quantity: q, unit_amount: u });
    }
    if (lineItems.length === 0) {
      toast.error("Add at least one line with description, quantity, and unit price");
      return;
    }
    if (totalFromLineItems(lineItems) <= 0) {
      toast.error("Invoice total must be greater than zero");
      return;
    }

    setCreatingAction(sendEmail ? "email" : "draft");
    try {
      const body: Record<string, unknown> = {
        recipientName,
        recipientEmail,
        lineItems,
      };
      if (oneTimeDueDate) {
        body.nextBillingDate = oneTimeDueDate;
      }

      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const { request } = await res.json();
        setPaymentRequests([request, ...paymentRequests]);
        setRecipientName("");
        setRecipientEmail("");
        setInvoiceLines([newDraftLine()]);
        setOneTimeDueDate("");
        setCreateLinePasteText("");
        if (onDataChange) onDataChange();

        if (!sendEmail) {
          toast.success(
            "Draft saved. Refine line items with Edit, then use Send Invoice when you are ready to email the customer.",
          );
          return;
        }

        const sendRes = await fetch("/api/admin/payments/send-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: request.id }),
        });
        if (sendRes.ok) {
          const bodyJson = await sendRes.json().catch(() => ({}));
          const inv = (bodyJson as { invoiceNumber?: string }).invoiceNumber;
          setPaymentRequests((prev) =>
            prev.map((r) =>
              r.id === request.id && r.status === "pending"
                ? { ...r, status: "invoiced" as const }
                : r,
            ),
          );
          toast.success(
            inv
              ? `Invoice emailed to ${request.recipient_email} (${inv})`
              : `Invoice emailed to ${request.recipient_email}`,
          );
        } else {
          const errBody = await sendRes.json().catch(() => ({}));
          const link = `${window.location.origin}/payments?public_token=${request.public_token}`;
          await navigator.clipboard.writeText(link);
          toast.error(
            (errBody as { error?: string }).error ||
              "Invoice created but email failed. Payment link copied — send manually or try Send Invoice on the request.",
          );
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create request");
      }
    } catch (err) {
      toast.error("Failed to create request");
    } finally {
      setCreatingAction(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;
    setSavingEdit(true);
    try {
      const body: Record<string, unknown> = {};
      if (editForm.recipientName !== editingRequest.recipient_name)
        body.recipientName = editForm.recipientName;
      if (editForm.recipientEmail !== editingRequest.recipient_email)
        body.recipientEmail = editForm.recipientEmail;

      if (editingRequest.payment_type === "one_time") {
        const lineItems: InvoiceLineItem[] = [];
        for (const row of editInvoiceLines) {
          const q = parseFloat(row.quantity);
          const u = parseFloat(row.unitPrice);
          const desc = row.description.trim();
          if (!desc || !Number.isFinite(q) || q <= 0 || !Number.isFinite(u) || u < 0) continue;
          lineItems.push({ description: desc, quantity: q, unit_amount: u });
        }
        if (lineItems.length === 0) {
          toast.error("Add at least one valid line item");
          setSavingEdit(false);
          return;
        }
        body.invoiceLineItems = lineItems;
      } else if (String(editingRequest.amount) !== editForm.amount) {
        body.amount = parseFloat(editForm.amount);
      }

      const currentDue = editingRequest.next_billing_date
        ? editingRequest.next_billing_date.slice(0, 10)
        : "";
      if (currentDue !== editForm.nextBillingDate)
        body.nextBillingDate = editForm.nextBillingDate || null;
      if (Object.keys(body).length === 0) {
        setShowEditDialog(false);
        setEditingRequest(null);
        return;
      }
      const res = await fetch(`/api/admin/payments/${editingRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const { request } = await res.json();
        setPaymentRequests((prev) => prev.map((r) => (r.id === request.id ? request : r)));
        setShowEditDialog(false);
        setEditingRequest(null);
        toast.success("Payment request updated");
        if (onDataChange) onDataChange();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update");
      }
    } catch (err) {
      toast.error("Failed to update payment request");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenBillingDialog = (requestId: string) => {
    setBillingPayment(requestId);
    // Leave amount empty - admin enters amount when billing
    setBillingAmount("");
    setShowBillingDialog(true);
  };

  const handleBillPayment = async () => {
    if (!billingPayment || !billingAmount || parseFloat(billingAmount) <= 0) {
      toast.error("Enter a valid amount to bill");
      return;
    }

    const amount = parseFloat(billingAmount);
    const currentBillingId = billingPayment;

    // Keep billingPayment set during billing, close dialog
    setBillingAmount("");
    setShowBillingDialog(false);

    try {
      const res = await fetch("/api/admin/payments/bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentBillingId,
          amount,
        }),
      });

      if (res.ok) {
        const { success, message } = await res.json();
        if (success) {
          toast.success(message || "Payment billed successfully");
          // Reload payment requests
          const loadRes = await fetch("/api/admin/payments");
          if (loadRes.ok) {
            const { requests } = await loadRes.json();
            setPaymentRequests(requests);
          }
          if (onDataChange) onDataChange();
        } else {
          toast.error(message || "Failed to bill payment");
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to bill payment");
      }
    } catch (err) {
      toast.error("Failed to bill payment");
    } finally {
      // Clear billingPayment only after billing is complete
      setBillingPayment(null);
    }
  };

  const handleMarkPaid = async (req: PaymentRequest) => {
    const amountLabel =
      req.payment_type === "interval_billing" || req.payment_type === "monthly"
        ? "amount on file"
        : `$${req.amount.toFixed(2)}`;
    if (
      !confirm(
        `Mark this payment (${amountLabel}) for ${getRequestDisplayInfo(req).name} as paid? This records payment outside Stripe.`,
      )
    ) {
      return;
    }

    setMarkingPaidId(req.id);
    try {
      const res = await fetch(`/api/admin/payments/${req.id}/mark-paid`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark as paid");
      toast.success(data.message || "Payment marked as paid");
      const loadRes = await fetch("/api/admin/payments");
      if (loadRes.ok) {
        const { requests } = await loadRes.json();
        setPaymentRequests(requests);
      }
      if (onDataChange) onDataChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as paid");
    } finally {
      setMarkingPaidId(null);
    }
  };

  const canMarkPaid = (req: PaymentRequest) =>
    req.status === "pending" || req.status === "invoiced";

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/payments?public_token=${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Payment link copied!");
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this payment request? This action cannot be undone.",
      )
    )
      return;

    setDeleting(id);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setPaymentRequests((prev) => prev.filter((r) => r.id !== id));
        toast.success("Payment request deleted");
        if (onDataChange) onDataChange();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete payment request");
      }
    } catch (err) {
      toast.error("Failed to delete payment request");
    } finally {
      setDeleting(null);
    }
  };

  const handleViewReceipt = async (id: string, paymentIntentId?: string) => {
    setLoadingReceipt(true);
    setReceiptDialogMode("receipt");
    setShowReceiptDialog(true);
    setReceiptPaymentId(id);
    setReceiptPaymentIntentId(paymentIntentId);
    try {
      const url = paymentIntentId
        ? `/api/admin/payments/${id}/receipt?paymentIntentId=${paymentIntentId}`
        : `/api/admin/payments/${id}/receipt`;
      const res = await fetch(url);
      if (res.ok) {
        const { receipt } = await res.json();
        setReceiptData(receipt);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to load receipt");
        setShowReceiptDialog(false);
        setReceiptPaymentId(null);
        setReceiptPaymentIntentId(undefined);
      }
    } catch (err) {
      toast.error("Failed to load receipt");
      setShowReceiptDialog(false);
      setReceiptPaymentId(null);
      setReceiptPaymentIntentId(undefined);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handleViewInvoice = async (id: string) => {
    setLoadingReceipt(true);
    setReceiptDialogMode("invoice");
    setShowReceiptDialog(true);
    setReceiptPaymentId(id);
    setReceiptPaymentIntentId(undefined);
    try {
      const res = await fetch(`/api/admin/payments/${id}/invoice`);
      if (res.ok) {
        const { invoice } = await res.json();
        setReceiptData({
          ...invoice,
          total: invoice.amount,
          fee: 0,
        });
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to load invoice");
        setShowReceiptDialog(false);
        setReceiptPaymentId(null);
      }
    } catch {
      toast.error("Failed to load invoice");
      setShowReceiptDialog(false);
      setReceiptPaymentId(null);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handleSendReceipt = async (id: string, paymentIntentId?: string) => {
    // Create a unique key for this specific receipt (combines id and paymentIntentId)
    const receiptKey = paymentIntentId ? `${id}-${paymentIntentId}` : id;
    setSendingReceipt(receiptKey);
    try {
      const url = paymentIntentId
        ? `/api/admin/payments/${id}/receipt?paymentIntentId=${paymentIntentId}`
        : `/api/admin/payments/${id}/receipt`;
      const res = await fetch(url, {
        method: "POST",
      });

      if (res.ok) {
        const { invoiceNumber } = await res.json();
        toast.success(`Receipt sent successfully! (Invoice #${invoiceNumber})`);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to send receipt");
      }
    } catch (err) {
      toast.error("Failed to send receipt");
    } finally {
      setSendingReceipt(null);
    }
  };

  const loadBillingHistory = async (paymentId: string) => {
    if (billingHistory[paymentId] || loadingBillingHistory[paymentId]) return;

    setLoadingBillingHistory((prev) => ({ ...prev, [paymentId]: true }));
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/billings`);
      if (res.ok) {
        const { billings } = await res.json();
        setBillingHistory((prev) => ({ ...prev, [paymentId]: billings || [] }));
      }
    } catch (err) {
      console.error("Failed to load billing history:", err);
    } finally {
      setLoadingBillingHistory((prev) => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleSendInvoice = async (id: string) => {
    setSendingInvoice(id);
    try {
      const res = await fetch("/api/admin/payments/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        const { invoiceNumber } = await res.json();
        // Update status to invoiced if it was pending
        setPaymentRequests((prev) =>
          prev.map((r) =>
            r.id === id && r.status === "pending" ? { ...r, status: "invoiced" } : r,
          ),
        );
        toast.success(`Invoice sent successfully! (${invoiceNumber})`);
        if (onDataChange) onDataChange();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to send invoice");
      }
    } catch (err) {
      toast.error("Failed to send invoice");
    } finally {
      setSendingInvoice(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "invoiced":
        return <Badge variant="outline">Invoiced</Badge>;
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Request - Only for Super Users */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Create invoice (one-time)
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Add line items with unit prices; we total them for Stripe and for the PDF when you
              email the invoice. Save a draft to keep working on line items (Edit) before sending.
              For recurring charges, use the Subscriptions tab.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Recipient name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Recipient email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Line items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInvoiceLines((rows) => [...rows, newDraftLine()])}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add line
                </Button>
              </div>
              <div className="space-y-2 rounded-md border border-dashed border-border bg-muted/20 p-3">
                <Label
                  htmlFor="create-line-paste"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Paste from billing (description;; qty;; unit price;; …)
                </Label>
                <Textarea
                  id="create-line-paste"
                  placeholder="e.g. Implementation hours;; 1;; 150;; Support;; 2;; 75;;"
                  value={createLinePasteText}
                  onChange={(e) => setCreateLinePasteText(e.target.value)}
                  className="min-h-[4.5rem] font-mono text-xs resize-y"
                />
                <Button type="button" variant="secondary" size="sm" onClick={applyCreateLinePaste}>
                  Load lines from paste
                </Button>
              </div>
              <div className="border rounded-md divide-y">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
                  <span className="col-span-5">Description</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-2 text-right">Unit ($)</span>
                  <span className="col-span-2 text-right">Line</span>
                  <span className="col-span-1" />
                </div>
                {invoiceLines.map((row) => {
                  const q = parseFloat(row.quantity);
                  const u = parseFloat(row.unitPrice);
                  const lineTotal =
                    Number.isFinite(q) && Number.isFinite(u) && q > 0 && u >= 0 ? q * u : NaN;
                  return (
                    <div key={row.id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                      <Input
                        className="col-span-5"
                        placeholder="Description (paste desc;; qty;; $;; …)"
                        value={row.description}
                        onPaste={(e) => handleLineDescriptionPaste(e, setInvoiceLines)}
                        onChange={(e) =>
                          setInvoiceLines((lines) =>
                            lines.map((l) =>
                              l.id === row.id ? { ...l, description: e.target.value } : l,
                            ),
                          )
                        }
                      />
                      <Input
                        className="col-span-2"
                        type="number"
                        min="0.01"
                        step="any"
                        value={row.quantity}
                        onChange={(e) =>
                          setInvoiceLines((lines) =>
                            lines.map((l) =>
                              l.id === row.id ? { ...l, quantity: e.target.value } : l,
                            ),
                          )
                        }
                      />
                      <Input
                        className="col-span-2"
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.unitPrice}
                        onChange={(e) =>
                          setInvoiceLines((lines) =>
                            lines.map((l) =>
                              l.id === row.id ? { ...l, unitPrice: e.target.value } : l,
                            ),
                          )
                        }
                      />
                      <div className="col-span-2 text-right text-sm tabular-nums">
                        {Number.isFinite(lineTotal) ? `$${lineTotal.toFixed(2)}` : "—"}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          disabled={invoiceLines.length <= 1}
                          onClick={() =>
                            setInvoiceLines((lines) => lines.filter((l) => l.id !== row.id))
                          }
                          aria-label="Remove line"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end text-sm">
                <span className="text-muted-foreground mr-2">Invoice total</span>
                <span className="font-semibold tabular-nums">${createInvoiceTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="one-time-due">Due date (optional)</Label>
              <Input
                id="one-time-due"
                type="date"
                value={oneTimeDueDate}
                onChange={(e) => setOneTimeDueDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to make the charge due immediately.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCreateRequest(false)}
                disabled={
                  creatingAction !== null ||
                  !recipientName ||
                  !recipientEmail ||
                  createInvoiceTotal <= 0
                }
                className="sm:flex-1"
              >
                {creatingAction === "draft" ? "Saving…" : "Save draft"}
              </Button>
              <Button
                type="button"
                onClick={() => handleCreateRequest(true)}
                disabled={
                  creatingAction !== null ||
                  !recipientName ||
                  !recipientEmail ||
                  createInvoiceTotal <= 0
                }
                className="sm:flex-1"
              >
                {creatingAction === "email" ? "Sending…" : "Create and email invoice"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List Requests with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Tabs
              defaultValue="pending"
              className="w-full"
              onValueChange={(tab) => {
                if (tab === "history") {
                  paymentRequests
                    .filter((r) => r.payment_type === "interval_billing" && r.invoice_number)
                    .forEach((req) => {
                      if (!billingHistory[req.id] && !loadingBillingHistory[req.id]) {
                        loadBillingHistory(req.id);
                      }
                    });
                }
                if (
                  tab === "project-transactions" &&
                  isSuperAdmin &&
                  projectTransactions.length === 0 &&
                  !loadingProjectTransactions
                ) {
                  loadProjectTransactions();
                }
              }}
            >
              <TabsList>
                <TabsTrigger value="pending">
                  Pending (
                  {
                    paymentRequests.filter((r) => {
                      const isRecurringWithPaymentMethod =
                        (r.payment_type === "interval_billing" || r.payment_type === "monthly") &&
                        r.stripe_payment_method_id;
                      return (
                        (r.status === "pending" || r.status === "invoiced") &&
                        !isRecurringWithPaymentMethod
                      );
                    }).length
                  }
                  )
                </TabsTrigger>
                <TabsTrigger value="intervals">
                  Intervals (
                  {
                    paymentRequests.filter(
                      (r) =>
                        (r.payment_type === "interval_billing" || r.payment_type === "monthly") &&
                        r.stripe_payment_method_id,
                    ).length
                  }
                  )
                </TabsTrigger>
                <TabsTrigger value="history">
                  History (
                  {
                    paymentRequests.filter((r) => {
                      // Show completed payments (one-time and monthly)
                      // Also show interval_billing payments that have been billed (have invoice_number)
                      return (
                        r.status === "completed" ||
                        (r.payment_type === "interval_billing" && r.invoice_number)
                      );
                    }).length
                  }
                  )
                </TabsTrigger>
                <TabsTrigger value="project-transactions">
                  Project Payments ({projectTransactions.length})
                </TabsTrigger>
              </TabsList>

              {/* Pending Tab */}
              <TabsContent value="pending" className="mt-4">
                {paymentRequests.filter((r) => {
                  const isRecurringWithPaymentMethod =
                    (r.payment_type === "interval_billing" || r.payment_type === "monthly") &&
                    r.stripe_payment_method_id;
                  return (
                    (r.status === "pending" || r.status === "invoiced") &&
                    !isRecurringWithPaymentMethod
                  );
                }).length === 0 ? (
                  <p className="text-muted-foreground">No pending payments.</p>
                ) : (
                  <div className="space-y-3">
                    {paymentRequests
                      .filter((r) => {
                        const isRecurringWithPaymentMethod =
                          (r.payment_type === "interval_billing" || r.payment_type === "monthly") &&
                          r.stripe_payment_method_id;
                        return (
                          (r.status === "pending" || r.status === "invoiced") &&
                          !isRecurringWithPaymentMethod
                        );
                      })
                      .map((req) => {
                        const { name: displayName, email: displayEmail } =
                          getRequestDisplayInfo(req);
                        return (
                          <Accordion
                            key={req.id}
                            type="single"
                            collapsible
                            className="border rounded-lg"
                          >
                            <AccordionItem value={req.id} className="border-none">
                              <div className="flex items-center justify-between p-3">
                                <AccordionTrigger className="flex-1 hover:no-underline">
                                  <div className="flex-1 text-left">
                                    <div className="font-medium">{displayName}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {displayEmail} -{" "}
                                      {req.payment_type === "interval_billing" ||
                                      req.payment_type === "monthly"
                                        ? "Amount set when billing"
                                        : `$${req.amount.toFixed(2)}`}{" "}
                                      - {new Date(req.created_at).toLocaleDateString()}
                                      {req.payment_type === "one_time" && req.next_billing_date && (
                                        <span className="ml-2 text-muted-foreground">
                                          Due:{" "}
                                          {new Date(req.next_billing_date).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      {statusBadge(req.status)}
                                      <Badge variant="outline">
                                        {req.payment_type === "one_time"
                                          ? "One-Time"
                                          : req.payment_type === "monthly"
                                            ? "Monthly"
                                            : "Interval Billing"}
                                      </Badge>
                                      {req.invoice_number && (
                                        <Badge variant="secondary">
                                          Invoice #{req.invoice_number}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <div
                                  className="flex items-center gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleSendInvoice(req.id)}
                                    disabled={sendingInvoice === req.id}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                  >
                                    {sendingInvoice === req.id ? (
                                      "Sending..."
                                    ) : (
                                      <>
                                        <Mail className="w-4 h-4 mr-1" />
                                        Send Invoice
                                      </>
                                    )}
                                  </Button>
                                  {isSuperAdmin && canMarkPaid(req) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleMarkPaid(req)}
                                      disabled={markingPaidId === req.id}
                                      title="Record payment received outside Stripe"
                                    >
                                      {markingPaidId === req.id ? (
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                      )}
                                      Mark as paid
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyLink(req.public_token)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPaymentRequest(req);
                                      setShowPaymentModal(true);
                                    }}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                  >
                                    <CreditCard className="w-4 h-4 mr-1" />
                                    Pay Now
                                  </Button>
                                  {isSuperAdmin && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditDialog(req)}
                                      title="Edit payment request (super admin only)"
                                    >
                                      <Pencil className="w-4 h-4 mr-1" />
                                      Edit
                                    </Button>
                                  )}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(req.id)}
                                    disabled={deleting === req.id}
                                  >
                                    {deleting === req.id ? (
                                      "Deleting..."
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <AccordionContent className="px-3 pb-3">
                                <div className="space-y-3 pt-2 border-t">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Recipient:</span>
                                      <p className="font-medium">{displayName}</p>
                                      <p className="text-muted-foreground">{displayEmail}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Amount:</span>
                                      <p className="font-medium">
                                        {req.payment_type === "interval_billing" ||
                                        req.payment_type === "monthly"
                                          ? "Amount set when billing"
                                          : `$${req.amount.toFixed(2)}`}
                                      </p>
                                    </div>
                                    {req.invoice_number && (
                                      <div>
                                        <span className="text-muted-foreground">Invoice #:</span>
                                        <p className="font-medium">{req.invoice_number}</p>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-muted-foreground">Created:</span>
                                      <p className="font-medium">
                                        {new Date(req.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  {req.invoice_line_items && req.invoice_line_items.length > 0 && (
                                    <InvoiceLineItemsTable items={req.invoice_line_items} />
                                  )}
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewInvoice(req.id)}
                                      title="View Invoice"
                                    >
                                      <FileText className="w-4 h-4 mr-1" />
                                      View Invoice
                                    </Button>
                                    {req.invoice_number && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSendReceipt(req.id)}
                                        disabled={sendingReceipt === req.id}
                                        title="Send Receipt"
                                      >
                                        {sendingReceipt === req.id ? (
                                          "Sending..."
                                        ) : (
                                          <>
                                            <Send className="w-4 h-4 mr-1" />
                                            Send Receipt
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        );
                      })}
                  </div>
                )}
              </TabsContent>

              {/* Intervals Tab */}
              <TabsContent value="intervals" className="mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  New recurring or interval billing should be set up under Subscriptions. This list
                  is for existing linked payment requests that already have a saved card or{" "}
                  {PAYMENT_METHOD_PHRASE_ACH} method.
                </p>
                {paymentRequests.filter(
                  (r) =>
                    (r.payment_type === "interval_billing" || r.payment_type === "monthly") &&
                    r.stripe_payment_method_id,
                ).length === 0 ? (
                  <p className="text-muted-foreground">
                    No payments with saved payment methods available for billing.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {paymentRequests
                      .filter(
                        (r) =>
                          (r.payment_type === "interval_billing" || r.payment_type === "monthly") &&
                          r.stripe_payment_method_id,
                      )
                      .sort((a, b) => {
                        // Sort by status: pending/invoiced first, then completed
                        const statusOrder = { pending: 0, invoiced: 1, completed: 2, cancelled: 3 };
                        const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
                        const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
                        if (aOrder !== bOrder) return aOrder - bOrder;
                        // Then by date (newest first)
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                      })
                      .map((req) => {
                        const { name: displayName, email: displayEmail } =
                          getRequestDisplayInfo(req);
                        return (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{displayName}</div>
                              <div className="text-sm text-muted-foreground">
                                {displayEmail} - Amount set when billing -{" "}
                                {new Date(req.created_at).toLocaleDateString()}
                                {req.invoice_number && (
                                  <span className="ml-2 font-semibold text-foreground">
                                    Last Invoice #: {req.invoice_number}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {statusBadge(req.status)}
                                <Badge variant="outline">
                                  {req.payment_type === "monthly" ? "Monthly" : "Interval Billing"}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  Payment Method Saved
                                </Badge>
                                {req.payment_type === "interval_billing" &&
                                  req.status === "invoiced" && (
                                    <Badge
                                      variant="default"
                                      className="text-xs bg-primary text-primary-foreground"
                                    >
                                      Ready to Bill Again
                                    </Badge>
                                  )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* For interval_billing, always show Bill Now button (even if completed) */}
                              {/* For monthly, only show if not completed */}
                              {(req.payment_type === "interval_billing" ||
                                req.status !== "completed") && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleOpenBillingDialog(req.id)}
                                  disabled={billingPayment === req.id}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                  {billingPayment === req.id ? (
                                    "Billing..."
                                  ) : (
                                    <>
                                      <CreditCard className="w-4 h-4 mr-1" />
                                      Bill Now
                                    </>
                                  )}
                                </Button>
                              )}
                              {isSuperAdmin && canMarkPaid(req) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkPaid(req)}
                                  disabled={markingPaidId === req.id}
                                >
                                  {markingPaidId === req.id ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                  )}
                                  Mark as paid
                                </Button>
                              )}
                              {isSuperAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(req)}
                                  title="Edit payment request (super admin only)"
                                >
                                  <Pencil className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyLink(req.public_token)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedPaymentRequest(req);
                                  setShowPaymentModal(true);
                                }}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Pay Now
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(req.id)}
                                disabled={deleting === req.id}
                              >
                                {deleting === req.id ? (
                                  "Deleting..."
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-4">
                {(() => {
                  // Get all completed payments (one-time and monthly)
                  const completedPayments = paymentRequests.filter(
                    (r) => r.status === "completed" && r.payment_type !== "interval_billing",
                  );

                  // Get interval billing payments that have been billed
                  const intervalPayments = paymentRequests.filter(
                    (r) => r.payment_type === "interval_billing" && r.invoice_number,
                  );

                  // Create entries for all billings
                  const allHistoryEntries: any[] = [];

                  // Add completed payments
                  completedPayments.forEach((req) => {
                    allHistoryEntries.push({
                      type: "payment",
                      paymentRequest: req,
                      billing: null,
                    });
                  });

                  // Add each billing for interval payments
                  intervalPayments.forEach((req) => {
                    const billings = billingHistory[req.id] || [];
                    if (billings.length > 0) {
                      billings.forEach((billing) => {
                        allHistoryEntries.push({
                          type: "billing",
                          paymentRequest: req,
                          billing: billing,
                        });
                      });
                    } else if (req.invoice_number) {
                      // Fallback: show payment request if billing history not loaded yet
                      allHistoryEntries.push({
                        type: "payment",
                        paymentRequest: req,
                        billing: null,
                      });
                    }
                  });

                  // Sort by date (most recent first)
                  allHistoryEntries.sort((a, b) => {
                    const dateA = a.billing
                      ? new Date(a.billing.date).getTime()
                      : new Date(
                          a.paymentRequest.updated_at || a.paymentRequest.created_at,
                        ).getTime();
                    const dateB = b.billing
                      ? new Date(b.billing.date).getTime()
                      : new Date(
                          b.paymentRequest.updated_at || b.paymentRequest.created_at,
                        ).getTime();
                    return dateB - dateA;
                  });

                  if (allHistoryEntries.length === 0) {
                    return <p className="text-muted-foreground">No completed payments yet.</p>;
                  }

                  return (
                    <div className="space-y-3">
                      {allHistoryEntries.map((entry, idx) => {
                        const req = entry.paymentRequest;
                        const billing = entry.billing;
                        const { name: displayName, email: displayEmail } =
                          getRequestDisplayInfo(req);
                        const invoiceNumber = billing?.invoiceNumber || req.invoice_number;
                        const amount = billing?.amount || req.amount;
                        const date = billing
                          ? new Date(billing.date)
                          : new Date(req.updated_at || req.created_at);

                        return (
                          <Accordion
                            key={`${req.id}-${billing?.paymentIntentId || idx}`}
                            type="single"
                            collapsible
                            className="border rounded-lg"
                          >
                            <AccordionItem value={`${req.id}-${idx}`} className="border-none">
                              <div className="flex items-center justify-between p-3">
                                <AccordionTrigger className="flex-1 hover:no-underline py-0">
                                  <div className="flex-1 text-left">
                                    <div className="font-medium">{displayName}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {displayEmail} - ${amount.toFixed(2)} -{" "}
                                      {date.toLocaleDateString()}
                                      {invoiceNumber && (
                                        <span className="ml-2 font-semibold text-foreground">
                                          Invoice #: {invoiceNumber}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      {statusBadge(req.status)}
                                      <Badge variant="outline">
                                        {req.payment_type === "one_time"
                                          ? "One-Time"
                                          : req.payment_type === "monthly"
                                            ? "Monthly"
                                            : "Interval Billing"}
                                      </Badge>
                                      {billing && (
                                        <Badge variant="secondary" className="text-xs">
                                          {billing.paymentMethod === "ach"
                                            ? PAYMENT_METHOD_LABEL_ACH
                                            : "Card"}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <div
                                  className="flex items-center gap-2 ml-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {isSuperAdmin && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditDialog(req)}
                                      title="Edit payment request (super admin only)"
                                    >
                                      <Pencil className="w-4 h-4 mr-1" />
                                      Edit
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleViewReceipt(req.id, billing?.paymentIntentId)
                                    }
                                    title="View Receipt"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleSendReceipt(req.id, billing?.paymentIntentId)
                                    }
                                    disabled={
                                      sendingReceipt ===
                                      (billing?.paymentIntentId
                                        ? `${req.id}-${billing.paymentIntentId}`
                                        : req.id)
                                    }
                                    title="Send Receipt"
                                  >
                                    {sendingReceipt ===
                                    (billing?.paymentIntentId
                                      ? `${req.id}-${billing.paymentIntentId}`
                                      : req.id) ? (
                                      "Sending..."
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                  </Button>
                                  {req.payment_type !== "interval_billing" && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopyLink(req.public_token)}
                                        title="Copy Link"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(req.id)}
                                        disabled={deleting === req.id}
                                        title="Delete"
                                      >
                                        {deleting === req.id ? (
                                          "Deleting..."
                                        ) : (
                                          <Trash2 className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <AccordionContent className="px-3 pb-3">
                                {req.invoice_line_items && req.invoice_line_items.length > 0 ? (
                                  <InvoiceLineItemsTable
                                    items={req.invoice_line_items}
                                    className="mt-2"
                                  />
                                ) : (
                                  <p className="text-sm text-muted-foreground pt-2 border-t">
                                    No line-item breakdown stored for this invoice.
                                  </p>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        );
                      })}
                    </div>
                  );
                })()}
              </TabsContent>

              {/* Project Transactions Tab - Central payment history for fees and subscriptions */}
              <TabsContent value="project-transactions" className="mt-4">
                {loadingProjectTransactions ? (
                  <p className="text-muted-foreground">Loading project transactions...</p>
                ) : projectTransactions.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      Project payment history is not loaded yet.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => loadProjectTransactions()}
                    >
                      Load project payments
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      console.log(
                        "[PAYMENTS-MANAGEMENT] Rendering transactions. Total in state:",
                        projectTransactions.length,
                      );
                      console.log(
                        "[PAYMENTS-MANAGEMENT] Transactions to render:",
                        projectTransactions.map((tx: any) => ({
                          id: tx.id,
                          type: tx.type,
                          name: tx.type === "fee" ? tx.feeName : tx.subscriptionName,
                          amount: tx.amount,
                          invoiceNumber: tx.invoiceNumber,
                          hasNullName: !(tx.type === "fee" ? tx.feeName : tx.subscriptionName),
                        })),
                      );
                      return projectTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {tx.type === "fee"
                                ? tx.feeName || "Unknown Fee"
                                : tx.subscriptionName || "Unknown Subscription"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {tx.companyName} - {tx.projectTitle} - ${tx.amount.toFixed(2)} -{" "}
                              {new Date(tx.transactionDate).toLocaleDateString()}
                              {tx.invoiceNumber && (
                                <span className="ml-2 font-semibold text-foreground">
                                  Invoice #: {tx.invoiceNumber}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={tx.type === "fee" ? "default" : "secondary"}>
                                {tx.type === "fee" ? "One-Time Fee" : "Monthly Subscription"}
                              </Badge>
                              {tx.billingPeriodStart && tx.billingPeriodEnd && (
                                <Badge variant="outline" className="text-xs">
                                  {new Date(tx.billingPeriodStart).toLocaleDateString()} -{" "}
                                  {new Date(tx.billingPeriodEnd).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {tx.paymentRequestId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleViewReceipt(tx.paymentRequestId, tx.stripePaymentIntentId)
                                }
                                title="View Receipt"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Billing Dialog */}
      <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bill Payment</DialogTitle>
            <DialogDescription>
              Enter the amount to charge the saved payment method. This will automatically charge
              the customer’s card or {PAYMENT_METHOD_PHRASE_ACH} account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="billingAmount">Amount ($)</Label>
              <Input
                id="billingAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={billingAmount}
                onChange={(e) => setBillingAmount(e.target.value)}
                placeholder="Enter amount to bill"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBillingDialog(false);
                setBillingAmount("");
                setBillingPayment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBillPayment}
              disabled={!billingAmount || parseFloat(billingAmount) <= 0}
            >
              Bill Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {receiptDialogMode === "invoice" ? "Invoice" : "Payment Receipt"}
            </DialogTitle>
            <DialogDescription>
              {receiptDialogMode === "invoice"
                ? "Invoice details for this payment request"
                : "Receipt details for this payment"}
            </DialogDescription>
          </DialogHeader>
          {loadingReceipt ? (
            <div className="py-8 text-center">Loading…</div>
          ) : receiptData ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Invoice Number</Label>
                  <p className="font-semibold">{receiptData.invoiceNumber || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p>
                    {new Date(receiptData.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Bill To</Label>
                <p className="font-medium">{receiptData.recipientName}</p>
                <p className="text-sm text-muted-foreground">{receiptData.recipientEmail}</p>
              </div>

              {receiptData.lineItems && receiptData.lineItems.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Line Items</Label>
                  <InvoiceLineItemsTable items={receiptData.lineItems} />
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-muted-foreground">
                  {receiptDialogMode === "invoice" ? "Invoice Total" : "Payment Details"}
                </Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>
                      {receiptDialogMode === "invoice" ? "Amount due:" : "Service Amount:"}
                    </span>
                    <span className="font-medium">${receiptData.amount.toFixed(2)}</span>
                  </div>
                  {receiptDialogMode === "receipt" && receiptData.fee > 0 && (
                    <div className="flex justify-between">
                      <span>Processing Fee (3%):</span>
                      <span className="font-medium">${receiptData.fee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                    <span>{receiptDialogMode === "invoice" ? "Total due:" : "Total Paid:"}</span>
                    <span>${(receiptData.total ?? receiptData.amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {receiptDialogMode === "receipt" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Payment Method</Label>
                    <p className="font-medium">
                      {paymentRailDisplayLabel(receiptData.paymentMethod)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payment Type</Label>
                    <p className="capitalize">
                      {receiptData.paymentType === "one_time"
                        ? "One-Time"
                        : receiptData.paymentType === "monthly"
                          ? "Monthly"
                          : "Interval Billing"}
                    </p>
                  </div>
                </div>
              )}
              {receiptDialogMode === "invoice" && receiptData.statusLabel && (
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium">{receiptData.statusLabel}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No data available</div>
          )}
          <DialogFooter>
            {receiptData && receiptPaymentId && receiptDialogMode === "invoice" && (
              <Button asChild variant="secondary">
                <a
                  href={`/api/admin/payments/${receiptPaymentId}/invoice?format=pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download PDF
                </a>
              </Button>
            )}
            {receiptData && receiptPaymentId && receiptDialogMode === "receipt" && (
              <Button
                onClick={() => handleSendReceipt(receiptPaymentId, receiptPaymentIntentId)}
                disabled={
                  sendingReceipt ===
                  (receiptPaymentIntentId
                    ? `${receiptPaymentId}-${receiptPaymentIntentId}`
                    : receiptPaymentId)
                }
              >
                {sendingReceipt ===
                (receiptPaymentIntentId
                  ? `${receiptPaymentId}-${receiptPaymentIntentId}`
                  : receiptPaymentId) ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Receipt
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setShowReceiptDialog(false);
                setReceiptData(null);
                setReceiptPaymentId(null);
                setReceiptPaymentIntentId(undefined);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {selectedPaymentRequest && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPaymentRequest(null);
          }}
          public_token={selectedPaymentRequest.public_token}
          paymentRequest={selectedPaymentRequest}
          onSuccess={() => {
            // Reload payment requests after successful payment
            const loadRequests = async () => {
              try {
                const res = await fetch("/api/admin/payments");
                if (res.ok) {
                  const { requests } = await res.json();
                  setPaymentRequests(requests);
                }
              } catch (err) {
                console.error("Failed to reload payment requests:", err);
              }
            };
            loadRequests();
            if (onDataChange) onDataChange();
          }}
        />
      )}

      {/* Edit payment request (super admin only) */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit payment request</DialogTitle>
            <DialogDescription>
              Update recipient, due date, and for one-time requests the line items (total updates
              amount for Stripe).
            </DialogDescription>
          </DialogHeader>
          {editingRequest && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Recipient name</Label>
                <Input
                  value={editForm.recipientName}
                  onChange={(e) => setEditForm((f) => ({ ...f, recipientName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Recipient email</Label>
                <Input
                  type="email"
                  value={editForm.recipientEmail}
                  onChange={(e) => setEditForm((f) => ({ ...f, recipientEmail: e.target.value }))}
                />
              </div>
              {editingRequest.payment_type === "one_time" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Line items</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditInvoiceLines((rows) => [...rows, newDraftLine()])}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add line
                    </Button>
                  </div>
                  <div className="space-y-2 rounded-md border border-dashed border-border bg-muted/20 p-3">
                    <Label
                      htmlFor="edit-line-paste"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Paste from billing (description;; qty;; unit price;; …)
                    </Label>
                    <Textarea
                      id="edit-line-paste"
                      placeholder="e.g. Implementation hours;; 1;; 150;; Support;; 2;; 75;;"
                      value={editLinePasteText}
                      onChange={(e) => setEditLinePasteText(e.target.value)}
                      className="min-h-[4.5rem] font-mono text-xs resize-y"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={applyEditLinePaste}
                    >
                      Load lines from paste
                    </Button>
                  </div>
                  <div className="border rounded-md divide-y">
                    <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
                      <span className="col-span-5">Description</span>
                      <span className="col-span-2 text-right">Qty</span>
                      <span className="col-span-2 text-right">Unit ($)</span>
                      <span className="col-span-2 text-right">Line</span>
                      <span className="col-span-1" />
                    </div>
                    {editInvoiceLines.map((row) => {
                      const q = parseFloat(row.quantity);
                      const u = parseFloat(row.unitPrice);
                      const lineTotal =
                        Number.isFinite(q) && Number.isFinite(u) && q > 0 && u >= 0 ? q * u : NaN;
                      return (
                        <div
                          key={row.id}
                          className="grid grid-cols-12 gap-2 px-3 py-2 items-center"
                        >
                          <Input
                            className="col-span-5"
                            value={row.description}
                            onPaste={(e) => handleLineDescriptionPaste(e, setEditInvoiceLines)}
                            onChange={(e) =>
                              setEditInvoiceLines((lines) =>
                                lines.map((l) =>
                                  l.id === row.id ? { ...l, description: e.target.value } : l,
                                ),
                              )
                            }
                          />
                          <Input
                            className="col-span-2"
                            type="number"
                            min="0.01"
                            step="any"
                            value={row.quantity}
                            onChange={(e) =>
                              setEditInvoiceLines((lines) =>
                                lines.map((l) =>
                                  l.id === row.id ? { ...l, quantity: e.target.value } : l,
                                ),
                              )
                            }
                          />
                          <Input
                            className="col-span-2"
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.unitPrice}
                            onChange={(e) =>
                              setEditInvoiceLines((lines) =>
                                lines.map((l) =>
                                  l.id === row.id ? { ...l, unitPrice: e.target.value } : l,
                                ),
                              )
                            }
                          />
                          <div className="col-span-2 text-right text-sm tabular-nums">
                            {Number.isFinite(lineTotal) ? `$${lineTotal.toFixed(2)}` : "—"}
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              disabled={editInvoiceLines.length <= 1}
                              onClick={() =>
                                setEditInvoiceLines((lines) => lines.filter((l) => l.id !== row.id))
                              }
                              aria-label="Remove line"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end text-sm">
                    <span className="text-muted-foreground mr-2">Invoice total</span>
                    <span className="font-semibold tabular-nums">
                      ${editInvoiceTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.amount}
                    onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Due date (optional — leave empty for immediate)</Label>
                <Input
                  type="date"
                  value={editForm.nextBillingDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, nextBillingDate: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={
                savingEdit ||
                (Boolean(editingRequest?.payment_type === "one_time") && editInvoiceTotal <= 0)
              }
            >
              {savingEdit ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
