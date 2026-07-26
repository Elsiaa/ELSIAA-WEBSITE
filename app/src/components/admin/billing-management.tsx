'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
  type ClipboardEvent,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Copy,
  Mail,
  Pause,
  Play,
  Plus,
  Minus,
  RefreshCw,
  Send,
  Zap,
  FileText,
  Ban,
  Pencil,
  Eye,
  FlaskConical,
  Zap as ZapIcon,
  Loader2,
  History,
  Download,
  CheckCircle,
} from 'lucide-react';
import { totalFromLineItems } from '@/lib/invoice-line-items';
import type { InvoiceLineItem } from '@/lib/invoice-line-items';
import { parseDoubleSemicolonInvoiceLines } from '@/lib/invoice-line-paste';
import type { BillRecurrenceInterval } from '@/lib/bills';
import type { ProjectFee, ProjectSubscription } from '@/lib/project-payments';
import InvoiceLineItemsTable from '@/components/admin/invoice-line-items-table';
import HistoryRowLineItems from '@/components/admin/history-row-line-items';

type DraftLine = { id: string; description: string; quantity: string; unitPrice: string };

interface BillRow {
  id: string;
  recipientEmail: string;
  recipientName: string;
  userId: string | null;
  companyId: string | null;
  scheduleType: 'one_time' | 'recurring';
  collectionMode: 'auto_charge' | 'invoice_link';
  amount: number;
  status: string;
  nextBillingDate: string | null;
  publicToken: string;
  stripePaymentMethodId: string | null;
  description: string | null;
  lineItems?: InvoiceLineItem[];
  recurrenceInterval?: BillRecurrenceInterval | null;
  recurrenceDayOfMonth?: number | null;
  recurrenceDayOfWeek?: number | null;
  companies?: { name: string } | null;
}

interface BillChargeRow {
  id: string;
  billId: string;
  invoiceNumber: number | null;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  lineItemsSnapshot?: InvoiceLineItem[];
}

type UnifiedHistoryRow = {
  id: string;
  type: 'fee' | 'subscription' | 'bill' | 'payment';
  feeName: string | null;
  subscriptionName: string | null;
  billDescription: string | null;
  billRecipientName: string | null;
  paymentRecipientName?: string | null;
  paymentRecipientEmail?: string | null;
  paymentType?: string | null;
  projectTitle: string | null;
  companyName: string | null;
  amount: number;
  invoiceNumber: number | null;
  paymentRequestId: string | null;
  stripePaymentIntentId: string | null;
  billId: string | null;
  chargeId: string | null;
  transactionDate: string;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
};

function newDraftLine(): DraftLine {
  return { id: crypto.randomUUID(), description: '', quantity: '1', unitPrice: '' };
}

function BtnIcon({ loading, children }: { loading: boolean; children: ReactNode }) {
  if (loading) return <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />;
  return <>{children}</>;
}

function BtnIconSm({ loading, children }: { loading: boolean; children: ReactNode }) {
  if (loading) return <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin shrink-0" />;
  return <>{children}</>;
}

function draftToLineItems(lines: DraftLine[]): InvoiceLineItem[] {
  return lines
    .map((row) => ({
      description: row.description.trim(),
      quantity: parseFloat(row.quantity),
      unit_amount: parseFloat(row.unitPrice),
    }))
    .filter(
      (r) =>
        r.description &&
        Number.isFinite(r.quantity) &&
        r.quantity > 0 &&
        Number.isFinite(r.unit_amount) &&
        r.unit_amount >= 0
    );
}

interface BillingManagementProps {
  companies: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; title: string; companyId: string }>;
  isSuperAdmin: boolean;
}

type BillingCronRunResult = {
  asOfDate: string;
  dryRun: boolean;
  message: string;
  billing: {
    processed: number;
    processedPaymentRequests: number;
    processedBills?: number;
    errors: number;
    paymentRequestErrors: number;
    billErrors?: Array<{ billId: string; error: string }>;
    subscriptionDebug?: Array<{ id: string; name: string; company_id: string; next_billing_date: string | null; reason: string }>;
    paymentRequestDebug?: Array<{ id: string; amount: number; payment_type: string; next_billing_date: string | null; reason: string }>;
    billDebug?: Array<{
      id: string;
      recipientName: string;
      recipientEmail: string;
      amount: number;
      collectionMode: string;
      reason: string;
      companyName: string | null;
    }>;
    billReminderDebug?: Array<{ id: string; recipientEmail: string; amount: number; reason: string }>;
    dryRunDebug?: {
      allPaymentRequestsBreakdown?: Array<{ company_name: string; id: string; payment_type: string; amount: number; reason: string }>;
    };
  };
  warnings?: { sent: number; details?: unknown[] };
};

export default function BillingManagement({ companies, projects, isSuperAdmin }: BillingManagementProps) {
  const [bills, setBills] = useState<BillRow[]>([]);
  const [chargesByBill, setChargesByBill] = useState<Record<string, BillChargeRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'action' | 'history' | 'subscriptions'>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [legacyFees, setLegacyFees] = useState<ProjectFee[]>([]);
  const [legacySubscriptions, setLegacySubscriptions] = useState<ProjectSubscription[]>([]);
  const [loadingLegacy, setLoadingLegacy] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const [expandedChargeId, setExpandedChargeId] = useState<string | null>(null);
  const [expandedHistoryRowId, setExpandedHistoryRowId] = useState<string | null>(null);

  const [recipientMode, setRecipientMode] = useState<'manual' | 'user'>('manual');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [scheduleType, setScheduleType] = useState<'one_time' | 'recurring'>('one_time');
  const [collectionMode, setCollectionMode] = useState<'invoice_link' | 'auto_charge'>('invoice_link');
  const [recurrenceInterval, setRecurrenceInterval] = useState<BillRecurrenceInterval>('monthly');
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(String(new Date().getDate()));
  const [recurrenceDayOfWeek, setRecurrenceDayOfWeek] = useState(String(new Date().getDay()));
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attachCompanyPm, setAttachCompanyPm] = useState(true);
  const [sendInvoiceEmail, setSendInvoiceEmail] = useState(true);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([newDraftLine()]);
  const [users, setUsers] = useState<Array<{ id: string; email: string; first_name?: string; last_name?: string; company_id?: string }>>([]);
  const usersLoadedRef = useRef(false);
  const [creating, setCreating] = useState(false);
  const [editingBill, setEditingBill] = useState<BillRow | null>(null);
  const [editRecipientName, setEditRecipientName] = useState('');
  const [editRecipientEmail, setEditRecipientEmail] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editLines, setEditLines] = useState<DraftLine[]>([newDraftLine()]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [cronRunningJob, setCronRunningJob] = useState<'preview' | 'dryRun' | 'live' | null>(null);
  const [cronResult, setCronResult] = useState<BillingCronRunResult | null>(null);
  const [cronResultView, setCronResultView] = useState<'preview' | 'dryRun' | 'live' | null>(null);
  const [pendingBillAction, setPendingBillAction] = useState<string | null>(null);
  const [unifiedHistory, setUnifiedHistory] = useState<UnifiedHistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | UnifiedHistoryRow['type']>('all');

  const billActionKey = (billId: string, path: string) => `${billId}:${path}`;
  const isBillActionPending = (billId: string, path: string) => pendingBillAction === billActionKey(billId, path);

  const runBillingCron = async (dryRun: boolean, cronView: 'preview' | 'dryRun' | 'live') => {
    if (!dryRun && cronView === 'live') {
      const ok = confirm(
        'Run billing for today? This runs the same job as the daily cron: charges, invoice emails, and overdue warnings. This cannot be undone.'
      );
      if (!ok) return;
    }
    setCronRunningJob(cronView);
    const toastId = toast.loading(
      cronView === 'preview' ? 'Building preview…' : cronView === 'dryRun' ? 'Running dry run…' : 'Running billing…'
    );
    try {
      const res = await fetch('/api/admin/billing/run-today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Billing run failed');
      setCronResult(data);
      setCronResultView(cronView);
      if (!dryRun) {
        toast.success(
          `Billing complete: ${data.billing?.processed ?? 0} subs, ${data.billing?.processedPaymentRequests ?? 0} payment requests, ${data.billing?.processedBills ?? 0} bills`,
          { id: toastId }
        );
        await loadBills();
        if (view === 'history') await loadUnifiedHistory();
      } else {
        toast.success(cronView === 'preview' ? 'Preview ready' : 'Dry run complete — nothing was charged', {
          id: toastId,
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Billing run failed', { id: toastId });
    } finally {
      setCronRunningJob(null);
    }
  };

  const projectTitleById = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p.title]));
  }, [projects]);

  const loadBills = useCallback(async (companyId?: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ includeCharges: '1' });
      const filterId = companyId ?? selectedCompanyId;
      if (filterId) qs.set('companyId', filterId);
      const res = await fetch(`/api/admin/bills?${qs.toString()}`);
      if (!res.ok) throw new Error('Failed to load bills');
      const data = await res.json();
      setBills(data.bills || []);
      if (data.chargesByBillId && typeof data.chargesByBillId === 'object') {
        setChargesByBill(data.chargesByBillId);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  const loadLegacyBilling = useCallback(async (companyId: string) => {
    setLoadingLegacy(true);
    try {
      const res = await fetch(
        `/api/admin/billing/subscriptions-batch?companyIds=${encodeURIComponent(companyId)}`
      );
      if (!res.ok) throw new Error('Failed to load subscriptions');
      const data = await res.json();
      const row = data.byCompany?.[companyId];
      const fees: ProjectFee[] = [];
      const subs: ProjectSubscription[] = [];
      if (row) {
        Object.values(row.feesByProject || {}).forEach((list) => {
          fees.push(...(list as ProjectFee[]));
        });
        Object.values(row.subscriptionsByProject || {}).forEach((list) => {
          subs.push(...(list as ProjectSubscription[]));
        });
      }
      setLegacyFees(fees);
      setLegacySubscriptions(subs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load subscriptions');
      setLegacyFees([]);
      setLegacySubscriptions([]);
    } finally {
      setLoadingLegacy(false);
    }
  }, []);

  const ensureUsersLoaded = useCallback(async () => {
    if (!isSuperAdmin || usersLoadedRef.current) return;
    usersLoadedRef.current = true;
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users || []);
      }
    } catch {
      usersLoadedRef.current = false;
    }
  }, [isSuperAdmin]);

  const loadCharges = useCallback(async (billId: string) => {
    const res = await fetch(`/api/admin/bills/${billId}/charges`);
    if (res.ok) {
      const data = await res.json();
      const charges = (data.charges || []).map((c: BillChargeRow) => ({
        id: c.id,
        billId: c.billId ?? billId,
        invoiceNumber: c.invoiceNumber ?? null,
        amount: Number(c.amount),
        status: c.status,
        paidAt: c.paidAt ?? null,
        createdAt: c.createdAt,
        lineItemsSnapshot: c.lineItemsSnapshot ?? [],
      }));
      setChargesByBill((prev) => ({ ...prev, [billId]: charges }));
    }
  }, []);

  const loadUnifiedHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/admin/billing/history?limit=500');
      if (!res.ok) throw new Error('Failed to load billing history');
      const data = await res.json();
      setUnifiedHistory(Array.isArray(data.transactions) ? data.transactions : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load billing history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadBills();
  }, [loadBills]);

  useEffect(() => {
    if (view === 'subscriptions' && selectedCompanyId) {
      void loadLegacyBilling(selectedCompanyId);
    } else if (view === 'subscriptions') {
      setLegacyFees([]);
      setLegacySubscriptions([]);
    }
  }, [view, selectedCompanyId, loadLegacyBilling]);

  useEffect(() => {
    if (view === 'history') {
      void loadUnifiedHistory();
    }
  }, [view, loadUnifiedHistory]);

  const lineTotal = useMemo(() => {
    const items = draftToLineItems(lines);
    return items.length ? totalFromLineItems(items) : 0;
  }, [lines]);

  const filteredBills = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (view === 'action') {
      return bills.filter(
        (b) =>
          b.status === 'active' &&
          ((b.scheduleType === 'recurring' && b.nextBillingDate && b.nextBillingDate <= today) ||
            (b.collectionMode === 'invoice_link' && !b.stripePaymentMethodId))
      );
    }
    return bills.filter((b) => b.status !== 'cancelled');
  }, [bills, view]);

  const activeBillCount = useMemo(() => bills.filter((b) => b.status !== 'cancelled').length, [bills]);
  const historyEntryCount = unifiedHistory.length;

  const filteredHistory = useMemo(() => {
    let rows = unifiedHistory;
    if (selectedCompanyId) {
      const companyName = companies.find((c) => c.id === selectedCompanyId)?.name;
      if (companyName) {
        rows = rows.filter((row) => row.companyName === companyName);
      }
    }
    if (historyTypeFilter === 'all') return rows;
    return rows.filter((row) => row.type === historyTypeFilter);
  }, [unifiedHistory, historyTypeFilter, selectedCompanyId, companies]);

  const historyTypeLabel = (type: UnifiedHistoryRow['type']) => {
    switch (type) {
      case 'bill':
        return 'Bill';
      case 'payment':
        return 'Payment';
      case 'fee':
        return 'Project fee';
      case 'subscription':
        return 'Subscription';
    }
  };

  const historyDescription = (row: UnifiedHistoryRow) => {
    if (row.type === 'bill') {
      const label = row.billDescription?.trim() || 'Bill';
      return row.billRecipientName ? `${label} · ${row.billRecipientName}` : label;
    }
    if (row.type === 'payment') {
      const name = row.paymentRecipientName || row.billRecipientName || 'Payment';
      const email = row.paymentRecipientEmail;
      return email ? `${name} · ${email}` : name;
    }
    if (row.type === 'fee') {
      return [row.feeName, row.projectTitle].filter(Boolean).join(' · ') || 'Fee';
    }
    return [row.subscriptionName, row.projectTitle].filter(Boolean).join(' · ') || 'Subscription';
  };

  const historyReceiptUrl = (row: UnifiedHistoryRow): string | null => {
    if (row.type === 'bill' && row.billId && row.chargeId) {
      return `/api/admin/bills/${row.billId}/receipt?chargeId=${encodeURIComponent(row.chargeId)}&format=pdf`;
    }
    if (!row.paymentRequestId) return null;
    const base = `/api/admin/payments/${row.paymentRequestId}/receipt?format=pdf`;
    if (row.stripePaymentIntentId) {
      return `${base}&paymentIntentId=${encodeURIComponent(row.stripePaymentIntentId)}`;
    }
    return base;
  };

  const resetCreateForm = () => {
    setRecipientMode('manual');
    setSelectedUserId('');
    setRecipientName('');
    setRecipientEmail('');
    setCompanyId('');
    setScheduleType('one_time');
    setCollectionMode('invoice_link');
    setRecurrenceInterval('monthly');
    setRecurrenceDayOfMonth(String(new Date().getDate()));
    setRecurrenceDayOfWeek(String(new Date().getDay()));
    setDueDate(new Date().toISOString().split('T')[0]);
    setAttachCompanyPm(true);
    setSendInvoiceEmail(true);
    setSaveAsDraft(false);
    setDescription('');
    setLines([newDraftLine()]);
  };

  const handleLineDescriptionPaste = (
    e: ClipboardEvent<HTMLInputElement>,
    setLineRows: Dispatch<SetStateAction<DraftLine[]>>
  ) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text || !text.includes(';;')) return;
    const parsed = parseDoubleSemicolonInvoiceLines(text);
    if (!parsed.ok) {
      e.preventDefault();
      toast.error(parsed.error);
      return;
    }
    e.preventDefault();
    setLineRows(parsed.lines);
    toast.success(`Loaded ${parsed.lines.length} line item(s) from paste.`);
  };

  const onUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const u = users.find((x) => x.id === userId);
    if (u) {
      setRecipientEmail(u.email);
      setRecipientName(`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email);
      if (u.company_id) setCompanyId(u.company_id);
    }
  };

  const openEditBill = async (bill: BillRow) => {
    try {
      const res = await fetch(`/api/admin/bills/${bill.id}`);
      if (!res.ok) throw new Error('Failed to load bill');
      const data = await res.json();
      const full = data.bill as BillRow & { lineItems: InvoiceLineItem[] };
      setEditingBill(full);
      setEditRecipientName(full.recipientName);
      setEditRecipientEmail(full.recipientEmail);
      setEditDescription(full.description || '');
      setEditDueDate(full.nextBillingDate || new Date().toISOString().split('T')[0]);
      const items = full.lineItems?.length
        ? full.lineItems.map((row) => ({
            id: crypto.randomUUID(),
            description: row.description,
            quantity: String(row.quantity),
            unitPrice: String(row.unit_amount),
          }))
        : [newDraftLine()];
      setEditLines(items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load bill');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBill) return;
    if (!editRecipientEmail.trim() || !editRecipientName.trim()) {
      toast.error('Recipient name and email are required');
      return;
    }
    const lineItems = draftToLineItems(editLines);
    const total = lineItems.length ? totalFromLineItems(lineItems) : 0;
    if (!lineItems.length || total <= 0) {
      toast.error('Add at least one valid line item');
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/bills/${editingBill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: editRecipientEmail.trim(),
          recipientName: editRecipientName.trim(),
          description: editDescription || null,
          nextBillingDate: editDueDate || null,
          lineItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      toast.success('Bill updated');
      setEditingBill(null);
      await loadBills();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreate = async () => {
    if (!recipientEmail.trim() || !recipientName.trim()) {
      toast.error('Recipient name and email are required');
      return;
    }
    const lineItems = draftToLineItems(lines);
    if (!lineItems.length || lineTotal <= 0) {
      toast.error('Add at least one valid line item');
      return;
    }
    if (attachCompanyPm && !selectedUserId && !companyId) {
      toast.error('Select a company when attaching company payment method');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim(),
          userId: recipientMode === 'user' ? selectedUserId || undefined : undefined,
          companyId: companyId || undefined,
          scheduleType,
          collectionMode,
          attachCompanyPaymentMethod: attachCompanyPm,
          lineItems,
          recurrenceInterval,
          recurrenceDayOfMonth:
            scheduleType === 'recurring' && recurrenceInterval === 'monthly'
              ? Number(recurrenceDayOfMonth)
              : undefined,
          recurrenceDayOfWeek:
            scheduleType === 'recurring' && recurrenceInterval === 'weekly'
              ? Number(recurrenceDayOfWeek)
              : undefined,
          dueDate,
          sendInvoiceEmail,
          saveAsDraft,
          description: description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create bill');
      if (saveAsDraft) {
        toast.success('Draft bill created');
      } else if (data.activation?.charged) {
        toast.success(
          'Bill created and charged in Stripe. Status should show completed.'
        );
      } else if (data.activation?.emailed) {
        toast.success('Bill created — notification email sent.');
      } else {
        toast.success('Bill created');
      }
      setShowCreate(false);
      resetCreateForm();
      await loadBills();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const billAction = async (billId: string, path: string, successMsg: string) => {
    const key = billActionKey(billId, path);
    setPendingBillAction(key);
    try {
      const res = await fetch(`/api/admin/bills/${billId}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Action failed');

      if (path === 'charge-now') {
        if (data.charged) {
          toast.success(
            data.processing
              ? 'Charge submitted in Stripe (processing). Bill will show as completed.'
              : 'Bill charged successfully in Stripe.'
          );
        } else if (data.emailed) {
          toast.success('Invoice email sent (no charge).');
        } else {
          throw new Error(data.error || 'No charge was made');
        }
      } else {
        toast.success(successMsg);
      }
      await loadBills();
    } finally {
      setPendingBillAction((current) => (current === key ? null : current));
    }
  };

  const copyLink = (token: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${base}/payments?token=${encodeURIComponent(token)}`);
    toast.success('Payment link copied');
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500/15 text-green-700',
      draft: 'bg-black/[0.04] text-[#111]/55',
      paused: 'bg-amber-500/15 text-amber-800',
      completed: 'bg-blue-500/15 text-blue-700',
      cancelled: 'bg-red-500/15 text-red-700',
      pending: 'bg-amber-500/15 text-amber-800',
      stopped: 'bg-red-500/15 text-red-700',
    };
    return <Badge className={variants[status] || ''}>{status}</Badge>;
  };

  const handleMarkSubscriptionPaid = async (sub: ProjectSubscription) => {
    if (
      !confirm(
        `Mark "${sub.name}" ($${sub.amount.toFixed(2)}) as paid? This records payment outside Stripe and advances the next billing date.`
      )
    ) {
      return;
    }
    setMarkingPaidId(`sub-${sub.id}`);
    try {
      const res = await fetch(
        `/api/projects/${sub.projectId}/subscriptions/${sub.id}/mark-completed`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as paid');
      toast.success(data.message || 'Subscription marked as paid');
      if (selectedCompanyId) await loadLegacyBilling(selectedCompanyId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark as paid');
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleMarkFeePaid = async (fee: ProjectFee) => {
    if (
      !confirm(
        `Mark "${fee.name}" ($${fee.amount.toFixed(2)}) as paid? This records payment outside Stripe.`
      )
    ) {
      return;
    }
    setMarkingPaidId(`fee-${fee.id}`);
    try {
      const res = await fetch(`/api/projects/${fee.projectId}/fees/${fee.id}/mark-completed`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as paid');
      toast.success(data.message || 'Fee marked as paid');
      if (selectedCompanyId) await loadLegacyBilling(selectedCompanyId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark as paid');
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleMarkBillPaid = async (bill: BillRow) => {
    if (
      !confirm(
        `Mark bill for ${bill.recipientName} ($${bill.amount.toFixed(2)}) as paid? This records payment outside Stripe.`
      )
    ) {
      return;
    }
    setMarkingPaidId(`bill-${bill.id}`);
    try {
      const res = await fetch(`/api/admin/bills/${bill.id}/mark-paid`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as paid');
      toast.success(data.message || 'Bill marked as paid');
      await loadBills();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark as paid');
    } finally {
      setMarkingPaidId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Billing</h2>
          <p className="text-sm text-[#111]/55">
            Unified bills for any recipient — no account required to pay via invoice link.
          </p>
          {isSuperAdmin && (
            <p className="text-xs text-[#111]/55 mt-1">
              Daily cron: <strong>14:00 UTC</strong> (9:00 AM US Eastern standard time) —{' '}
              <code className="text-[11px]">GET /api/cron/billing</code>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={cronRunningJob !== null}
                onClick={() => runBillingCron(true, 'preview')}
              >
                <BtnIcon loading={cronRunningJob === 'preview'}>
                  <Eye className="w-4 h-4 mr-2" />
                </BtnIcon>
                {cronRunningJob === 'preview' ? 'Loading…' : 'Preview today'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={cronRunningJob !== null}
                onClick={() => runBillingCron(true, 'dryRun')}
              >
                <BtnIcon loading={cronRunningJob === 'dryRun'}>
                  <FlaskConical className="w-4 h-4 mr-2" />
                </BtnIcon>
                {cronRunningJob === 'dryRun' ? 'Loading…' : 'Dry run'}
              </Button>
              <Button
                size="sm"
                disabled={cronRunningJob !== null}
                onClick={() => runBillingCron(false, 'live')}
              >
                <BtnIcon loading={cronRunningJob === 'live'}>
                  <ZapIcon className="w-4 h-4 mr-2" />
                </BtnIcon>
                {cronRunningJob === 'live' ? 'Running…' : 'Bill today'}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => loadBills()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isSuperAdmin && (
            <Button
              size="sm"
              onClick={() => {
                setShowCreate(true);
                void ensureUsersLoaded();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New bill
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-[#111]/55">Company</Label>
          <Select
            value={selectedCompanyId || '__all__'}
            onValueChange={(v) => setSelectedCompanyId(v === '__all__' ? '' : v)}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="All companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All companies</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {view === 'subscriptions' && !selectedCompanyId ? (
          <p className="text-sm text-[#111]/55 pb-2">Select a company to view project subscriptions and fees.</p>
        ) : null}
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList>
          <TabsTrigger value="all">All bills ({activeBillCount})</TabsTrigger>
          <TabsTrigger value="action">Due &amp; action</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="history">
            History ({historyEntryCount > 0 ? historyEntryCount : '…'})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={view} className="mt-4">
          {view === 'subscriptions' ? (
            !selectedCompanyId ? (
              <Card>
                <CardContent className="py-10 text-center text-[#111]/55">
                  Choose a company above to view legacy project fees and subscriptions.
                </CardContent>
              </Card>
            ) : loadingLegacy ? (
              <div className="flex items-center justify-center py-12 text-[#111]/55">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading subscriptions…
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Project subscriptions</h3>
                  {legacySubscriptions.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center text-sm text-[#111]/55">
                        No subscriptions for this company.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {legacySubscriptions.map((sub) => {
                        const isDue =
                          sub.status === 'active' &&
                          sub.nextBillingDate &&
                          new Date(sub.nextBillingDate) <= new Date();
                        return (
                          <Card key={sub.id}>
                            <CardContent className="py-4 flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">{sub.name}</span>
                                  {statusBadge(sub.status)}
                                  {isDue ? <Badge variant="destructive">Due</Badge> : null}
                                </div>
                                <p className="text-sm text-[#111]/55 mt-1">
                                  ${sub.amount.toFixed(2)}/{sub.billingInterval || 'month'}
                                  {projectTitleById.get(sub.projectId)
                                    ? ` · ${projectTitleById.get(sub.projectId)}`
                                    : ''}
                                </p>
                                {sub.nextBillingDate ? (
                                  <p className="text-xs text-[#111]/55 mt-1">
                                    Next billing: {new Date(sub.nextBillingDate).toLocaleDateString()}
                                  </p>
                                ) : null}
                                {sub.lastBilledDate ? (
                                  <p className="text-xs text-[#111]/55">
                                    Last billed: {new Date(sub.lastBilledDate).toLocaleDateString()}
                                  </p>
                                ) : null}
                              </div>
                              {sub.status === 'active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={markingPaidId === `sub-${sub.id}`}
                                  onClick={() => handleMarkSubscriptionPaid(sub)}
                                >
                                  {markingPaidId === `sub-${sub.id}` ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                  )}
                                  Mark as paid
                                </Button>
                              ) : null}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">One-time project fees</h3>
                  {legacyFees.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center text-sm text-[#111]/55">
                        No one-time fees for this company.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {legacyFees.map((fee) => (
                        <Card key={fee.id}>
                          <CardContent className="py-4 flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{fee.name}</span>
                                {statusBadge(fee.status)}
                              </div>
                              <p className="text-sm text-[#111]/55 mt-1">
                                ${fee.amount.toFixed(2)}
                                {projectTitleById.get(fee.projectId)
                                  ? ` · ${projectTitleById.get(fee.projectId)}`
                                  : ''}
                              </p>
                            </div>
                            {fee.status === 'pending' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={markingPaidId === `fee-${fee.id}`}
                                onClick={() => handleMarkFeePaid(fee)}
                              >
                                {markingPaidId === `fee-${fee.id}` ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                )}
                                Mark as paid
                              </Button>
                            ) : null}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          ) : view === 'history' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#111]/55 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  All completed charges: bills, payment requests, project fees, and subscriptions.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={historyTypeFilter}
                    onValueChange={(v) => setHistoryTypeFilter(v as typeof historyTypeFilter)}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="bill">Bills</SelectItem>
                      <SelectItem value="payment">Payments</SelectItem>
                      <SelectItem value="fee">Project fees</SelectItem>
                      <SelectItem value="subscription">Subscriptions</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadUnifiedHistory()}
                    disabled={loadingHistory}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingHistory ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12 text-[#111]/55">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading history…
                </div>
              ) : filteredHistory.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-[#111]/55">
                    No billing history yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-black/[0.08]/60">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-black/[0.08]/60 bg-black/[0.04]/40">
                        <th className="text-left font-semibold px-4 py-3">Date</th>
                        <th className="text-left font-semibold px-4 py-3">Type</th>
                        <th className="text-left font-semibold px-4 py-3">Description</th>
                        <th className="text-left font-semibold px-4 py-3">Company</th>
                        <th className="text-right font-semibold px-4 py-3">Amount</th>
                        <th className="text-center font-semibold px-4 py-3">Invoice #</th>
                        <th className="text-center font-semibold px-4 py-3">Line items</th>
                        <th className="text-center font-semibold px-4 py-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((row) => {
                        const receiptUrl = historyReceiptUrl(row);
                        const rowKey = `${row.type}-${row.id}`;
                        const canShowLineItems = row.type === 'payment' || row.type === 'bill';
                        const isExpanded = expandedHistoryRowId === rowKey;
                        return (
                          <Fragment key={rowKey}>
                          <tr className="border-b border-black/[0.08]/40 hover:bg-black/[0.04]/20">
                            <td className="px-4 py-3 whitespace-nowrap text-[#111]/55">
                              {new Date(row.transactionDate).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{historyTypeLabel(row.type)}</Badge>
                              {row.type === 'payment' && row.paymentType ? (
                                <span className="block text-xs text-[#111]/55 mt-1">
                                  {row.paymentType === 'one_time'
                                    ? 'One-time'
                                    : row.paymentType === 'monthly'
                                      ? 'Monthly'
                                      : 'Interval'}
                                </span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">{historyDescription(row)}</td>
                            <td className="px-4 py-3 text-[#111]/55">{row.companyName || '—'}</td>
                            <td className="px-4 py-3 text-right font-medium">${row.amount.toFixed(2)}</td>
                            <td className="px-4 py-3 text-center text-[#111]/55">
                              {row.invoiceNumber ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {canShowLineItems ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() =>
                                    setExpandedHistoryRowId((prev) => (prev === rowKey ? null : rowKey))
                                  }
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  {isExpanded ? 'Hide' : 'View'}
                                </Button>
                              ) : (
                                <span className="text-[#111]/55">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {receiptUrl ? (
                                <a
                                  href={receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 hover:underline"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </a>
                              ) : (
                                <span className="text-[#111]/55">—</span>
                              )}
                            </td>
                          </tr>
                          {canShowLineItems && isExpanded && (
                            <tr key={`${rowKey}-lines`} className="border-b border-black/[0.08]/40 bg-black/[0.04]/10">
                              <td colSpan={8} className="px-4 py-3">
                                <HistoryRowLineItems
                                  row={{
                                    type: row.type,
                                    paymentRequestId: row.paymentRequestId,
                                    billId: row.billId,
                                    chargeId: row.chargeId,
                                  }}
                                  active={isExpanded}
                                />
                              </td>
                            </tr>
                          )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : loading ? (
            <p className="text-sm text-[#111]/55">Loading…</p>
          ) : filteredBills.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-[#111]/55">No bills in this view.</CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredBills.map((bill) => (
                <Card key={bill.id}>
                  <CardHeader className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base font-medium">
                          {bill.recipientName}{' '}
                          <span className="text-[#111]/55 font-normal">({bill.recipientEmail})</span>
                        </CardTitle>
                        <p className="text-sm text-[#111]/55 mt-1">
                          ${bill.amount.toFixed(2)} · {bill.scheduleType === 'recurring' ? 'Repeating' : 'One-time'} ·{' '}
                          {bill.collectionMode === 'auto_charge' ? 'Auto-charge' : 'Invoice link'}
                          {bill.nextBillingDate ? ` · Due ${bill.nextBillingDate}` : ''}
                          {bill.companies?.name ? ` · ${bill.companies.name}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {statusBadge(bill.status)}
                        {bill.stripePaymentMethodId ? (
                          <Badge variant="outline">PM attached</Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {bill.collectionMode === 'invoice_link' && (
                        <Button variant="outline" size="sm" onClick={() => copyLink(bill.publicToken)}>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy link
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next = expandedBill === bill.id ? null : bill.id;
                          setExpandedBill(next);
                          setExpandedChargeId(null);
                          if (next && !(chargesByBill[bill.id]?.length)) loadCharges(bill.id);
                        }}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Charges
                      </Button>
                      {bill.collectionMode === 'invoice_link' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!pendingBillAction}
                          onClick={() => billAction(bill.id, 'send-invoice', 'Invoice sent').catch((e) => toast.error(e.message))}
                        >
                          <BtnIconSm loading={isBillActionPending(bill.id, 'send-invoice')}>
                            <Mail className="w-3.5 h-3.5 mr-1" />
                          </BtnIconSm>
                          {isBillActionPending(bill.id, 'send-invoice') ? 'Sending…' : 'Send invoice'}
                        </Button>
                      )}
                      {bill.collectionMode === 'auto_charge' && !bill.stripePaymentMethodId && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!pendingBillAction}
                          onClick={() =>
                            billAction(bill.id, 'send-invoice', 'Instructions sent').catch((e) => toast.error(e.message))
                          }
                        >
                          <BtnIconSm loading={isBillActionPending(bill.id, 'send-invoice')}>
                            <Mail className="w-3.5 h-3.5 mr-1" />
                          </BtnIconSm>
                          {isBillActionPending(bill.id, 'send-invoice') ? 'Sending…' : 'Email add payment method'}
                        </Button>
                      )}
                      {bill.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!pendingBillAction}
                          onClick={() => billAction(bill.id, 'charge-now', 'Bill charged').catch((e) => toast.error(e.message))}
                        >
                          <BtnIconSm loading={isBillActionPending(bill.id, 'charge-now')}>
                            <Zap className="w-3.5 h-3.5 mr-1" />
                          </BtnIconSm>
                          {isBillActionPending(bill.id, 'charge-now') ? 'Running…' : 'Charge now'}
                        </Button>
                      )}
                      {isSuperAdmin && bill.status !== 'completed' && bill.status !== 'cancelled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={markingPaidId === `bill-${bill.id}`}
                          onClick={() => handleMarkBillPaid(bill)}
                        >
                          {markingPaidId === `bill-${bill.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          )}
                          Mark as paid
                        </Button>
                      )}
                      {bill.status === 'draft' && (
                        <Button
                          size="sm"
                          disabled={!!pendingBillAction}
                          onClick={() => billAction(bill.id, 'activate', 'Bill activated').catch((e) => toast.error(e.message))}
                        >
                          {isBillActionPending(bill.id, 'activate') && (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          )}
                          {isBillActionPending(bill.id, 'activate') ? 'Activating…' : 'Activate'}
                        </Button>
                      )}
                      {bill.status === 'active' && bill.scheduleType === 'recurring' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!pendingBillAction}
                          onClick={() => billAction(bill.id, 'pause', 'Bill paused').catch((e) => toast.error(e.message))}
                        >
                          <BtnIconSm loading={isBillActionPending(bill.id, 'pause')}>
                            <Pause className="w-3.5 h-3.5 mr-1" />
                          </BtnIconSm>
                          {isBillActionPending(bill.id, 'pause') ? 'Pausing…' : 'Pause'}
                        </Button>
                      )}
                      {bill.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!pendingBillAction}
                          onClick={() => billAction(bill.id, 'resume', 'Bill resumed').catch((e) => toast.error(e.message))}
                        >
                          <BtnIconSm loading={isBillActionPending(bill.id, 'resume')}>
                            <Play className="w-3.5 h-3.5 mr-1" />
                          </BtnIconSm>
                          {isBillActionPending(bill.id, 'resume') ? 'Resuming…' : 'Resume'}
                        </Button>
                      )}
                      {isSuperAdmin && bill.status !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!!pendingBillAction}
                          onClick={async () => {
                            if (!confirm('Cancel this bill?')) return;
                            const key = billActionKey(bill.id, 'cancel');
                            setPendingBillAction(key);
                            try {
                              const r = await fetch(`/api/admin/bills/${bill.id}`, { method: 'DELETE' });
                              if (!r.ok) throw new Error('Cancel failed');
                              toast.success('Bill cancelled');
                              await loadBills();
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : 'Cancel failed');
                            } finally {
                              setPendingBillAction((c) => (c === key ? null : c));
                            }
                          }}
                        >
                          <BtnIconSm loading={isBillActionPending(bill.id, 'cancel')}>
                            <Ban className="w-3.5 h-3.5 mr-1" />
                          </BtnIconSm>
                          {isBillActionPending(bill.id, 'cancel') ? 'Cancelling…' : 'Cancel'}
                        </Button>
                      )}
                      {isSuperAdmin && bill.status !== 'cancelled' && bill.status !== 'completed' && (
                        <Button variant="outline" size="sm" onClick={() => openEditBill(bill)}>
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                      )}
                      {isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!!pendingBillAction}
                          onClick={async () => {
                            const key = billActionKey(bill.id, 'duplicate');
                            setPendingBillAction(key);
                            try {
                              const r = await fetch(`/api/admin/bills/${bill.id}/duplicate`, { method: 'POST' });
                              if (!r.ok) throw new Error('Duplicate failed');
                              toast.success('Duplicated as draft');
                              await loadBills();
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : 'Duplicate failed');
                            } finally {
                              setPendingBillAction((c) => (c === key ? null : c));
                            }
                          }}
                        >
                          {isBillActionPending(bill.id, 'duplicate') ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              Duplicating…
                            </>
                          ) : (
                            'Duplicate'
                          )}
                        </Button>
                      )}
                    </div>
                    {expandedBill === bill.id && (
                      <div className="mt-4 border-t pt-4 space-y-2">
                        {(chargesByBill[bill.id] || []).length === 0 ? (
                          <p className="text-sm text-[#111]/55">No charges yet.</p>
                        ) : (
                          (chargesByBill[bill.id] || []).map((c) => (
                            <div key={c.id} className="border-b border-black/[0.08]/50 last:border-0 py-2">
                              <div className="flex justify-between items-center text-sm">
                                <button
                                  type="button"
                                  className="text-left hover:underline"
                                  onClick={() =>
                                    setExpandedChargeId((prev) => (prev === c.id ? null : c.id))
                                  }
                                >
                                  #{c.invoiceNumber ?? '—'} · {c.status} ·{' '}
                                  {new Date(c.createdAt).toLocaleDateString()}
                                  {(c.lineItemsSnapshot?.length ?? 0) > 0 && (
                                    <span className="ml-2 text-xs text-[#111]/55">
                                      ({c.lineItemsSnapshot!.length} line item
                                      {c.lineItemsSnapshot!.length === 1 ? '' : 's'})
                                    </span>
                                  )}
                                </button>
                                <span className="font-medium">${c.amount.toFixed(2)}</span>
                              </div>
                              {expandedChargeId === c.id && c.lineItemsSnapshot && c.lineItemsSnapshot.length > 0 && (
                                <InvoiceLineItemsTable items={c.lineItemsSnapshot} className="mt-2" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (open) void ensureUsersLoaded();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create bill</DialogTitle>
            <DialogDescription>
              Bill any recipient by email. They can pay without an account using the invoice link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={recipientMode === 'manual'}
                  onChange={() => setRecipientMode('manual')}
                />
                Manual email
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={recipientMode === 'user'}
                  onChange={() => setRecipientMode('user')}
                />
                Link user
              </label>
            </div>
            {recipientMode === 'user' ? (
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={selectedUserId} onValueChange={onUserSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company (optional)</Label>
              <Select value={companyId || '_none'} onValueChange={(v) => setCompanyId(v === '_none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as typeof scheduleType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time</SelectItem>
                    <SelectItem value="recurring">Repeating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Collection</Label>
                <Select value={collectionMode} onValueChange={(v) => setCollectionMode(v as typeof collectionMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice_link">Invoice link (user pays)</SelectItem>
                    <SelectItem value="auto_charge">Auto-charge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{scheduleType === 'recurring' ? 'First due date' : 'Due date'}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            {scheduleType === 'recurring' && (
              <>
                <div className="space-y-2">
                  <Label>Repeat every</Label>
                  <Select
                    value={recurrenceInterval}
                    onValueChange={(v) => setRecurrenceInterval(v as typeof recurrenceInterval)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Day</SelectItem>
                      <SelectItem value="weekly">Week</SelectItem>
                      <SelectItem value="monthly">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {recurrenceInterval === 'weekly' ? (
                  <div className="space-y-2">
                    <Label>Due day of week</Label>
                    <Select value={recurrenceDayOfWeek} onValueChange={setRecurrenceDayOfWeek}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                          (label, i) => (
                            <SelectItem key={label} value={String(i)}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ) : recurrenceInterval === 'monthly' ? (
                  <div className="space-y-2">
                    <Label>Due day of month</Label>
                    <Select value={recurrenceDayOfMonth} onValueChange={setRecurrenceDayOfMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </>
            )}
            <div className="space-y-2">
              <Label>Description (on invoice)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Line items</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setLines((l) => [...l, newDraftLine()])}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {lines.map((row) => (
                <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-5"
                    placeholder="Description (paste desc;; qty;; $;; …)"
                    value={row.description}
                    onPaste={(e) => handleLineDescriptionPaste(e, setLines)}
                    onChange={(e) =>
                      setLines((ls) => ls.map((l) => (l.id === row.id ? { ...l, description: e.target.value } : l)))
                    }
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    min="0.01"
                    step="any"
                    value={row.quantity}
                    onChange={(e) =>
                      setLines((ls) => ls.map((l) => (l.id === row.id ? { ...l, quantity: e.target.value } : l)))
                    }
                  />
                  <Input
                    className="col-span-3"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit $"
                    value={row.unitPrice}
                    onChange={(e) =>
                      setLines((ls) => ls.map((l) => (l.id === row.id ? { ...l, unitPrice: e.target.value } : l)))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-2"
                    disabled={lines.length <= 1}
                    onClick={() => setLines((ls) => ls.filter((l) => l.id !== row.id))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <p className="text-sm font-medium text-right">Total: ${lineTotal.toFixed(2)}</p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={attachCompanyPm} onCheckedChange={(c) => setAttachCompanyPm(c === true)} />
                Attach company payment method if available
              </label>
              {!saveAsDraft && (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={sendInvoiceEmail} onCheckedChange={(c) => setSendInvoiceEmail(c === true)} />
                  {collectionMode === 'auto_charge'
                    ? 'Email recipient to add a payment method in their account'
                    : 'Send invoice email now'}
                </label>
              )}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={saveAsDraft} onCheckedChange={(c) => setSaveAsDraft(c === true)} />
                Save as draft
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {creating ? 'Creating…' : 'Create bill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingBill} onOpenChange={(open) => !open && setEditingBill(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit bill</DialogTitle>
            <DialogDescription>
              Update recipient, due date, and line items. Changes apply to the open charge if one exists.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editRecipientName} onChange={(e) => setEditRecipientName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editRecipientEmail} onChange={(e) => setEditRecipientEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{editingBill?.scheduleType === 'recurring' ? 'Next due date' : 'Due date'}</Label>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description (on invoice)</Label>
              <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Line items</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditLines((l) => [...l, newDraftLine()])}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {editLines.map((row) => (
                <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-5"
                    placeholder="Description (paste desc;; qty;; $;; …)"
                    value={row.description}
                    onPaste={(e) => handleLineDescriptionPaste(e, setEditLines)}
                    onChange={(e) =>
                      setEditLines((ls) => ls.map((l) => (l.id === row.id ? { ...l, description: e.target.value } : l)))
                    }
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    min="0.01"
                    step="any"
                    value={row.quantity}
                    onChange={(e) =>
                      setEditLines((ls) => ls.map((l) => (l.id === row.id ? { ...l, quantity: e.target.value } : l)))
                    }
                  />
                  <Input
                    className="col-span-3"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit $"
                    value={row.unitPrice}
                    onChange={(e) =>
                      setEditLines((ls) => ls.map((l) => (l.id === row.id ? { ...l, unitPrice: e.target.value } : l)))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-2"
                    disabled={editLines.length <= 1}
                    onClick={() => setEditLines((ls) => ls.filter((l) => l.id !== row.id))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <p className="text-sm font-medium text-right">
                Total: $
                {(() => {
                  const items = draftToLineItems(editLines);
                  return items.length ? totalFromLineItems(items).toFixed(2) : '0.00';
                })()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBill(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {savingEdit ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!cronResult && !!cronResultView}
        onOpenChange={(open) => {
          if (!open) {
            setCronResult(null);
            setCronResultView(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {cronResultView === 'live'
                ? 'Billing run results'
                : cronResultView === 'preview'
                  ? 'Would bill today'
                  : 'Dry run (full detail)'}
            </DialogTitle>
            <DialogDescription>
              As of {cronResult?.asOfDate}. {cronResult?.message}
            </DialogDescription>
          </DialogHeader>
          {cronResult && (
            <div className="space-y-4 text-sm">
              {cronResultView === 'live' ? (
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-[#111]/55">Subscriptions charged</p>
                      <p className="text-2xl font-semibold">{cronResult.billing.processed}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-[#111]/55">Payment requests</p>
                      <p className="text-2xl font-semibold">{cronResult.billing.processedPaymentRequests}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-[#111]/55">Bills processed</p>
                      <p className="text-2xl font-semibold">{cronResult.billing.processedBills ?? 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-[#111]/55">Overdue warnings sent</p>
                      <p className="text-2xl font-semibold">{cronResult.warnings?.sent ?? 0}</p>
                    </CardContent>
                  </Card>
                  {(cronResult.billing.errors > 0 ||
                    cronResult.billing.paymentRequestErrors > 0 ||
                    (cronResult.billing.billErrors?.length ?? 0) > 0) && (
                    <div className="col-span-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                      Errors: {cronResult.billing.errors} subscription(s),{' '}
                      {cronResult.billing.paymentRequestErrors} payment request(s),{' '}
                      {cronResult.billing.billErrors?.length ?? 0} bill(s)
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-[#111]/55 text-xs">Subscriptions</p>
                        <p className="text-xl font-semibold">
                          {(cronResult.billing.subscriptionDebug || []).filter((s) =>
                            s.reason.includes('would_process')
                          ).length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-[#111]/55 text-xs">Payment requests</p>
                        <p className="text-xl font-semibold">
                          {(cronResult.billing.paymentRequestDebug || []).length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-[#111]/55 text-xs">Bills (new)</p>
                        <p className="text-xl font-semibold">{(cronResult.billing.billDebug || []).length}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {(cronResult.billing.billDebug?.length ?? 0) > 0 && (
                    <div>
                      <p className="font-medium mb-2">Due bills</p>
                      <ul className="space-y-1 border rounded-md p-3 max-h-40 overflow-y-auto">
                        {cronResult.billing.billDebug!.map((b) => (
                          <li key={b.id} className="flex justify-between gap-2">
                            <span>
                              {b.recipientName} ({b.recipientEmail}) — ${b.amount.toFixed(2)}
                            </span>
                            <span className="text-[#111]/55 shrink-0">{b.reason.replace(/_/g, ' ')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {cronResultView === 'dryRun' && (
                    <>
                      {(cronResult.billing.subscriptionDebug?.length ?? 0) > 0 && (
                        <div>
                          <p className="font-medium mb-2">All subscriptions (debug)</p>
                          <ul className="space-y-1 border rounded-md p-3 max-h-48 overflow-y-auto font-mono text-xs">
                            {cronResult.billing.subscriptionDebug!.map((s) => (
                              <li key={s.id}>
                                {s.name || s.id.slice(0, 8)} — {s.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(cronResult.billing.paymentRequestDebug?.length ?? 0) > 0 && (
                        <div>
                          <p className="font-medium mb-2">Payment requests to charge</p>
                          <ul className="space-y-1 border rounded-md p-3 max-h-48 overflow-y-auto font-mono text-xs">
                            {cronResult.billing.paymentRequestDebug!.map((p) => (
                              <li key={p.id}>
                                ${p.amount.toFixed(2)} {p.payment_type} — {p.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(cronResult.billing.dryRunDebug?.allPaymentRequestsBreakdown?.length ?? 0) > 0 && (
                        <div>
                          <p className="font-medium mb-2">All payment requests by company</p>
                          <ul className="space-y-1 border rounded-md p-3 max-h-56 overflow-y-auto font-mono text-xs">
                            {cronResult.billing.dryRunDebug!.allPaymentRequestsBreakdown!.map((row) => (
                              <li key={row.id}>
                                {row.company_name}: ${row.amount.toFixed(2)} — {row.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
