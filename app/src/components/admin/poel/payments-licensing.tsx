'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/components/ui/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DollarSign, Plus, Trash2, FileText, CheckCircle, XCircle, X, Clock, AlertCircle, CreditCard, ChevronDown, Download, Key, Smartphone, Pause, Play, PlayCircle, Copy, ClipboardCheck, Pencil, Loader2, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import type { Project } from '@/lib/projects';
import type { Company } from '@/types/company';
import type {
  ProjectFee,
  ProjectSubscription,
  ProjectFeeTransaction,
  ProjectSubscriptionTransaction,
} from '@/lib/project-payments';
import { paymentRailDisplayLabel } from '@/lib/payment-method-labels';
import { resolveExtensionRefSelectValue } from '@/lib/extension-github-ref-select';
import { SoftwareVersionSelect } from '@/components/admin/software-version-select';
import { resolveAppFeatures, type AppFeatures } from '@/lib/app-features';
import { AppFeaturesEditor } from '@/components/admin/app-features-editor';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return dateStr;
  }
}

interface PaymentsLicensingProps {
  companies: Company[];
  projects: Project[];
  isSuperAdmin: boolean;
  /** Support agent with authorizations grant: same multi-company authorizations UX as super admin (picker + one company at a time) without granting billing super-admin powers. */
  authorizationsElevated?: boolean;
  currentUser: any;
  /** billing = fees, subscriptions, payment status; authorizations = access, devices, GitHub extension, API keys */
  variant?: 'billing' | 'authorizations';
}

export default function PaymentsLicensing({
  companies,
  projects,
  isSuperAdmin,
  authorizationsElevated = false,
  currentUser,
  variant = 'billing',
}: PaymentsLicensingProps) {
  const authorizationsFullUi = isSuperAdmin || Boolean(authorizationsElevated);
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState<Record<string, ProjectFee[]>>({});
  const [subscriptions, setSubscriptions] = useState<Record<string, ProjectSubscription[]>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [subscriptionName, setSubscriptionName] = useState('');
  const [subscriptionAmount, setSubscriptionAmount] = useState('');
  const [subscriptionBillingInterval, setSubscriptionBillingInterval] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [subscriptionBillingDayOfMonth, setSubscriptionBillingDayOfMonth] = useState<number | ''>('');
  const [subscriptionBillingDayOfWeek, setSubscriptionBillingDayOfWeek] = useState<number | ''>('');
  const [authDevicesByProject, setAuthDevicesByProject] = useState<
    Record<
      string,
      Array<{
        id: string;
        name: string;
        deviceId: string;
        status: string;
        isAdminDevice?: boolean;
        features?: AppFeatures | null;
      }>
    >
  >({});
  const [projectApiKeyReveal, setProjectApiKeyReveal] = useState<Record<string, string>>({});
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceIsAdmin, setNewDeviceIsAdmin] = useState(false);
  const [newDeviceFeatures, setNewDeviceFeatures] = useState<AppFeatures>({});
  const [editPaymentsAuthFeatures, setEditPaymentsAuthFeatures] = useState<AppFeatures>({});
  const [addingDeviceProjectId, setAddingDeviceProjectId] = useState<string | null>(null);
  const [feeTransactions, setFeeTransactions] = useState<Record<string, ProjectFeeTransaction[]>>({});
  const [subscriptionTransactions, setSubscriptionTransactions] = useState<Record<string, ProjectSubscriptionTransaction[]>>({});
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<'fee' | 'subscription' | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    Record<string, { allUpToDate: boolean; pendingFees: number; overdueSubscriptions: number; overdueBills: number }>
  >({});
  const loadingRef = useRef(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [processingBilling, setProcessingBilling] = useState<string | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };
  const [receiptPaymentIntentId, setReceiptPaymentIntentId] = useState<string | undefined>(undefined);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [showEditPaymentDialog, setShowEditPaymentDialog] = useState(false);
  const [editingPaymentRequestId, setEditingPaymentRequestId] = useState<string | null>(null);
  const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', nextBillingDate: '', recipientName: '', recipientEmail: '' });
  const editPaymentFormInitialRef = useRef<typeof editPaymentForm | null>(null);
  const [savingEditPayment, setSavingEditPayment] = useState(false);
  const [loadingEditPayment, setLoadingEditPayment] = useState(false);
  const [loadingEditMessage, setLoadingEditMessage] = useState<'Setting up edit…' | 'Loading payment details…'>('Loading payment details…');
  const [creatingFee, setCreatingFee] = useState(false);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [deletingFeeId, setDeletingFeeId] = useState<string | null>(null);
  const [deletingSubscriptionId, setDeletingSubscriptionId] = useState<string | null>(null);
  const [stoppingSubscriptionId, setStoppingSubscriptionId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [loadingTransactionsId, setLoadingTransactionsId] = useState<string | null>(null);
  const [loadingTransactionsDialog, setLoadingTransactionsDialog] = useState(false);
  const [loadingApiKeyProjectId, setLoadingApiKeyProjectId] = useState<string | null>(null);
  const [loadingAuthDeviceId, setLoadingAuthDeviceId] = useState<string | null>(null);
  const [editingPaymentsAuthDeviceId, setEditingPaymentsAuthDeviceId] = useState<string | null>(null);
  const [editPaymentsAuthName, setEditPaymentsAuthName] = useState('');
  const [editPaymentsAuthExternalId, setEditPaymentsAuthExternalId] = useState('');
  const [editPaymentsAuthIsAdmin, setEditPaymentsAuthIsAdmin] = useState(false);
  /** Optimistic/local access override per project (after PATCH). */
  const [accessOverrideByProject, setAccessOverrideByProject] = useState<Record<string, 'allowed' | 'blocked' | null>>({});
  const [loadingAccessOverrideProjectId, setLoadingAccessOverrideProjectId] = useState<string | null>(null);

  const [deviceLimitInputByProject, setDeviceLimitInputByProject] = useState<Record<string, string>>({});
  const [savingDeviceLimitProjectId, setSavingDeviceLimitProjectId] = useState<string | null>(null);
  /** Local overrides after PATCH until parent refetches projects */
  const [deviceLimitOverrideByProject, setDeviceLimitOverrideByProject] = useState<Record<string, number | null>>({});

  /** Super admin: per-project GitHub repo for /api/extension/project/* */
  const [extensionSourceByProject, setExtensionSourceByProject] = useState<
    Record<string, { owner: string; repo: string; ref: string; deploymentVisibleFrom?: string | null } | null>
  >({});
  const [extensionUrlInputByProject, setExtensionUrlInputByProject] = useState<Record<string, string>>({});
  const [savingExtensionSourceProjectId, setSavingExtensionSourceProjectId] = useState<string | null>(null);
  const [deploymentVisibleFromInputByProject, setDeploymentVisibleFromInputByProject] = useState<
    Record<string, string>
  >({});
  const [savingDeploymentDateProjectId, setSavingDeploymentDateProjectId] = useState<string | null>(null);

  const [githubStatusByProject, setGithubStatusByProject] = useState<
    Record<
      string,
      {
        hasGithubUrl: boolean;
        latestPushDate: string | null;
        currentRef?: string | null;
        defaultBranch?: string | null;
        deploymentVisibleFrom?: string | null;
        commits?: Array<{ sha: string; message: string; date: string; beforeDeploymentCutoff?: boolean }>;
        hasMoreCommits?: boolean;
        commitRawOffset?: number;
      }
    >
  >({});
  const [refUpdating, setRefUpdating] = useState<Record<string, boolean>>({});
  const [selectedRefByProject, setSelectedRefByProject] = useState<Record<string, string>>({});

  const handleSaveRef = async (projectId: string) => {
    const gh = githubStatusByProject[projectId];
    const defaultBr = gh?.defaultBranch ?? 'main';
    const commits = gh?.commits ?? [];
    const newRef =
      selectedRefByProject[projectId] ??
      resolveExtensionRefSelectValue(gh?.currentRef ?? null, defaultBr, commits);
    if (!newRef) return;
    setRefUpdating((prev) => ({ ...prev, [projectId]: true }));
    try {
      const res = await fetch(`/api/projects/${projectId}/github-ref`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: newRef }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to update software version');
        return;
      }
      const { ref } = await res.json();
      setGithubStatusByProject((prev) => {
        const cur = prev[projectId];
        if (!cur) return prev;
        return { ...prev, [projectId]: { ...cur, currentRef: ref } };
      });
      toast.success('Software version updated');
    } catch {
      toast.error('Failed to update software version');
    } finally {
      setRefUpdating((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  // Super admin: run company billing (dry run then run)
  const [runBillingCompanyId, setRunBillingCompanyId] = useState<string>('');
  const [dryRunResult, setDryRunResult] = useState<{
    subscriptionDebug?: Array<{ id: string; company_id: string; name: string; next_billing_date: string | null; reason: string }>;
    paymentRequestDebug?: Array<{ id: string; amount: number; payment_type: string; next_billing_date: string | null; user_id: string | null; reason: string }>;
    dryRunDebug?: {
      companyIdsToAttach: string[];
      attachResults: Array<{ companyId: string; methodFound: boolean; updated: number }>;
      duePaymentRequestsCount: number;
      duePaymentRequestsAfterScopeCount: number;
      skippedNoMethod?: Array<{ id: string; payment_type: string; next_billing_date: string | null; user_id: string | null; reason: string }>;
      allPaymentRequestsBreakdown?: Array<{
        company_name: string;
        id: string;
        payment_type: string;
        status: string;
        amount: number;
        next_billing_date: string | null;
        user_id: string | null;
        hasMethod: boolean;
        isDueByDate: boolean;
        reason: string;
      }>;
    };
  } | null>(null);
  const [runningDryRun, setRunningDryRun] = useState(false);
  const [runningBilling, setRunningBilling] = useState(false);
  /** Super admin: which company’s authorizations UI to show (separate from billing selector). */
  const [authorizationsCompanyId, setAuthorizationsCompanyId] = useState<string>('');
  const [authorizationsLoading, setAuthorizationsLoading] = useState(false);
  /** Fresh title/access/limit from authorizations bundle (per project). */
  const [authzRowByProject, setAuthzRowByProject] = useState<
    Record<
      string,
      {
        title: string;
        accessOverride: 'allowed' | 'blocked' | null;
        deviceLimit: number | null;
        features: AppFeatures | null;
      }
    >
  >({});
  /** Editable feature map per project (effective values shown in UI). */
  const [featuresByProject, setFeaturesByProject] = useState<Record<string, AppFeatures>>({});
  const [savingFeaturesProjectId, setSavingFeaturesProjectId] = useState<string | null>(null);
  const authBundleProjectIdsRef = useRef<string[]>([]);

  // Filter projects by company for non-superadmins (support agents with authorizations see all passed companies)
  const visibleProjects = useMemo(() => {
    return isSuperAdmin || authorizationsElevated
      ? projects
      : projects.filter(p => p.companyId === currentUser?.company_id);
  }, [projects, isSuperAdmin, authorizationsElevated, currentUser?.company_id]);

  const visibleCompanies = useMemo(() => {
    return isSuperAdmin || authorizationsElevated
      ? companies
      : companies.filter(c => c.id === currentUser?.company_id);
  }, [companies, isSuperAdmin, authorizationsElevated, currentUser?.company_id]);

  // Create stable company IDs array for dependency
  const companyIds = useMemo(() => {
    return visibleCompanies.map(c => c.id).sort().join(',');
  }, [visibleCompanies]);

  // Load fees and subscriptions (Subscriptions tab only)
  useEffect(() => {
    if (variant !== 'billing') return;
    if (loadingRef.current) {
      return;
    }

    const loadData = async () => {
      loadingRef.current = true;
      setLoading(true);
      try {
        const feesData: Record<string, ProjectFee[]> = {};
        const subscriptionsData: Record<string, ProjectSubscription[]> = {};
        const statusData: Record<string, any> = {};

        const companyIds = visibleCompanies.map((c) => c.id).join(',');
        const batchRes = await fetch(
          `/api/admin/billing/subscriptions-batch?companyIds=${encodeURIComponent(companyIds)}`
        );

        if (batchRes.ok) {
          const batch = await batchRes.json();
          const byCompany = batch.byCompany || {};
          const paymentStatusBatch = batch.paymentStatus || {};

          for (const company of visibleCompanies) {
            const row = byCompany[company.id];
            if (row) {
              Object.entries(row.feesByProject || {}).forEach(([projectId, projectFees]) => {
                feesData[projectId] = projectFees as ProjectFee[];
              });
              Object.entries(row.subscriptionsByProject || {}).forEach(([projectId, projectSubs]) => {
                subscriptionsData[projectId] = projectSubs as ProjectSubscription[];
              });
            }
            if (paymentStatusBatch[company.id]) {
              statusData[company.id] = paymentStatusBatch[company.id];
            }
          }
        } else {
          await Promise.all(
            visibleCompanies.map(async (company) => {
              try {
                const [feesSubsRes, statusRes] = await Promise.all([
                  fetch(`/api/companies/${company.id}/fees-and-subscriptions`),
                  fetch(`/api/companies/${company.id}/payment-status?skipPreemptive=1`),
                ]);
                if (feesSubsRes.ok) {
                  const { feesByProject, subscriptionsByProject } = await feesSubsRes.json();
                  Object.entries(feesByProject || {}).forEach(([projectId, projectFees]) => {
                    feesData[projectId] = projectFees as ProjectFee[];
                  });
                  Object.entries(subscriptionsByProject || {}).forEach(([projectId, projectSubs]) => {
                    subscriptionsData[projectId] = projectSubs as ProjectSubscription[];
                  });
                }
                if (statusRes.ok) {
                  const { status } = await statusRes.json();
                  statusData[company.id] = status;
                }
              } catch (err) {
                console.error(`Error loading data for company ${company.id}:`, err);
              }
            })
          );
        }

        setFees(feesData);
        setSubscriptions(subscriptionsData);
        setPaymentStatus(statusData);
      } catch (err) {
        toast.error('Failed to load payment data');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadData();
  }, [companyIds, variant]);

  /** Super admin / elevated support agent Authorizations tab: one API call per selected company (devices + extension + GitHub). */
  useEffect(() => {
    if (variant !== 'authorizations' || !authorizationsFullUi) return;
    if (!authorizationsCompanyId) {
      const prevIds = authBundleProjectIdsRef.current;
      authBundleProjectIdsRef.current = [];
      setAuthzRowByProject({});
      const strip = <T extends Record<string, unknown>>(prev: T): T => {
        const next = { ...prev };
        for (const pid of prevIds) delete next[pid];
        return next as T;
      };
      setAuthDevicesByProject((prev) => strip(prev));
      setExtensionSourceByProject((prev) => strip(prev));
      setExtensionUrlInputByProject((prev) => strip(prev));
      setDeploymentVisibleFromInputByProject((prev) => strip(prev));
      setGithubStatusByProject((prev) => strip(prev));
      setSelectedRefByProject((prev) => strip(prev));
      setProjectApiKeyReveal((prev) => strip(prev));
      return;
    }

    let cancelled = false;
    const load = async () => {
      setAuthorizationsLoading(true);
      try {
        const res = await fetch(`/api/admin/companies/${authorizationsCompanyId}/authorizations-data`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || 'Failed to load authorizations');
          return;
        }
        const data = await res.json();
        const rows = data.projects as Array<{
          id: string;
          title: string;
          companyId: string;
          accessOverride: 'allowed' | 'blocked' | null;
          deviceLimit: number | null;
          features?: AppFeatures | null;
          devices: Array<{
            id: string;
            name: string;
            deviceId: string;
            status: string;
            isAdminDevice?: boolean;
            features?: AppFeatures | null;
          }>;
          extensionSource: {
            owner: string;
            repo: string;
            ref: string;
            deploymentVisibleFrom?: string | null;
          } | null;
          githubStatus: {
            hasGithubUrl: boolean;
            latestPushDate: string | null;
            currentRef?: string | null;
            defaultBranch?: string | null;
            deploymentVisibleFrom?: string | null;
            commits?: Array<{ sha: string; message: string; date: string; beforeDeploymentCutoff?: boolean }>;
          };
        }>;

        if (cancelled) return;

        const prevIds = authBundleProjectIdsRef.current;
        const newIds = rows.map((r) => r.id);
        authBundleProjectIdsRef.current = newIds;

        const stripStale = <T extends Record<string, unknown>>(prev: T): T => {
          const next = { ...prev };
          for (const pid of prevIds) {
            if (!newIds.includes(pid)) delete next[pid];
          }
          return next as T;
        };

        setAuthzRowByProject(
          Object.fromEntries(
            rows.map((r) => [
              r.id,
              {
                title: r.title,
                accessOverride: r.accessOverride,
                deviceLimit: r.deviceLimit,
                features: r.features ?? null,
              },
            ])
          )
        );

        setFeaturesByProject((prev) => {
          const next = stripStale(prev);
          for (const r of rows) {
            next[r.id] = resolveAppFeatures({ projectFeatures: r.features ?? null });
          }
          return next;
        });

        setAuthDevicesByProject((prev) => {
          const next = stripStale(prev);
          for (const r of rows) next[r.id] = r.devices;
          return next;
        });

        setExtensionSourceByProject((prev) => {
          const next = stripStale(prev);
          for (const r of rows) {
            next[r.id] = r.extensionSource
              ? {
                  owner: r.extensionSource.owner,
                  repo: r.extensionSource.repo,
                  ref: r.extensionSource.ref,
                  deploymentVisibleFrom: r.extensionSource.deploymentVisibleFrom ?? null,
                }
              : null;
          }
          return next;
        });

        const urlDrafts: Record<string, string> = {};
        const deployDrafts: Record<string, string> = {};
        for (const r of rows) {
          if (r.extensionSource) {
            urlDrafts[r.id] = `https://github.com/${r.extensionSource.owner}/${r.extensionSource.repo}/tree/${r.extensionSource.ref}`;
            deployDrafts[r.id] = r.extensionSource.deploymentVisibleFrom ?? '';
          } else {
            urlDrafts[r.id] = '';
            deployDrafts[r.id] = '';
          }
        }
        setExtensionUrlInputByProject((prev) => {
          const next = stripStale(prev);
          for (const id of newIds) next[id] = urlDrafts[id] ?? '';
          return next;
        });
        setDeploymentVisibleFromInputByProject((prev) => {
          const next = stripStale(prev);
          for (const id of newIds) next[id] = deployDrafts[id] ?? '';
          return next;
        });

        setGithubStatusByProject((prev) => {
          const next = stripStale(prev);
          for (const r of rows) next[r.id] = r.githubStatus;
          return next;
        });

        setSelectedRefByProject((prev) => {
          const next = stripStale(prev);
          for (const r of rows) {
            const status = r.githubStatus;
            if (status.commits?.length) {
              next[r.id] = resolveExtensionRefSelectValue(
                status.currentRef ?? null,
                status.defaultBranch ?? 'main',
                status.commits
              );
            }
          }
          return next;
        });

        setProjectApiKeyReveal((prev) => {
          const next = stripStale(prev);
          return next;
        });
      } catch {
        if (!cancelled) toast.error('Failed to load authorizations');
      } finally {
        if (!cancelled) setAuthorizationsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [variant, authorizationsFullUi, authorizationsCompanyId]);

  const handleCreateFee = async () => {
    if (!selectedProjectId || !feeName || !feeAmount || parseFloat(feeAmount) <= 0) {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    setCreatingFee(true);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: feeName,
          amount: parseFloat(feeAmount),
        }),
      });

      if (res.ok) {
        const { fee } = await res.json();
        setFees(prev => ({
          ...prev,
          [selectedProjectId]: [...(prev[selectedProjectId] || []), fee],
        }));
        toast.success('Fee created successfully');
        setShowFeeDialog(false);
        setFeeName('');
        setFeeAmount('');
        setSelectedProjectId('');
        
        // Reload payment status
        const project = visibleProjects.find(p => p.id === selectedProjectId);
        if (project) {
          const statusRes = await fetch(`/api/companies/${project.companyId}/payment-status?skipPreemptive=1`);
          if (statusRes.ok) {
            const { status } = await statusRes.json();
            setPaymentStatus(prev => ({ ...prev, [project.companyId]: status }));
          }
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create fee');
      }
    } catch (err) {
      toast.error('Failed to create fee');
    } finally {
      setCreatingFee(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedProjectId || !subscriptionName || !subscriptionAmount || parseFloat(subscriptionAmount) <= 0) {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    setCreatingSubscription(true);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subscriptionName,
          amount: parseFloat(subscriptionAmount),
          billingInterval: subscriptionBillingInterval,
          billingDayOfMonth: subscriptionBillingDayOfMonth !== '' ? subscriptionBillingDayOfMonth : undefined,
          billingDayOfWeek: subscriptionBillingDayOfWeek !== '' ? subscriptionBillingDayOfWeek : undefined,
        }),
      });

      if (res.ok) {
        const { subscription } = await res.json();
        setSubscriptions(prev => ({
          ...prev,
          [selectedProjectId]: [...(prev[selectedProjectId] || []), subscription],
        }));
        toast.success('Subscription created successfully');
        setShowSubscriptionDialog(false);
        setSubscriptionName('');
        setSubscriptionAmount('');
        setSubscriptionBillingInterval('monthly');
        setSubscriptionBillingDayOfMonth('');
        setSubscriptionBillingDayOfWeek('');
        setSelectedProjectId('');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create subscription');
      }
    } catch (err) {
      toast.error('Failed to create subscription');
    } finally {
      setCreatingSubscription(false);
    }
  };

  // Get payment request ID from fee/sub (support both camelCase and snake_case from API)
  const getPaymentRequestId = (item: { paymentRequestId?: string | null; payment_request_id?: string | null }): string | null => {
    return item.paymentRequestId ?? (item as { payment_request_id?: string | null }).payment_request_id ?? null;
  };

  // Open edit modal with form prefilled from data we already have. No page refetch.
  const openEditModalWithForm = (paymentRequestId: string, form: { amount: string; nextBillingDate: string; recipientName: string; recipientEmail: string }) => {
    editPaymentFormInitialRef.current = form;
    setEditingPaymentRequestId(paymentRequestId);
    setEditPaymentForm(form);
    setLoadingEditPayment(false);
    setShowEditPaymentDialog(true);
  };

  const handleDryRunBilling = async () => {
    if (!runBillingCompanyId) {
      toast.error('Select a company first');
      return;
    }
    setRunningDryRun(true);
    setDryRunResult(null);
    try {
      const res = await fetch('/api/admin/payments/run-company-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: runBillingCompanyId, dryRun: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Dry run failed');
        return;
      }
      setDryRunResult({
        subscriptionDebug: data.subscriptionDebug,
        paymentRequestDebug: data.paymentRequestDebug,
        dryRunDebug: data.dryRunDebug,
      });
      toast.success('Dry run complete. Review what would be billed below, then click Run billing to charge.');
    } catch {
      toast.error('Dry run failed');
    } finally {
      setRunningDryRun(false);
    }
  };

  const handleRunBilling = async () => {
    if (!runBillingCompanyId) {
      toast.error('Select a company first');
      return;
    }
    setRunningBilling(true);
    try {
      const res = await fetch('/api/admin/payments/run-company-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: runBillingCompanyId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Failed to run billing');
        return;
      }
      const total = (data.processed ?? 0) + (data.processedPaymentRequests ?? 0);
      const errs = (data.errors ?? 0) + (data.paymentRequestErrors ?? 0);
      if (errs > 0) {
        toast.warning(`Billing complete. ${total} charged, ${errs} failed.`);
      } else if (total > 0) {
        toast.success(`${total} item(s) charged.`);
      } else {
        toast.info(data.hint || 'No due items to charge.');
      }
      setDryRunResult(null);
      const statusRes = await fetch(`/api/companies/${runBillingCompanyId}/payment-status?skipPreemptive=1`);
      if (statusRes.ok) {
        const { status } = await statusRes.json();
        setPaymentStatus(prev => ({ ...prev, [runBillingCompanyId]: status }));
      }
      const [feesData, subscriptionsData] = [{ ...fees }, { ...subscriptions }];
      try {
        const feesSubsRes = await fetch(`/api/companies/${runBillingCompanyId}/fees-and-subscriptions`);
        if (feesSubsRes.ok) {
          const { feesByProject, subscriptionsByProject } = await feesSubsRes.json();
          Object.entries(feesByProject || {}).forEach(([projectId, projectFees]) => {
            feesData[projectId] = projectFees as ProjectFee[];
          });
          Object.entries(subscriptionsByProject || {}).forEach(([projectId, projectSubs]) => {
            subscriptionsData[projectId] = projectSubs as ProjectSubscription[];
          });
          setFees(feesData);
          setSubscriptions(subscriptionsData);
        }
      } catch {
        // ignore
      }
    } catch {
      toast.error('Failed to run billing');
    } finally {
      setRunningBilling(false);
    }
  };

  const handleOpenEditForFee = async (fee: ProjectFee) => {
    const prId = getPaymentRequestId(fee);
    const baseForm = {
      amount: String(fee.amount ?? ''),
      nextBillingDate: '',
      recipientName: '',
      recipientEmail: '',
    };
    if (prId) {
      openEditModalWithForm(prId, baseForm);
      fetch(`/api/admin/payments/${prId}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.request) {
            const r = data.request;
            setEditPaymentForm((prev) => ({
              ...prev,
              amount: String(r.amount ?? prev.amount),
              nextBillingDate: r.next_billing_date ? r.next_billing_date.slice(0, 10) : prev.nextBillingDate,
              recipientName: r.recipient_name ?? prev.recipientName,
              recipientEmail: r.recipient_email ?? prev.recipientEmail,
            }));
            if (editPaymentFormInitialRef.current) {
              editPaymentFormInitialRef.current = {
                ...editPaymentFormInitialRef.current,
                amount: String(r.amount ?? editPaymentFormInitialRef.current.amount),
                nextBillingDate: r.next_billing_date
                  ? r.next_billing_date.slice(0, 10)
                  : editPaymentFormInitialRef.current.nextBillingDate,
                recipientName: r.recipient_name ?? editPaymentFormInitialRef.current.recipientName,
                recipientEmail: r.recipient_email ?? editPaymentFormInitialRef.current.recipientEmail,
              };
            }
          }
        })
        .catch(() => {});
      return;
    }
    setShowEditPaymentDialog(true);
    setLoadingEditPayment(true);
    setLoadingEditMessage('Setting up edit…');
    setEditingPaymentRequestId(null);
    try {
      const res = await fetch(`/api/admin/payments/resolve-request?feeId=${encodeURIComponent(fee.id)}`);
      if (!res.ok) {
        setLoadingEditPayment(false);
        setShowEditPaymentDialog(false);
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Could not open edit');
        return;
      }
      const data = await res.json();
      const newPrId = data.paymentRequestId;
      if (newPrId) {
        const request = data.request;
        if (request) {
          openEditModalWithForm(newPrId, {
            amount: String(request.amount ?? fee.amount),
            nextBillingDate: request.next_billing_date ? request.next_billing_date.slice(0, 10) : '',
            recipientName: request.recipient_name ?? '',
            recipientEmail: request.recipient_email ?? '',
          });
        } else {
          openEditModalWithForm(newPrId, baseForm);
        }
        setFees((prev) => ({
          ...prev,
          [fee.projectId]: (prev[fee.projectId] || []).map((f) =>
            f.id === fee.id ? { ...f, paymentRequestId: newPrId } : f
          ),
        }));
      } else {
        setLoadingEditPayment(false);
        setShowEditPaymentDialog(false);
        toast.error('Could not open edit');
      }
    } catch {
      setLoadingEditPayment(false);
      setShowEditPaymentDialog(false);
      toast.error('Could not open edit');
    }
  };

  const handleOpenEditForSubscription = async (sub: ProjectSubscription) => {
    const prId = getPaymentRequestId(sub);
    const baseForm = {
      amount: String(sub.amount ?? ''),
      nextBillingDate: sub.nextBillingDate ? sub.nextBillingDate.slice(0, 10) : '',
      recipientName: '',
      recipientEmail: '',
    };
    if (prId) {
      openEditModalWithForm(prId, baseForm);
      fetch(`/api/admin/payments/${prId}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.request) {
            const r = data.request;
            setEditPaymentForm((prev) => ({
              ...prev,
              amount: String(r.amount ?? prev.amount),
              // Subscription list date is source of truth — PR date is often stale on old subs.
              recipientName: r.recipient_name ?? prev.recipientName,
              recipientEmail: r.recipient_email ?? prev.recipientEmail,
            }));
            if (editPaymentFormInitialRef.current) {
              editPaymentFormInitialRef.current = {
                ...editPaymentFormInitialRef.current,
                amount: String(r.amount ?? editPaymentFormInitialRef.current.amount),
                recipientName: r.recipient_name ?? editPaymentFormInitialRef.current.recipientName,
                recipientEmail: r.recipient_email ?? editPaymentFormInitialRef.current.recipientEmail,
              };
            }
          }
        })
        .catch(() => {});
      return;
    }
    setShowEditPaymentDialog(true);
    setLoadingEditPayment(true);
    setLoadingEditMessage('Setting up edit…');
    setEditingPaymentRequestId(null);
    try {
      const res = await fetch(`/api/admin/payments/resolve-request?subscriptionId=${encodeURIComponent(sub.id)}`);
      if (!res.ok) {
        setLoadingEditPayment(false);
        setShowEditPaymentDialog(false);
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Could not open edit');
        return;
      }
      const data = await res.json();
      const newPrId = data.paymentRequestId;
      if (newPrId) {
        const request = data.request;
        if (request) {
          openEditModalWithForm(newPrId, {
            amount: String(request.amount ?? sub.amount),
            nextBillingDate: request.next_billing_date ? request.next_billing_date.slice(0, 10) : baseForm.nextBillingDate,
            recipientName: request.recipient_name ?? '',
            recipientEmail: request.recipient_email ?? '',
          });
        } else {
          openEditModalWithForm(newPrId, baseForm);
        }
        setSubscriptions((prev) => ({
          ...prev,
          [sub.projectId]: (prev[sub.projectId] || []).map((s) =>
            s.id === sub.id ? { ...s, paymentRequestId: newPrId } : s
          ),
        }));
      } else {
        setLoadingEditPayment(false);
        setShowEditPaymentDialog(false);
        toast.error('Could not open edit');
      }
    } catch {
      setLoadingEditPayment(false);
      setShowEditPaymentDialog(false);
      toast.error('Could not open edit');
    }
  };

  const handleSaveEditPayment = async () => {
    if (!editingPaymentRequestId) return;
    setSavingEditPayment(true);
    try {
      const body: Record<string, unknown> = {};
      if (editPaymentForm.recipientName !== undefined) body.recipientName = editPaymentForm.recipientName;
      if (editPaymentForm.recipientEmail !== undefined) body.recipientEmail = editPaymentForm.recipientEmail;
      const amt = parseFloat(editPaymentForm.amount);
      if (!isNaN(amt)) body.amount = amt;
      const initial = editPaymentFormInitialRef.current;
      if (!initial || editPaymentForm.nextBillingDate !== initial.nextBillingDate) {
        body.nextBillingDate = editPaymentForm.nextBillingDate || null;
      }
      const res = await fetch(`/api/admin/payments/${editingPaymentRequestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success('Payment request updated');
        setShowEditPaymentDialog(false);
        setEditingPaymentRequestId(null);
        reloadPaymentData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update payment request');
    } finally {
      setSavingEditPayment(false);
    }
  };

  const handleDeleteFee = async (feeId: string, projectId: string) => {
    if (!confirm('Are you sure you want to delete this fee?')) return;

    setDeletingFeeId(feeId);
    try {
      const res = await fetch(`/api/projects/${projectId}/fees`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeId, projectId }),
      });

      if (res.ok) {
        setFees(prev => ({
          ...prev,
          [projectId]: (prev[projectId] || []).filter(f => f.id !== feeId),
        }));
        toast.success('Fee deleted successfully');
        
        // Reload payment status
        const project = visibleProjects.find(p => p.id === projectId);
        if (project) {
          const statusRes = await fetch(`/api/companies/${project.companyId}/payment-status?skipPreemptive=1`);
          if (statusRes.ok) {
            const { status } = await statusRes.json();
            setPaymentStatus(prev => ({ ...prev, [project.companyId]: status }));
          }
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete fee');
      }
    } catch (err) {
      toast.error('Failed to delete fee');
    } finally {
      setDeletingFeeId(null);
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string, projectId: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    setDeletingSubscriptionId(subscriptionId);
    try {
      const res = await fetch(`/api/projects/${projectId}/subscriptions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, projectId }),
      });

      if (res.ok) {
        setSubscriptions(prev => ({
          ...prev,
          [projectId]: (prev[projectId] || []).filter(s => s.id !== subscriptionId),
        }));
        toast.success('Subscription deleted successfully');
        // Reload payment status so "X issues" badge updates
        const project = visibleProjects.find(p => p.id === projectId);
        if (project) {
          const statusRes = await fetch(`/api/companies/${project.companyId}/payment-status?skipPreemptive=1`);
          if (statusRes.ok) {
            const { status } = await statusRes.json();
            setPaymentStatus(prev => ({ ...prev, [project.companyId]: status }));
          }
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete subscription');
      }
    } catch (err) {
      toast.error('Failed to delete subscription');
    } finally {
      setDeletingSubscriptionId(null);
    }
  };

  const handleStopSubscription = async (subscriptionId: string, projectId: string) => {
    if (!isSuperAdmin) {
      toast.error('Only superadmin can stop subscriptions');
      return;
    }

    if (!confirm('Are you sure you want to stop this subscription?')) return;

    setStoppingSubscriptionId(subscriptionId);
    try {
      const res = await fetch(`/api/projects/${projectId}/subscriptions/${subscriptionId}`, {
        method: 'PUT',
      });

      if (res.ok) {
        // Reload subscriptions for the specific project
        try {
          const subsRes = await fetch(`/api/projects/${projectId}/subscriptions`);
          if (subsRes.ok) {
            const { subscriptions: projectSubs } = await subsRes.json();
            setSubscriptions(prev => ({ ...prev, [projectId]: projectSubs || [] }));
          }
        } catch (err) {
          console.error(`Error reloading subscriptions for project ${projectId}:`, err);
        }
        // Reload payment status so "X issues" badge updates (stopped subs no longer count as overdue)
        const project = visibleProjects.find(p => p.id === projectId);
        if (project) {
          const statusRes = await fetch(`/api/companies/${project.companyId}/payment-status?skipPreemptive=1`);
          if (statusRes.ok) {
            const { status } = await statusRes.json();
            setPaymentStatus(prev => ({ ...prev, [project.companyId]: status }));
          }
        }
        toast.success('Subscription stopped successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to stop subscription');
      }
    } catch (err) {
      toast.error('Failed to stop subscription');
    } finally {
      setStoppingSubscriptionId(null);
    }
  };

  const handleViewTransactions = async (type: 'fee' | 'subscription', id: string, projectId: string) => {
    setTransactionType(type);
    setTransactionId(id);
    setShowTransactionsDialog(true);
    setLoadingTransactionsDialog(true);

    try {
      const url = type === 'fee'
        ? `/api/projects/${projectId}/fees/${id}/transactions`
        : `/api/projects/${projectId}/subscriptions/${id}/transactions`;
      
      const res = await fetch(url);
      if (res.ok) {
        const { transactions } = await res.json();
        if (type === 'fee') {
          setFeeTransactions(prev => ({ ...prev, [id]: transactions || [] }));
        } else {
          setSubscriptionTransactions(prev => ({ ...prev, [id]: transactions || [] }));
        }
      }
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoadingTransactionsDialog(false);
    }
  };

  // Load transactions when dropdown opens
  const loadTransactionsForDropdown = async (type: 'fee' | 'subscription', id: string, projectId: string) => {
    const key = `${type}-${id}`;
    if (type === 'fee' && feeTransactions[id]) {
      return;
    }
    if (type === 'subscription' && subscriptionTransactions[id]) {
      return;
    }

    setLoadingTransactionsId(key);
    try {
      const url = type === 'fee'
        ? `/api/projects/${projectId}/fees/${id}/transactions`
        : `/api/projects/${projectId}/subscriptions/${id}/transactions`;
      
      const res = await fetch(url);
      if (res.ok) {
        const { transactions } = await res.json();
        if (type === 'fee') {
          setFeeTransactions(prev => ({ ...prev, [id]: transactions || [] }));
        } else {
          setSubscriptionTransactions(prev => ({ ...prev, [id]: transactions || [] }));
        }
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoadingTransactionsId(null);
    }
  };

  const handleViewReceipt = async (transaction: ProjectFeeTransaction | ProjectSubscriptionTransaction) => {
    if (!transaction.paymentRequestId) {
      toast.error('No payment request linked to this transaction');
      return;
    }

    // Open the payments tab where receipts can be viewed/downloaded
    toast.info('Please go to the "Payments" tab to view and download receipts for transactions');
  };

  // Helper function to reload payment data
  const reloadPaymentData = async () => {
    loadingRef.current = false;
    setLoading(true);
    try {
      const feesData: Record<string, ProjectFee[]> = {};
      const subscriptionsData: Record<string, ProjectSubscription[]> = {};
      const statusData: Record<string, any> = {};

      const companyRequests = visibleCompanies.map(async (company) => {
        try {
          const [feesSubsRes, statusRes] = await Promise.all([
            fetch(`/api/companies/${company.id}/fees-and-subscriptions`),
            fetch(`/api/companies/${company.id}/payment-status?skipPreemptive=1`),
          ]);

          if (feesSubsRes.ok) {
            const { feesByProject, subscriptionsByProject } = await feesSubsRes.json();
            Object.entries(feesByProject || {}).forEach(([pid, projectFees]) => {
              feesData[pid] = projectFees as ProjectFee[];
            });
            Object.entries(subscriptionsByProject || {}).forEach(([pid, projectSubs]) => {
              subscriptionsData[pid] = projectSubs as ProjectSubscription[];
            });
          }

          if (statusRes.ok) {
            const { status } = await statusRes.json();
            statusData[company.id] = status;
          }
        } catch (err) {
          console.error(`Error loading data for company ${company.id}:`, err);
        }
      });

      await Promise.all(companyRequests);
      setFees(feesData);
      setSubscriptions(subscriptionsData);
      setPaymentStatus(statusData);

    } catch (err) {
      console.error('Error reloading payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFee = async (feeId: string, projectId: string) => {
    const fee = fees[projectId]?.find(f => f.id === feeId);
    if (!fee) {
      toast.error('Fee not found');
      return;
    }

    // If fee already has a payment request, check if it has a payment method
    if (fee.paymentRequestId) {
      try {
        // Check if payment request has payment method
        const res = await fetch('/api/admin/payments');
        if (res.ok) {
          const { requests } = await res.json();
          const paymentRequest = requests.find((r: any) => r.id === fee.paymentRequestId);
          
          // If payment method is attached, bill it directly
          if (paymentRequest?.stripe_customer_id && paymentRequest?.stripe_payment_method_id) {
            setProcessingBilling(feeId);
            try {
              const billRes = await fetch('/api/admin/payments/bill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: fee.paymentRequestId,
                  amount: fee.amount,
                }),
              });

              if (billRes.ok) {
                const { success, message } = await billRes.json();
                if (success) {
                  toast.success(message || 'Payment processed successfully');
                  reloadPaymentData();
                } else {
                  toast.error(message || 'Failed to process payment');
                }
              } else {
                const error = await billRes.json();
                toast.error(error.error || 'Failed to process payment');
              }
            } catch (err) {
              toast.error('Failed to process payment');
            } finally {
              setProcessingBilling(null);
            }
            return;
          }
        }
      } catch (err) {
        console.error('Error checking payment method:', err);
      }
    }

    // If no payment method attached, create new payment request
    try {
      toast.loading('Creating payment request...', { id: 'pay-fee' });
      const res = await fetch(`/api/projects/${projectId}/fees/${feeId}/create-payment`, {
        method: 'POST',
      });

      if (res.ok) {
        const { paymentUrl: url } = await res.json();
        toast.dismiss('pay-fee');
        setPaymentUrl(url);
        setShowPaymentModal(true);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create payment', { id: 'pay-fee' });
      }
    } catch (err) {
      toast.error('Failed to create payment', { id: 'pay-fee' });
    }
  };

  const handlePaySubscription = async (subscriptionId: string, projectId: string) => {
    try {
      toast.loading('Creating payment request...', { id: 'pay-sub' });
      const res = await fetch(`/api/projects/${projectId}/subscriptions/${subscriptionId}/create-payment`, {
        method: 'POST',
      });

      if (res.ok) {
        const { paymentUrl: url } = await res.json();
        toast.dismiss('pay-sub');
        setPaymentUrl(url);
        setShowPaymentModal(true);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create payment', { id: 'pay-sub' });
      }
    } catch (err) {
      toast.error('Failed to create payment', { id: 'pay-sub' });
    }
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setPaymentUrl(null);
    // Reload payment data after modal closes
    reloadPaymentData();
  };

  // Helper to check if subscription has payment method attached
  const hasPaymentMethod = (sub: ProjectSubscription): boolean => {
    // If subscription has Stripe subscription, payment method is definitely attached
    // (Stripe handles billing automatically)
    if (sub.stripeSubscriptionId) {
      return true;
    }
    // If subscription has payment request ID, payment method might be attached
    // (for manual billing)
    return !!sub.paymentRequestId;
  };

  // Helper to check if subscription needs manual billing (has payment method but no Stripe subscription)
  const needsManualBilling = (sub: ProjectSubscription): boolean => {
    // Only needs manual billing if it has payment request but no Stripe subscription
    return !!sub.paymentRequestId && !sub.stripeSubscriptionId;
  };

  // Helper to check if subscription is due for billing
  const isSubscriptionDue = (sub: ProjectSubscription): boolean => {
    if (sub.status !== 'active' || !sub.nextBillingDate) {
      return false;
    }
    const nextBilling = new Date(sub.nextBillingDate);
    const now = new Date();
    return now >= nextBilling;
  };

  // Helper to check if fee has payment method attached
  // We'll need to check the payment request to see if it has a payment method
  const feeHasPaymentMethod = (fee: ProjectFee): boolean => {
    return !!fee.paymentRequestId;
  };

  // Check if fee's payment request has a saved payment method
  const checkFeePaymentMethod = async (fee: ProjectFee): Promise<boolean> => {
    if (!fee.paymentRequestId) {
      return false;
    }
    
    try {
      // Get payment request details to check for payment method
      const res = await fetch('/api/admin/payments');
      if (res.ok) {
        const { requests } = await res.json();
        const paymentRequest = requests.find((r: any) => r.id === fee.paymentRequestId);
        return !!(paymentRequest?.stripe_customer_id && paymentRequest?.stripe_payment_method_id);
      }
    } catch (err) {
      console.error('Error checking fee payment method:', err);
    }
    return false;
  };

  // Process billing for a subscription
  const handleProcessBilling = async (subscriptionId: string, projectId: string, subscription: ProjectSubscription) => {
    if (!subscription.paymentRequestId) {
      toast.error('No payment request found for this subscription');
      return;
    }

    setProcessingBilling(subscriptionId);
    try {
      // Use the bill endpoint to process billing
      const res = await fetch('/api/admin/payments/bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subscription.paymentRequestId,
          amount: subscription.amount,
        }),
      });

      if (res.ok) {
        const { success, message } = await res.json();
        if (success) {
          toast.success(message || 'Billing processed successfully');
          reloadPaymentData();
        } else {
          toast.error(message || 'Failed to process billing');
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to process billing');
      }
    } catch (err) {
      toast.error('Failed to process billing');
    } finally {
      setProcessingBilling(null);
    }
  };

  const handleMarkSubscriptionPaid = async (sub: ProjectSubscription, projectId: string) => {
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
        `/api/projects/${projectId}/subscriptions/${sub.id}/mark-completed`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as paid');
      toast.success(data.message || 'Subscription marked as paid');
      reloadPaymentData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as paid');
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleMarkFeePaid = async (fee: ProjectFee, projectId: string) => {
    if (
      !confirm(
        `Mark "${fee.name}" ($${fee.amount.toFixed(2)}) as paid? This records payment outside Stripe.`
      )
    ) {
      return;
    }
    setMarkingPaidId(`fee-${fee.id}`);
    try {
      const res = await fetch(`/api/projects/${projectId}/fees/${fee.id}/mark-completed`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as paid');
      toast.success(data.message || 'Fee marked as paid');
      reloadPaymentData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as paid');
    } finally {
      setMarkingPaidId(null);
    }
  };

  // View/Download invoice for a transaction
  const handleDownloadInvoice = async (transaction: ProjectFeeTransaction | ProjectSubscriptionTransaction) => {
    if (!transaction.paymentRequestId) {
      toast.error('No payment request linked to this transaction');
      return;
    }

    setLoadingReceipt(true);
    setShowReceiptDialog(true);
    setReceiptPaymentId(transaction.paymentRequestId);
    setReceiptPaymentIntentId(transaction.stripePaymentIntentId || undefined);
    
    try {
      const url = transaction.stripePaymentIntentId
        ? `/api/admin/payments/${transaction.paymentRequestId}/receipt?paymentIntentId=${transaction.stripePaymentIntentId}`
        : `/api/admin/payments/${transaction.paymentRequestId}/receipt`;
      
      const res = await fetch(url);
      if (res.ok) {
        const { receipt } = await res.json();
        setReceiptData(receipt);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to load receipt');
        setShowReceiptDialog(false);
        setReceiptPaymentId(null);
        setReceiptPaymentIntentId(undefined);
      }
    } catch (err) {
      toast.error('Failed to load receipt');
      setShowReceiptDialog(false);
      setReceiptPaymentId(null);
      setReceiptPaymentIntentId(undefined);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const getStatusBadge = (status: string, item: ProjectFee | ProjectSubscription) => {
    // For subscriptions, determine actual status based on payment state
    if ('nextBillingDate' in item) {
      const subscription = item as ProjectSubscription;
      
      // If stopped or cancelled, show that
      if (status === 'stopped' || status === 'cancelled') {
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Stopped</Badge>;
      }
      
      // Check if subscription has been paid (has paymentRequestId AND stripeSubscriptionId means payment completed)
      if (!subscription.paymentRequestId || !subscription.stripeSubscriptionId) {
        // No payment made yet or payment not completed
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Not Started</Badge>;
      }
      
      // Check if there are outstanding bills (next billing date passed and no recent transaction)
      if (subscription.nextBillingDate) {
        const nextBilling = new Date(subscription.nextBillingDate);
        const now = new Date();
        const isOverdue = now > nextBilling;
        
        if (isOverdue) {
          return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
        }
      }
      
      // Active and paid (has completed payment with invoice)
      return <Badge variant="default" className="bg-primary text-primary-foreground"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    }
    
    // For fees, use the status directly
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-primary text-primary-foreground"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Group projects by company
  const projectsByCompany = visibleCompanies.reduce((acc, company) => {
    acc[company.id] = visibleProjects.filter(p => p.companyId === company.id);
    return acc;
  }, {} as Record<string, Project[]>);

  /** Super admin (or elevated support agent on authorizations): one company at a time; company admins see their company only. */
  const companiesToShow = useMemo(() => {
    if (!isSuperAdmin && !authorizationsElevated) return visibleCompanies;
    if (variant === 'billing') {
      if (!isSuperAdmin) return visibleCompanies;
      if (!runBillingCompanyId) return [];
      const c = visibleCompanies.find((x) => x.id === runBillingCompanyId);
      return c ? [c] : [];
    }
    if (variant === 'authorizations') {
      if (!authorizationsCompanyId) return [];
      const c = visibleCompanies.find((x) => x.id === authorizationsCompanyId);
      return c ? [c] : [];
    }
    return visibleCompanies;
  }, [isSuperAdmin, authorizationsElevated, variant, visibleCompanies, runBillingCompanyId, authorizationsCompanyId]);

  if (loading && variant === 'billing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-6 p-8">
        <Loader2 className="h-14 w-14 animate-spin text-primary" />
        <div className="text-center space-y-1">
          <p className="font-medium text-foreground">Loading payment data…</p>
          <p className="text-sm text-muted-foreground">
            Fetching fees, subscriptions, and status. This may take a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Super admin: Run company billing (dry run then run) */}
      {isSuperAdmin && variant === 'billing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              Company & billing
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Pick a company to view its fees and subscriptions below. Use dry run / run billing when you are ready to
              charge that company.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2 min-w-[200px]">
                <Label>Company</Label>
                <Select
                  value={runBillingCompanyId || undefined}
                  onValueChange={(v) => {
                    setRunBillingCompanyId(v);
                    setDryRunResult(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleCompanies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={handleDryRunBilling}
                disabled={!runBillingCompanyId || runningDryRun || runningBilling}
              >
                {runningDryRun ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Dry run
              </Button>
              <Button
                variant="destructive"
                onClick={handleRunBilling}
                disabled={!runBillingCompanyId || runningBilling || runningDryRun}
              >
                {runningBilling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                Run billing
              </Button>
            </div>

            {dryRunResult && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4 text-sm">
                <p className="font-medium">Dry run result – what would be billed</p>
                {dryRunResult.subscriptionDebug && dryRunResult.subscriptionDebug.length > 0 && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-2">Subscriptions</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {dryRunResult.subscriptionDebug.map((s) => (
                        <li key={s.id}>
                          {s.name} (next: {s.next_billing_date ?? '—'}) – {s.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {dryRunResult.paymentRequestDebug && dryRunResult.paymentRequestDebug.length > 0 && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-2">Payment requests (would charge)</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {dryRunResult.paymentRequestDebug.map((pr) => (
                        <li key={pr.id}>
                          ID {pr.id.slice(0, 8)}… {pr.payment_type} ${(pr.amount || 0).toFixed(2)} (due: {pr.next_billing_date ?? '—'}) – {pr.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {dryRunResult.dryRunDebug?.allPaymentRequestsBreakdown && dryRunResult.dryRunDebug.allPaymentRequestsBreakdown.length > 0 && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-2">All payment requests (breakdown)</p>
                    <div className="overflow-x-auto max-h-60 overflow-y-auto rounded border">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left p-2">Company</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-right p-2">Amount</th>
                            <th className="text-left p-2">Due</th>
                            <th className="text-left p-2">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dryRunResult.dryRunDebug.allPaymentRequestsBreakdown.map((row) => (
                            <tr key={row.id} className="border-t">
                              <td className="p-2">{row.company_name}</td>
                              <td className="p-2">{row.payment_type}</td>
                              <td className="p-2 text-right">${row.amount.toFixed(2)}</td>
                              <td className="p-2">{row.next_billing_date ?? '—'}</td>
                              <td className="p-2">{row.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {dryRunResult.dryRunDebug?.skippedNoMethod && dryRunResult.dryRunDebug.skippedNoMethod.length > 0 && (
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400 mb-2">Skipped (due but no payment method)</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {dryRunResult.dryRunDebug.skippedNoMethod.map((s) => (
                        <li key={s.id}>ID {s.id.slice(0, 8)}… {s.payment_type} – {s.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(!dryRunResult.subscriptionDebug || dryRunResult.subscriptionDebug.length === 0) &&
                 (!dryRunResult.paymentRequestDebug || dryRunResult.paymentRequestDebug.length === 0) &&
                 (!dryRunResult.dryRunDebug?.allPaymentRequestsBreakdown || dryRunResult.dryRunDebug.allPaymentRequestsBreakdown.filter((r) => r.reason === 'would_charge').length === 0) && (
                  <p className="text-muted-foreground">No items would be charged (all skipped or not due).</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {authorizationsFullUi && variant === 'authorizations' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Select company
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose which company’s project access, devices, and extension settings to show.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-md">
              <Label>Company</Label>
              <Select
                value={authorizationsCompanyId || undefined}
                onValueChange={(v) => setAuthorizationsCompanyId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {visibleCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {isSuperAdmin && variant === 'billing' && !runBillingCompanyId && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Select a company above to load fees, subscriptions, and payment status for that company only.
          </CardContent>
        </Card>
      )}

      {authorizationsFullUi && variant === 'authorizations' && !authorizationsCompanyId && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Select a company above to manage devices, access overrides, GitHub extension, and integration details.
          </CardContent>
        </Card>
      )}

      {/* Company sections: billing vs. authorizations */}
      {authorizationsFullUi && variant === 'authorizations' && authorizationsCompanyId && authorizationsLoading ? (
        <Card>
          <CardContent className="py-14 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading devices and extension data…</p>
          </CardContent>
        </Card>
      ) : (
      companiesToShow.map(company => {
        const status = paymentStatus[company.id];
        const companyProjects = projectsByCompany[company.id] || [];
        
        return (
          <Card key={company.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {variant === 'billing' ? (
                    <DollarSign className="w-5 h-5" />
                  ) : (
                    <Smartphone className="w-5 h-5" />
                  )}
                  {variant === 'billing'
                    ? `${company.name} — Payments & subscriptions`
                    : `${company.name} — Project access & devices`}
                </CardTitle>
                {variant === 'billing' && status && (
                  <Badge variant={status.allUpToDate ? "default" : "destructive"} className="ml-auto">
                    {status.allUpToDate ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        All Payments Up to Date
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {status.pendingFees + status.overdueSubscriptions + (status.overdueBills ?? 0)} Issue
                        {status.pendingFees + status.overdueSubscriptions + (status.overdueBills ?? 0) !== 1 ? 's' : ''}
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {variant === 'billing' && status && !status.allUpToDate && (
                <div className="mb-4 p-3 bg-muted border border-border rounded-lg">
                  <p className="text-sm">
                    {status.pendingFees > 0 && `${status.pendingFees} pending fee${status.pendingFees !== 1 ? 's' : ''}`}
                    {status.pendingFees > 0 &&
                      (status.overdueSubscriptions > 0 || (status.overdueBills ?? 0) > 0) &&
                      ' and '}
                    {status.overdueSubscriptions > 0 &&
                      `${status.overdueSubscriptions} overdue subscription${status.overdueSubscriptions !== 1 ? 's' : ''}`}
                    {status.overdueSubscriptions > 0 && (status.overdueBills ?? 0) > 0 && ' and '}
                    {(status.overdueBills ?? 0) > 0 &&
                      `${status.overdueBills} overdue bill${status.overdueBills !== 1 ? 's' : ''}`}
                  </p>
                </div>
              )}

              {companyProjects.length === 0 ? (
                <p className="text-muted-foreground">No projects found</p>
              ) : (
                <div className="space-y-6">
                  {companyProjects.map(project => {
                    const authzRow = authzRowByProject[project.id];
                    const displayProject = authzRow
                      ? {
                          ...project,
                          title: authzRow.title,
                          accessOverride: authzRow.accessOverride,
                          deviceLimit: authzRow.deviceLimit,
                        }
                      : project;
                    const currentOverride = accessOverrideByProject[project.id] !== undefined
                      ? accessOverrideByProject[project.id]
                      : (displayProject.accessOverride ?? null);
                    const resolvedDeviceLimit =
                      deviceLimitOverrideByProject[project.id] ?? displayProject.deviceLimit ?? null;
                    const authDevicesUsed = (authDevicesByProject[project.id] || []).filter(
                      (d) =>
                        (d.status === 'active' || d.status === 'paused') && !d.isAdminDevice
                    ).length;
                    return (
                    <div key={project.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{displayProject.title}</h3>
                        {isSuperAdmin && variant === 'billing' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProjectId(project.id);
                                setShowFeeDialog(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Fee
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProjectId(project.id);
                                setShowSubscriptionDialog(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Subscription
                            </Button>
                          </div>
                        )}
                      </div>

                      {authorizationsFullUi && variant === 'authorizations' && (
                        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Key className="w-4 h-4" />
                              Access for this project
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Override entitlement for this project. Otherwise, typical payment rules apply.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-primary/20">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium">Auth device limit</span>
                            </div>
                            <Input
                              type="number"
                              min={0}
                              placeholder="No limit"
                              className="w-24"
                              value={
                                deviceLimitInputByProject[project.id] !== undefined
                                  ? deviceLimitInputByProject[project.id]
                                  : resolvedDeviceLimit != null
                                    ? String(resolvedDeviceLimit)
                                    : ''
                              }
                              onChange={(e) =>
                                setDeviceLimitInputByProject((prev) => ({ ...prev, [project.id]: e.target.value }))
                              }
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={savingDeviceLimitProjectId === project.id}
                              onClick={async () => {
                                setSavingDeviceLimitProjectId(project.id);
                                try {
                                  const raw = deviceLimitInputByProject[project.id]?.trim();
                                  const empty = raw === undefined || raw === '';
                                  let parsed: number | null = null;
                                  if (!empty) {
                                    const n = parseInt(raw, 10);
                                    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
                                      toast.error('Enter a non-negative integer or leave blank for no limit');
                                      return;
                                    }
                                    parsed = n;
                                  }
                                  const res = await fetch(`/api/projects/${project.id}/device-limit`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ device_limit: parsed }),
                                  });
                                  if (res.ok) {
                                    setDeviceLimitOverrideByProject((prev) => ({ ...prev, [project.id]: parsed }));
                                    setAuthzRowByProject((prev) => {
                                      const row = prev[project.id];
                                      if (!row) return prev;
                                      return { ...prev, [project.id]: { ...row, deviceLimit: parsed } };
                                    });
                                    toast.success('Device limit updated');
                                  } else {
                                    const data = await res.json().catch(() => ({}));
                                    toast.error(data.error || 'Failed to update');
                                  }
                                } finally {
                                  setSavingDeviceLimitProjectId(null);
                                }
                              }}
                            >
                              {savingDeviceLimitProjectId === project.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Save'
                              )}
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {authDevicesUsed} device{authDevicesUsed !== 1 ? 's' : ''} used (active + paused)
                              {resolvedDeviceLimit != null && ` / ${resolvedDeviceLimit} allowed`}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              size="sm"
                              variant={currentOverride === 'allowed' ? 'default' : 'outline'}
                              className={currentOverride === 'allowed' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}
                              disabled={loadingAccessOverrideProjectId === project.id}
                              onClick={async () => {
                                setLoadingAccessOverrideProjectId(project.id);
                                try {
                                  const res = await fetch(`/api/projects/${project.id}/access-override`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ accessOverride: 'allowed' }),
                                  });
                                  if (res.ok) {
                                    setAccessOverrideByProject(prev => ({ ...prev, [project.id]: 'allowed' }));
                                    toast.success('Project access set to Always allow');
                                  } else {
                                    const data = await res.json();
                                    toast.error(data.error || 'Failed to update');
                                  }
                                } finally {
                                  setLoadingAccessOverrideProjectId(null);
                                }
                              }}
                            >
                              {loadingAccessOverrideProjectId === project.id && currentOverride !== 'allowed' ? (
                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1.5" />
                              )}
                              Allow
                            </Button>
                            <Button
                              size="sm"
                              variant={currentOverride === 'blocked' ? 'destructive' : 'outline'}
                              disabled={loadingAccessOverrideProjectId === project.id}
                              onClick={async () => {
                                setLoadingAccessOverrideProjectId(project.id);
                                try {
                                  const res = await fetch(`/api/projects/${project.id}/access-override`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ accessOverride: 'blocked' }),
                                  });
                                  if (res.ok) {
                                    setAccessOverrideByProject(prev => ({ ...prev, [project.id]: 'blocked' }));
                                    toast.success('Project access set to Block');
                                  } else {
                                    const data = await res.json();
                                    toast.error(data.error || 'Failed to update');
                                  }
                                } finally {
                                  setLoadingAccessOverrideProjectId(null);
                                }
                              }}
                            >
                              {loadingAccessOverrideProjectId === project.id && currentOverride !== 'blocked' ? (
                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1.5" />
                              )}
                              Block
                            </Button>
                            <Button
                              size="sm"
                              variant={currentOverride === null ? 'secondary' : 'outline'}
                              disabled={loadingAccessOverrideProjectId === project.id}
                              onClick={async () => {
                                setLoadingAccessOverrideProjectId(project.id);
                                try {
                                  const res = await fetch(`/api/projects/${project.id}/access-override`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ accessOverride: null }),
                                  });
                                  if (res.ok) {
                                    setAccessOverrideByProject(prev => ({ ...prev, [project.id]: null }));
                                    toast.success('Project follows typical payment rules');
                                  } else {
                                    const data = await res.json();
                                    toast.error(data.error || 'Failed to update');
                                  }
                                } finally {
                                  setLoadingAccessOverrideProjectId(null);
                                }
                              }}
                            >
                              {loadingAccessOverrideProjectId === project.id && currentOverride !== null ? (
                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                              ) : null}
                              Follow typical rules
                            </Button>
                          </div>
                          {currentOverride !== null && (
                            <p className="text-xs text-muted-foreground">
                              Current: {currentOverride === 'allowed' ? 'Always allow (overrides payments)' : 'Blocked (overrides payments)'}
                            </p>
                          )}

                          <div className="pt-3 border-t border-primary/20 space-y-3">
                            <div>
                              <h4 className="font-medium mb-1">Project feature defaults</h4>
                              <p className="text-sm text-muted-foreground">
                                Baseline flags for this project. Devices can override these. Returned on
                                auth/config as <code className="text-xs">features</code>.
                              </p>
                            </div>
                            <AppFeaturesEditor
                              value={featuresByProject[project.id] ?? {}}
                              disabled={savingFeaturesProjectId === project.id}
                              onChange={(next) =>
                                setFeaturesByProject((prev) => ({ ...prev, [project.id]: next }))
                              }
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={savingFeaturesProjectId === project.id}
                                onClick={async () => {
                                  setSavingFeaturesProjectId(project.id);
                                  try {
                                    const features = featuresByProject[project.id] ?? {};
                                    const res = await fetch(`/api/projects/${project.id}/features`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ features }),
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      setAuthzRowByProject((prev) => {
                                        const row = prev[project.id];
                                        if (!row) return prev;
                                        return {
                                          ...prev,
                                          [project.id]: { ...row, features: data.features ?? features },
                                        };
                                      });
                                      setFeaturesByProject((prev) => ({
                                        ...prev,
                                        [project.id]: data.effective ?? features,
                                      }));
                                      toast.success('Project features saved');
                                    } else {
                                      const data = await res.json().catch(() => ({}));
                                      toast.error(data.error || 'Failed to save features');
                                    }
                                  } finally {
                                    setSavingFeaturesProjectId(null);
                                  }
                                }}
                              >
                                {savingFeaturesProjectId === project.id ? (
                                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                ) : null}
                                Save features
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={savingFeaturesProjectId === project.id}
                                onClick={async () => {
                                  setSavingFeaturesProjectId(project.id);
                                  try {
                                    const res = await fetch(`/api/projects/${project.id}/features`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ features: null }),
                                    });
                                    if (res.ok) {
                                      setAuthzRowByProject((prev) => {
                                        const row = prev[project.id];
                                        if (!row) return prev;
                                        return { ...prev, [project.id]: { ...row, features: null } };
                                      });
                                      setFeaturesByProject((prev) => ({
                                        ...prev,
                                        [project.id]: {},
                                      }));
                                      toast.success('Project features cleared');
                                    } else {
                                      const data = await res.json().catch(() => ({}));
                                      toast.error(data.error || 'Failed to clear features');
                                    }
                                  } finally {
                                    setSavingFeaturesProjectId(null);
                                  }
                                }}
                              >
                                Clear all
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {variant === 'billing' && (
                      <div>
                        <h4 className="font-medium mb-2">One-Time Fees</h4>
                        {!fees[project.id] || fees[project.id].length === 0 ? (
                          <p className="text-sm text-muted-foreground">No fees</p>
                        ) : (
                          <div className="space-y-2">
                            {fees[project.id].map(fee => {
                              const paymentMethodAttached = feeHasPaymentMethod(fee);
                              const isPending = fee.status === 'pending';
                              
                              return (
                                <div key={fee.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{fee.name}</span>
                                      {getStatusBadge(fee.status, fee)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      ${fee.amount.toFixed(2)} - Created {new Date(fee.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Payment Method: {paymentMethodAttached ? (
                                        <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Attached
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Not Attached
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {/* Show Pay button only if payment method attached and fee is pending */}
                                    {paymentMethodAttached && isPending && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handlePayFee(fee.id, project.id)}
                                        disabled={processingBilling === fee.id}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                      >
                                        {processingBilling === fee.id ? (
                                          'Processing...'
                                        ) : (
                                          <>
                                            <CreditCard className="w-4 h-4 mr-1" />
                                            Pay
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    {isSuperAdmin && isPending && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleMarkFeePaid(fee, project.id)}
                                        disabled={markingPaidId === `fee-${fee.id}`}
                                      >
                                        {markingPaidId === `fee-${fee.id}` ? (
                                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        ) : (
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                        )}
                                        Mark as paid
                                      </Button>
                                    )}
                                    {/* Order History Dropdown */}
                                    <DropdownMenu onOpenChange={(open) => {
                                      if (open) {
                                        loadTransactionsForDropdown('fee', fee.id, project.id);
                                      }
                                    }}>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline">
                                          <FileText className="w-4 h-4 mr-1" />
                                          Order History
                                          <ChevronDown className="w-4 h-4 ml-1" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                                        <div className="p-2">
                                          <div className="font-semibold mb-2">Setup Fee Transactions</div>
                                          {loadingTransactionsId === `fee-${fee.id}` ? (
                                            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                                              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                              Loading transactions…
                                            </div>
                                          ) : (feeTransactions[fee.id] || []).length === 0 ? (
                                            <div className="text-sm text-muted-foreground py-2">No transactions yet</div>
                                          ) : (
                                            <div className="space-y-2">
                                              {(feeTransactions[fee.id] || []).map((tx) => (
                                                <div key={tx.id} className="flex items-center justify-between p-2 border rounded text-sm">
                                                  <div>
                                                    <div className="font-medium">${tx.amount.toFixed(2)}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                      {new Date(tx.transactionDate).toLocaleDateString()}
                                                      {tx.invoiceNumber && ` - Invoice #${tx.invoiceNumber}`}
                                                    </div>
                                                  </div>
                                                  {tx.paymentRequestId && (
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => handleDownloadInvoice(tx)}
                                                      className="h-8"
                                                    >
                                                      <Download className="w-3 h-3" />
                                                    </Button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    {isSuperAdmin && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleOpenEditForFee(fee)}
                                          title="Edit payment (due date, amount, recipient)"
                                        >
                                          <Pencil className="w-4 h-4 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleDeleteFee(fee.id, project.id)}
                                          disabled={deletingFeeId === fee.id}
                                        >
                                          {deletingFeeId === fee.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      )}

                      {variant === 'billing' && (
                      <div>
                        <h4 className="font-medium mb-2">Subscriptions</h4>
                        {!subscriptions[project.id] || subscriptions[project.id].length === 0 ? (
                          <p className="text-sm text-muted-foreground">No subscriptions</p>
                        ) : (
                          <div className="space-y-2">
                            {subscriptions[project.id].map(sub => {
                              const paymentMethodAttached = hasPaymentMethod(sub);
                              const isDue = isSubscriptionDue(sub);
                              const canProcessBilling = needsManualBilling(sub) && isDue && sub.status === 'active';
                              
                              return (
                                <div key={sub.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{sub.name}</span>
                                      {getStatusBadge(sub.status, sub)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      ${sub.amount.toFixed(2)}/{sub.billingInterval || 'month'}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Payment Method: {paymentMethodAttached ? (
                                        <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Attached
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Not Attached
                                        </Badge>
                                      )}
                                    </div>
                                    {sub.nextBillingDate && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Next billing: <span className="font-medium">{new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                    {sub.lastBilledDate && (
                                      <div className="text-xs text-muted-foreground">
                                        Last billed: {new Date(sub.lastBilledDate).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    {/* Show Pay button only if payment method attached, needs manual billing, and something is due */}
                                    {canProcessBilling && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleProcessBilling(sub.id, project.id, sub)}
                                        disabled={processingBilling === sub.id}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                      >
                                        {processingBilling === sub.id ? (
                                          'Processing...'
                                        ) : (
                                          <>
                                            <CreditCard className="w-4 h-4 mr-1" />
                                            Pay
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    {isSuperAdmin && sub.status === 'active' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleMarkSubscriptionPaid(sub, project.id)}
                                        disabled={markingPaidId === `sub-${sub.id}`}
                                      >
                                        {markingPaidId === `sub-${sub.id}` ? (
                                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        ) : (
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                        )}
                                        Mark as paid
                                      </Button>
                                    )}
                                    {/* Order History Dropdown */}
                                    <DropdownMenu onOpenChange={(open) => {
                                      if (open) {
                                        loadTransactionsForDropdown('subscription', sub.id, project.id);
                                      }
                                    }}>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline">
                                          <FileText className="w-4 h-4 mr-1" />
                                          Order History
                                          <ChevronDown className="w-4 h-4 ml-1" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                                        <div className="p-2">
                                          <div className="font-semibold mb-2">Subscription Transactions</div>
                                          {loadingTransactionsId === `subscription-${sub.id}` ? (
                                            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                                              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                              Loading transactions…
                                            </div>
                                          ) : (subscriptionTransactions[sub.id] || []).length === 0 ? (
                                            <div className="text-sm text-muted-foreground py-2">No transactions yet</div>
                                          ) : (
                                            <div className="space-y-2">
                                              {(subscriptionTransactions[sub.id] || []).map((tx) => (
                                                <div key={tx.id} className="flex items-center justify-between p-2 border rounded text-sm">
                                                  <div>
                                                    <div className="font-medium">${tx.amount.toFixed(2)}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                      {new Date(tx.transactionDate).toLocaleDateString()}
                                                      {tx.invoiceNumber && ` - Invoice #${tx.invoiceNumber}`}
                                                    </div>
                                                  </div>
                                                  {tx.paymentRequestId && (
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => handleDownloadInvoice(tx)}
                                                      className="h-8"
                                                    >
                                                      <Download className="w-3 h-3" />
                                                    </Button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    {isSuperAdmin && (
                                      <>
                                        {sub.status === 'active' && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleStopSubscription(sub.id, project.id)}
                                            disabled={stoppingSubscriptionId === sub.id}
                                          >
                                            {stoppingSubscriptionId === sub.id ? (
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                              'Stop'
                                            )}
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleOpenEditForSubscription(sub)}
                                          title="Edit payment (due date, amount, recipient)"
                                        >
                                          <Pencil className="w-4 h-4 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleDeleteSubscription(sub.id, project.id)}
                                          disabled={deletingSubscriptionId === sub.id}
                                        >
                                          {deletingSubscriptionId === sub.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      )}

                      {/* Extension GitHub repo (super admin or elevated support agent) */}
                      {authorizationsFullUi && variant === 'authorizations' && (
                        <div className="mt-4 pt-4 border-t border-border/60">
                          <div className="p-3 border rounded-md bg-muted/30 space-y-3">

                            <h4 className="font-medium text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                              <GitBranch className="w-4 h-4 shrink-0" />
                              <Key className="w-4 h-4 shrink-0 text-muted-foreground" />
                              <span>Extension repo &amp; API integration</span>
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Repo used by <code className="text-xs">/api/extension/project/config</code> and{' '}
                              <code className="text-xs">/api/extension/project/scripts/:name</code> after entitlement + device checks.
                            </p>
                            {extensionSourceByProject[project.id] && (
                              <p className="text-xs font-mono">
                                Linked: {extensionSourceByProject[project.id]!.owner}/
                                {extensionSourceByProject[project.id]!.repo} @ {extensionSourceByProject[project.id]!.ref}
                              </p>
                            )}
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                              <Input
                                placeholder="https://github.com/owner/repo or .../tree/branch"
                                className="text-sm flex-1"
                                value={extensionUrlInputByProject[project.id] ?? ''}
                                onChange={(e) =>
                                  setExtensionUrlInputByProject((prev) => ({
                                    ...prev,
                                    [project.id]: e.target.value,
                                  }))
                                }
                              />
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  disabled={savingExtensionSourceProjectId === project.id}
                                  onClick={async () => {
                                    const url = (extensionUrlInputByProject[project.id] ?? '').trim();
                                    if (!url) {
                                      toast.error('Enter a GitHub URL or use Clear');
                                      return;
                                    }
                                    setSavingExtensionSourceProjectId(project.id);
                                    try {
                                      const res = await fetch(`/api/admin/projects/${project.id}/extension-source`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ githubRepoUrl: url }),
                                      });
                                      if (!res.ok) {
                                        const err = await res.json().catch(() => ({}));
                                        toast.error(err.error || 'Failed to save');
                                        return;
                                      }
                                      const data = await res.json();
                                      const ext = data.extensionSource as {
                                        owner: string;
                                        repo: string;
                                        ref: string;
                                        deploymentVisibleFrom?: string | null;
                                      };
                                      setExtensionSourceByProject((prev) => ({ ...prev, [project.id]: ext }));
                                      setDeploymentVisibleFromInputByProject((prev) => ({
                                        ...prev,
                                        [project.id]: ext.deploymentVisibleFrom ?? '',
                                      }));
                                      setExtensionUrlInputByProject((prev) => ({
                                        ...prev,
                                        [project.id]: `https://github.com/${ext.owner}/${ext.repo}/tree/${ext.ref}`,
                                      }));
                                      toast.success('Extension GitHub repo saved');
                                      const statusRes = await fetch(`/api/projects/${project.id}/github-status`, {
                                        cache: 'no-store',
                                      });
                                      if (statusRes.ok) {
                                        const statusData = await statusRes.json();
                                        setGithubStatusByProject((prev) => ({
                                          ...prev,
                                          [project.id]: statusData,
                                        }));
                                        if (statusData.commits?.length) {
                                          setSelectedRefByProject((prev) => ({
                                            ...prev,
                                            [project.id]: resolveExtensionRefSelectValue(
                                              statusData.currentRef ?? null,
                                              statusData.defaultBranch ?? 'main',
                                              statusData.commits
                                            ),
                                          }));
                                        }
                                      }
                                    } finally {
                                      setSavingExtensionSourceProjectId(null);
                                    }
                                  }}
                                >
                                  {savingExtensionSourceProjectId === project.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Save'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={savingExtensionSourceProjectId === project.id || !extensionSourceByProject[project.id]}
                                  onClick={async () => {
                                    if (!confirm('Remove linked GitHub repo for this project?')) return;
                                    setSavingExtensionSourceProjectId(project.id);
                                    try {
                                      const res = await fetch(`/api/admin/projects/${project.id}/extension-source`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ clear: true }),
                                      });
                                      if (!res.ok) {
                                        toast.error('Failed to clear');
                                        return;
                                      }
                                      setExtensionSourceByProject((prev) => ({ ...prev, [project.id]: null }));
                                      setExtensionUrlInputByProject((prev) => ({ ...prev, [project.id]: '' }));
                                      setDeploymentVisibleFromInputByProject((prev) => ({
                                        ...prev,
                                        [project.id]: '',
                                      }));
                                      setGithubStatusByProject((prev) => {
                                        const next = { ...prev };
                                        delete next[project.id];
                                        return next;
                                      });
                                      setSelectedRefByProject((prev) => {
                                        const next = { ...prev };
                                        delete next[project.id];
                                        return next;
                                      });
                                      toast.success('Extension GitHub repo cleared');
                                    } finally {
                                      setSavingExtensionSourceProjectId(null);
                                    }
                                  }}
                                >
                                  Clear
                                </Button>
                              </div>
                            </div>

                            {extensionSourceByProject[project.id] && (
                              <div className="mt-3 pt-2 border-t border-border/40 space-y-2">
                                <Label htmlFor={`deploy-from-${project.id}`} className="text-xs font-medium">
                                  Deployment visible from (UTC)
                                </Label>
                                <p className="text-[11px] text-muted-foreground">
                                  Company admins only see commits on or after this calendar day (UTC). Leave empty to
                                  show every commit in the list.
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Input
                                    id={`deploy-from-${project.id}`}
                                    type="date"
                                    className="h-8 text-sm w-[11rem]"
                                    value={deploymentVisibleFromInputByProject[project.id] ?? ''}
                                    onChange={(e) =>
                                      setDeploymentVisibleFromInputByProject((prev) => ({
                                        ...prev,
                                        [project.id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                    disabled={
                                      savingDeploymentDateProjectId === project.id ||
                                      (deploymentVisibleFromInputByProject[project.id] ?? '') ===
                                        (extensionSourceByProject[project.id]?.deploymentVisibleFrom ?? '')
                                    }
                                    onClick={async () => {
                                      setSavingDeploymentDateProjectId(project.id);
                                      try {
                                        const raw = (deploymentVisibleFromInputByProject[project.id] ?? '').trim();
                                        const res = await fetch(
                                          `/api/admin/projects/${project.id}/extension-source`,
                                          {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              deploymentVisibleFrom: raw === '' ? null : raw,
                                            }),
                                          }
                                        );
                                        if (!res.ok) {
                                          const err = await res.json().catch(() => ({}));
                                          toast.error(err.error || 'Failed to save deployment date');
                                          return;
                                        }
                                        const data = await res.json();
                                        const saved = data.deploymentVisibleFrom as string | null;
                                        setExtensionSourceByProject((prev) => {
                                          const cur = prev[project.id];
                                          if (!cur) return prev;
                                          return {
                                            ...prev,
                                            [project.id]: { ...cur, deploymentVisibleFrom: saved },
                                          };
                                        });
                                        setDeploymentVisibleFromInputByProject((prev) => ({
                                          ...prev,
                                          [project.id]: saved ?? '',
                                        }));
                                        toast.success('Deployment date saved');
                                        const statusRes = await fetch(`/api/projects/${project.id}/github-status`, {
                                          cache: 'no-store',
                                        });
                                        if (statusRes.ok) {
                                          const statusData = await statusRes.json();
                                          setGithubStatusByProject((prev) => ({
                                            ...prev,
                                            [project.id]: statusData,
                                          }));
                                          if (statusData.commits?.length) {
                                            setSelectedRefByProject((prev) => ({
                                              ...prev,
                                              [project.id]: resolveExtensionRefSelectValue(
                                                statusData.currentRef ?? null,
                                                statusData.defaultBranch ?? 'main',
                                                statusData.commits
                                              ),
                                            }));
                                          }
                                        }
                                      } finally {
                                        setSavingDeploymentDateProjectId(null);
                                      }
                                    }}
                                  >
                                    {savingDeploymentDateProjectId === project.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      'Save date'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {githubStatusByProject[project.id]?.hasGithubUrl && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {githubStatusByProject[project.id]?.deploymentVisibleFrom ? (
                                  <p className="text-[11px] text-muted-foreground w-full">
                                    <span className="text-amber-700 dark:text-amber-400 font-medium">Amber</span> in the
                                    list = commits before {githubStatusByProject[project.id]!.deploymentVisibleFrom}{' '}
                                    (UTC); you can still pin them.
                                  </p>
                                ) : null}
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  Software version:
                                </span>
                                {githubStatusByProject[project.id]?.commits?.length ? (
                                  <>
                                    {(() => {
                                      const gh = githubStatusByProject[project.id]!;
                                      const defaultBr = gh.defaultBranch ?? 'main';
                                      const commits = gh.commits ?? [];
                                      const selectValue =
                                        selectedRefByProject[project.id] ??
                                        resolveExtensionRefSelectValue(
                                          gh.currentRef ?? null,
                                          defaultBr,
                                          commits
                                        );
                                      const savedRef = gh.currentRef ?? '';
                                      const isDirty = Boolean(selectValue) && selectValue !== savedRef;

                                      return (
                                        <>
                                          <SoftwareVersionSelect
                                            projectId={project.id}
                                            defaultBranch={defaultBr}
                                            currentRef={gh.currentRef}
                                            commits={commits}
                                            hasMoreCommits={gh.hasMoreCommits ?? false}
                                            commitRawOffset={gh.commitRawOffset ?? commits.length}
                                            selectedRef={selectValue}
                                            onSelectedRefChange={(val) =>
                                              setSelectedRefByProject((prev) => ({ ...prev, [project.id]: val }))
                                            }
                                            onCommitsUpdate={(nextCommits, hasMore, rawOffset) =>
                                              setGithubStatusByProject((prev) => {
                                                const cur = prev[project.id];
                                                if (!cur) return prev;
                                                return {
                                                  ...prev,
                                                  [project.id]: {
                                                    ...cur,
                                                    commits: nextCommits,
                                                    hasMoreCommits: hasMore,
                                                    commitRawOffset: rawOffset,
                                                  },
                                                };
                                              })
                                            }
                                            disabled={refUpdating[project.id]}
                                            formatDate={formatDate}
                                          />
                                          {isDirty || refUpdating[project.id] ? (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs px-3"
                                              disabled={refUpdating[project.id]}
                                              onClick={() => handleSaveRef(project.id)}
                                            >
                                              {refUpdating[project.id] ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : (
                                                'Save'
                                              )}
                                            </Button>
                                          ) : null}
                                        </>
                                      );
                                    })()}
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Loading versions…</span>
                                )}
                              </div>
                            )}

                            <div className="mt-4 pt-3 border-t border-border/50 space-y-3">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">Project API key</p>
                                <div className="flex flex-wrap gap-2 items-center">
                                  {projectApiKeyReveal[project.id] !== undefined ? (
                                    <>
                                      <code className="text-xs bg-background px-2 py-1 rounded border break-all max-w-md">
                                        {projectApiKeyReveal[project.id] || '(not set)'}
                                      </code>
                                      {projectApiKeyReveal[project.id] && projectApiKeyReveal[project.id] !== '(not set)' && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => copyToClipboard(projectApiKeyReveal[project.id], `key-${project.id}`)}
                                        >
                                          {copiedKey === `key-${project.id}` ? (
                                            <ClipboardCheck className="w-3 h-3" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setProjectApiKeyReveal((prev) => {
                                            const p = { ...prev };
                                            delete p[project.id];
                                            return p;
                                          });
                                        }}
                                      >
                                        Hide
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={loadingApiKeyProjectId === project.id}
                                      onClick={async () => {
                                        setLoadingApiKeyProjectId(project.id);
                                        try {
                                          const res = await fetch(`/api/projects/${project.id}/api-key`);
                                          if (!res.ok) {
                                            toast.error('Failed to load API key');
                                            return;
                                          }
                                          const data = await res.json();
                                          setProjectApiKeyReveal((prev) => ({
                                            ...prev,
                                            [project.id]: data.apiKey || '(not set)',
                                          }));
                                          if (data.apiKey) toast.success('Key revealed. Use the copy button to copy.');
                                        } finally {
                                          setLoadingApiKeyProjectId(null);
                                        }
                                      }}
                                    >
                                      {loadingApiKeyProjectId === project.id ? (
                                        <>
                                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                          Loading…
                                        </>
                                      ) : (
                                        'Reveal key'
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={loadingApiKeyProjectId === project.id}
                                    onClick={async () => {
                                      if (!confirm('Regenerate API key? The previous key will stop working.')) return;
                                      setLoadingApiKeyProjectId(project.id);
                                      try {
                                        const res = await fetch(`/api/projects/${project.id}/api-key`, {
                                          method: 'POST',
                                        });
                                        if (!res.ok) {
                                          toast.error('Failed to regenerate');
                                          return;
                                        }
                                        const { apiKey } = await res.json();
                                        setProjectApiKeyReveal((prev) => ({ ...prev, [project.id]: apiKey }));
                                        toast.success('New key generated. Copy it now.');
                                      } finally {
                                        setLoadingApiKeyProjectId(null);
                                      }
                                    }}
                                  >
                                    {loadingApiKeyProjectId === project.id ? (
                                      <>
                                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                        Regenerating…
                                      </>
                                    ) : (
                                      'Regenerate'
                                    )}
                                  </Button>
                                </div>
                              </div>
                              {(() => {
                                const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                                const apiKeyVal =
                                  projectApiKeyReveal[project.id] && projectApiKeyReveal[project.id] !== '(not set)'
                                    ? projectApiKeyReveal[project.id]
                                    : '<YOUR_API_KEY>';

                                const entitlementSnippet = `// Check Entitlement — GET ${baseUrl}/api/entitlement
// Checks if the company's payments are current (and optionally if this device is active).
// Pass the project API key via header. Optional: "x-device-id" or ?deviceId= — must match an **active** auth device.
// Returns status "allowed", "warning" (with daysRemaining), or "denied".
//
// Response: { status, allowed, daysRemaining?, reason?, pendingFees, overdueSubscriptions, maxDaysOverdue }

const res = await fetch("${baseUrl}/api/entitlement", {
  headers: {
    "x-project-api-key": "${apiKeyVal}",
    // "x-device-id": "<same id you sent to request-device>",  // optional but recommended for per-machine checks
  },
});
const data = await res.json();
// data.status === "allowed"  → full access
// data.status === "warning"  → overdue, grace period active, data.daysRemaining = days left
// data.status === "denied"   → access should be blocked`;

                                const requestDeviceSnippet = `// Request Device Access — POST ${baseUrl}/api/entitlement/request-device
// Submits a request from an external site to add a new auth device for this project.
// The device is created with status "pending" and must be approved by a super admin
// in the admin panel before it becomes active.
//
// Body: { name: string (device description), deviceId?: string (optional unique ID) }
// Response: { message, device: { id, name, deviceId, status } }

const res = await fetch("${baseUrl}/api/entitlement/request-device", {
  method: "POST",
  headers: {
    "x-project-api-key": "${apiKeyVal}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "My Device",        // required — e.g. hostname, serial, or description
    deviceId: "unique-id-123" // optional — your own unique device identifier
  }),
});
const data = await res.json();`;

                                const authDevicesSnippet = `// List Auth Devices (project API key — no browser session)
// GET ${baseUrl}/api/entitlement/devices
// Headers: { "x-project-api-key": "${apiKeyVal}" }
// Response: { devices: Array<{ id, name, deviceId, status, createdAt, updatedAt }> }

const res = await fetch("${baseUrl}/api/entitlement/devices", {
  headers: { "x-project-api-key": "${apiKeyVal}" },
});
const { devices } = await res.json();

// Same devices via project id (API key must match this project):
// fetch("${baseUrl}/api/projects/${project.id}/auth-devices", { headers: { "x-project-api-key": "${apiKeyVal}" } })
//
// Admin browser (cookie session, no API key): GET ${baseUrl}/api/projects/${project.id}/auth-devices`;

                                const extensionProjectConfigSnippet = `// Extension config (project GitHub + device) — GET ${baseUrl}/api/extension/project/config?deviceId=<YOUR_DEVICE_ID>
// Requires: x-project-api-key, entitlement allowed or warning, active approved device with same deviceId,
// and super admin must link a GitHub repo for this project (admin → Authorizations).
//
// Response includes features: Record<string, boolean> (project defaults + this device's overrides).
//
// Admin device + latest GitHub: use x-project-api-key: "${apiKeyVal}=dev" (default-branch HEAD, not the pinned ref).
//
// Flow: GET /api/entitlement → POST /api/entitlement/request-device (include deviceId) → approval → then:

const res = await fetch("${baseUrl}/api/extension/project/config?deviceId=<YOUR_DEVICE_ID>", {
  headers: { "x-project-api-key": "${apiKeyVal}" },
});
const data = await res.json();
// data.features — project + device overrides, e.g. { myFeature: true }`;

                                return (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Copy integration snippets</p>
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(entitlementSnippet, `ent-${project.id}`)}
                                      >
                                        {copiedKey === `ent-${project.id}` ? (
                                          <ClipboardCheck className="w-3 h-3 mr-1.5" />
                                        ) : (
                                          <Copy className="w-3 h-3 mr-1.5" />
                                        )}
                                        {copiedKey === `ent-${project.id}` ? 'Copied!' : 'Check Entitlement'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(requestDeviceSnippet, `reqdev-${project.id}`)}
                                      >
                                        {copiedKey === `reqdev-${project.id}` ? (
                                          <ClipboardCheck className="w-3 h-3 mr-1.5" />
                                        ) : (
                                          <Copy className="w-3 h-3 mr-1.5" />
                                        )}
                                        {copiedKey === `reqdev-${project.id}` ? 'Copied!' : 'Request Device'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(authDevicesSnippet, `authdev-${project.id}`)}
                                      >
                                        {copiedKey === `authdev-${project.id}` ? (
                                          <ClipboardCheck className="w-3 h-3 mr-1.5" />
                                        ) : (
                                          <Copy className="w-3 h-3 mr-1.5" />
                                        )}
                                        {copiedKey === `authdev-${project.id}` ? 'Copied!' : 'List Devices'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          copyToClipboard(extensionProjectConfigSnippet, `extproj-${project.id}`)
                                        }
                                      >
                                        {copiedKey === `extproj-${project.id}` ? (
                                          <ClipboardCheck className="w-3 h-3 mr-1.5" />
                                        ) : (
                                          <Copy className="w-3 h-3 mr-1.5" />
                                        )}
                                        {copiedKey === `extproj-${project.id}` ? 'Copied!' : 'Extension config (project)'}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                          </div>
                        </div>
                      )}

                      {variant === 'authorizations' && (
                      <div className="mt-6 rounded-lg border-2 border-border/70 bg-muted/15 p-4 space-y-3">
                        <div>
                          <h4 className="font-medium text-base flex items-center gap-2">
                            <Smartphone className="w-5 h-5" />
                            Auth devices
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Approve pending requests, pause or resume, edit identifiers, or add a device from here.
                          </p>
                        </div>
                        <div className="space-y-2">
                          {(authDevicesByProject[project.id] || []).map((d) => (
                            <div
                              key={d.id}
                              className={`p-2 border rounded text-sm ${d.status === 'pending' ? 'border-border bg-muted/50' : ''}`}
                            >
                              {editingPaymentsAuthDeviceId === d.id ? (
                                <div className="space-y-2">
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs text-muted-foreground">Name</span>
                                      <Input
                                        value={editPaymentsAuthName}
                                        onChange={(e) => setEditPaymentsAuthName(e.target.value)}
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs text-muted-foreground">Device ID</span>
                                      <Input
                                        value={editPaymentsAuthExternalId}
                                        onChange={(e) => setEditPaymentsAuthExternalId(e.target.value)}
                                        className="text-sm font-mono"
                                        placeholder="Empty = new random ID"
                                      />
                                    </div>
                                  </div>
                                  {isSuperAdmin ? (
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                      <Checkbox
                                        checked={editPaymentsAuthIsAdmin}
                                        onCheckedChange={(v) => setEditPaymentsAuthIsAdmin(v === true)}
                                      />
                                      Admin device (hidden from company admins, not counted toward quota, bypasses block/payment rules; use API key suffix =dev for latest GitHub)
                                    </label>
                                  ) : null}
                                  <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Device features</span>
                                    <p className="text-xs text-muted-foreground">
                                      Overrides project defaults for this device on auth.
                                    </p>
                                    <AppFeaturesEditor
                                      dense
                                      value={editPaymentsAuthFeatures}
                                      disabled={loadingAuthDeviceId === `edit-${d.id}`}
                                      onChange={setEditPaymentsAuthFeatures}
                                    />
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      size="sm"
                                      disabled={loadingAuthDeviceId === `edit-${d.id}`}
                                      onClick={async () => {
                                        const name = editPaymentsAuthName.trim();
                                        if (!name) {
                                          toast.error('Name is required');
                                          return;
                                        }
                                        setLoadingAuthDeviceId(`edit-${d.id}`);
                                        try {
                                          const res = await fetch(`/api/projects/${project.id}/auth-devices/${d.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              name,
                                              deviceId: editPaymentsAuthExternalId.trim(),
                                              features:
                                                Object.keys(editPaymentsAuthFeatures).length > 0
                                                  ? editPaymentsAuthFeatures
                                                  : null,
                                              ...(isSuperAdmin ? { isAdminDevice: editPaymentsAuthIsAdmin } : {}),
                                            }),
                                          });
                                          const data = await res.json().catch(() => ({}));
                                          if (!res.ok) {
                                            toast.error(data.error || 'Failed to save');
                                            return;
                                          }
                                          const updated = data.device as
                                            | {
                                                name: string;
                                                deviceId: string;
                                                status: string;
                                                isAdminDevice?: boolean;
                                                features?: AppFeatures | null;
                                              }
                                            | undefined;
                                          if (updated) {
                                            setAuthDevicesByProject((prev) => ({
                                              ...prev,
                                              [project.id]: (prev[project.id] || []).map((dev) =>
                                                dev.id === d.id ? { ...dev, ...updated } : dev
                                              ),
                                            }));
                                          }
                                          setEditingPaymentsAuthDeviceId(null);
                                          setEditPaymentsAuthName('');
                                          setEditPaymentsAuthExternalId('');
                                          setEditPaymentsAuthIsAdmin(false);
                                          setEditPaymentsAuthFeatures({});
                                          toast.success('Device updated');
                                        } finally {
                                          setLoadingAuthDeviceId(null);
                                        }
                                      }}
                                    >
                                      {loadingAuthDeviceId === `edit-${d.id}` ? (
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                      )}
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      type="button"
                                      onClick={() => {
                                        setEditingPaymentsAuthDeviceId(null);
                                        setEditPaymentsAuthName('');
                                        setEditPaymentsAuthExternalId('');
                                        setEditPaymentsAuthIsAdmin(false);
                                        setEditPaymentsAuthFeatures({});
                                      }}
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-medium">{d.name}</span>
                                      <Badge
                                        variant={
                                          d.status === 'active' ? 'default' : d.status === 'pending' ? 'outline' : 'secondary'
                                        }
                                        className={d.status === 'pending' ? 'border-muted-foreground text-muted-foreground' : ''}
                                      >
                                        {d.status}
                                      </Badge>
                                      {d.isAdminDevice ? (
                                        <Badge variant="secondary" className="text-xs">
                                          Admin
                                        </Badge>
                                      ) : null}
                                    </div>
                                    {d.deviceId ? (
                                      <p className="text-xs text-muted-foreground font-mono break-all">{d.deviceId}</p>
                                    ) : null}
                                    {d.features && Object.keys(d.features).length > 0 ? (
                                      <p className="text-xs text-muted-foreground">
                                        Features:{' '}
                                        {Object.entries(d.features)
                                          .map(([k, v]) => `${k}=${v ? 'on' : 'off'}`)
                                          .join(', ')}
                                      </p>
                                    ) : null}
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={loadingAuthDeviceId !== null}
                                      title="Edit name, device ID, and features"
                                      onClick={() => {
                                        setEditingPaymentsAuthDeviceId(d.id);
                                        setEditPaymentsAuthName(d.name);
                                        setEditPaymentsAuthExternalId(d.deviceId || '');
                                        setEditPaymentsAuthIsAdmin(Boolean(d.isAdminDevice));
                                        setEditPaymentsAuthFeatures(d.features ? { ...d.features } : {});
                                      }}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    {d.status === 'pending' && isSuperAdmin && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-primary border-primary hover:bg-primary/10"
                                        disabled={loadingAuthDeviceId === d.id}
                                        onClick={async () => {
                                          setLoadingAuthDeviceId(d.id);
                                          try {
                                            const res = await fetch(`/api/projects/${project.id}/auth-devices/${d.id}`, {
                                              method: 'PATCH',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ status: 'active' }),
                                            });
                                            if (res.ok) {
                                              const data = await res.json().catch(() => ({}));
                                              const updated = data.device as { name: string; deviceId: string; status: string } | undefined;
                                              setAuthDevicesByProject((prev) => ({
                                                ...prev,
                                                [project.id]: (prev[project.id] || []).map((dev) =>
                                                  dev.id === d.id
                                                    ? updated
                                                      ? { ...dev, ...updated }
                                                      : { ...dev, status: 'active' }
                                                    : dev
                                                ),
                                              }));
                                              toast.success('Device approved');
                                            } else {
                                              const err = await res.json().catch(() => ({}));
                                              toast.error(err.error || 'Failed to approve');
                                            }
                                          } finally {
                                            setLoadingAuthDeviceId(null);
                                          }
                                        }}
                                      >
                                        {loadingAuthDeviceId === d.id ? (
                                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        ) : (
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                        )}
                                        Approve
                                      </Button>
                                    )}
                                    {d.status !== 'pending' && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={loadingAuthDeviceId === d.id}
                                        onClick={async () => {
                                          setLoadingAuthDeviceId(d.id);
                                          try {
                                            const next = d.status === 'active' ? 'paused' : 'active';
                                            const res = await fetch(`/api/projects/${project.id}/auth-devices/${d.id}`, {
                                              method: 'PATCH',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ status: next }),
                                            });
                                            if (res.ok) {
                                              const data = await res.json().catch(() => ({}));
                                              const updated = data.device as { name: string; deviceId: string; status: string } | undefined;
                                              setAuthDevicesByProject((prev) => ({
                                                ...prev,
                                                [project.id]: (prev[project.id] || []).map((dev) =>
                                                  dev.id === d.id
                                                    ? updated
                                                      ? { ...dev, ...updated }
                                                      : { ...dev, status: next }
                                                    : dev
                                                ),
                                              }));
                                              toast.success(d.status === 'active' ? 'Device paused' : 'Device resumed');
                                            } else toast.error('Failed to update');
                                          } finally {
                                            setLoadingAuthDeviceId(null);
                                          }
                                        }}
                                      >
                                        {loadingAuthDeviceId === d.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : d.status === 'active' ? (
                                          <Pause className="w-3 h-3" />
                                        ) : (
                                          <Play className="w-3 h-3" />
                                        )}
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-destructive"
                                      disabled={loadingAuthDeviceId === d.id}
                                      onClick={async () => {
                                        if (!confirm('Remove this device?')) return;
                                        setLoadingAuthDeviceId(d.id);
                                        try {
                                          const res = await fetch(`/api/projects/${project.id}/auth-devices/${d.id}`, {
                                            method: 'DELETE',
                                          });
                                          if (res.ok) {
                                            setAuthDevicesByProject((prev) => ({
                                              ...prev,
                                              [project.id]: (prev[project.id] || []).filter((dev) => dev.id !== d.id),
                                            }));
                                            toast.success('Device removed');
                                          } else toast.error('Failed to remove');
                                        } finally {
                                          setLoadingAuthDeviceId(null);
                                        }
                                      }}
                                    >
                                      {loadingAuthDeviceId === d.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3 h-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="flex flex-col gap-3">
                          <div className="flex gap-2 items-center flex-wrap">
                            <Input
                              placeholder="Device name"
                              value={addingDeviceProjectId === project.id ? newDeviceName : ''}
                              onChange={(e) => { setNewDeviceName(e.target.value); setAddingDeviceProjectId(project.id); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(`add-device-${project.id}`)?.click(); } }}
                              className="max-w-xs"
                            />
                            <Button
                              id={`add-device-${project.id}`}
                              size="sm"
                              variant="outline"
                              disabled={loadingAuthDeviceId === `add-${project.id}`}
                              onClick={async () => {
                                const name = (addingDeviceProjectId === project.id ? newDeviceName : '').trim() || 'New device';
                                const featuresForCreate =
                                  addingDeviceProjectId === project.id && Object.keys(newDeviceFeatures).length > 0
                                    ? newDeviceFeatures
                                    : undefined;
                                setLoadingAuthDeviceId(`add-${project.id}`);
                                try {
                                  const res = await fetch(`/api/projects/${project.id}/auth-devices`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      name,
                                      ...(featuresForCreate ? { features: featuresForCreate } : {}),
                                      ...(isSuperAdmin && newDeviceIsAdmin ? { isAdminDevice: true } : {}),
                                    }),
                                  });
                                  if (!res.ok) {
                                    const err = await res.json().catch(() => ({}));
                                    toast.error(err.error || 'Failed to add device');
                                    return;
                                  }
                                  const { device } = await res.json();
                                  setAuthDevicesByProject(prev => ({ ...prev, [project.id]: [device, ...(prev[project.id] || [])] }));
                                  setNewDeviceName('');
                                  setNewDeviceIsAdmin(false);
                                  setNewDeviceFeatures({});
                                  setAddingDeviceProjectId(null);
                                  toast.success('Device added');
                                } finally {
                                  setLoadingAuthDeviceId(null);
                                }
                              }}
                            >
                              {loadingAuthDeviceId === `add-${project.id}` ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4 mr-1" />
                              )}
                              Add device
                            </Button>
                          </div>
                          <div className="rounded-md border border-border/60 bg-background/50 p-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Device features (optional)</p>
                            <AppFeaturesEditor
                              dense
                              value={addingDeviceProjectId === project.id ? newDeviceFeatures : {}}
                              disabled={loadingAuthDeviceId === `add-${project.id}`}
                              onChange={(next) => {
                                setAddingDeviceProjectId(project.id);
                                setNewDeviceFeatures(next);
                              }}
                            />
                          </div>
                          {isSuperAdmin ? (
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={addingDeviceProjectId === project.id && newDeviceIsAdmin}
                                onCheckedChange={(v) => {
                                  setAddingDeviceProjectId(project.id);
                                  setNewDeviceIsAdmin(v === true);
                                }}
                              />
                              Admin device (hidden from company admins, not counted toward quota, bypasses block/payment rules; use API key suffix =dev for latest GitHub)
                            </label>
                          ) : null}
                          </div>
                        </div>
                      </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })
      )}

      {/* Create Fee Dialog */}
      <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create One-Time Fee</DialogTitle>
            <DialogDescription>
              Create a one-time fee for the selected project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fee Name</Label>
              <Input
                value={feeName}
                onChange={(e) => setFeeName(e.target.value)}
                placeholder="e.g. Setup Fee, License Fee"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeeDialog(false)} disabled={creatingFee}>Cancel</Button>
            <Button onClick={handleCreateFee} disabled={creatingFee}>
              {creatingFee ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create Fee'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Subscription Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Subscription</DialogTitle>
            <DialogDescription>
              Create a recurring subscription for the selected project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subscription Name</Label>
              <Input
                value={subscriptionName}
                onChange={(e) => setSubscriptionName(e.target.value)}
                placeholder="e.g. Monthly License, Support Subscription"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={subscriptionAmount}
                onChange={(e) => setSubscriptionAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Billing Interval</Label>
              <Select value={subscriptionBillingInterval} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => { setSubscriptionBillingInterval(value); setSubscriptionBillingDayOfMonth(''); setSubscriptionBillingDayOfWeek(''); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {subscriptionBillingInterval === 'monthly' && (
              <div className="space-y-2">
                <Label>Day of month (1–31, optional)</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={subscriptionBillingDayOfMonth === '' ? '' : subscriptionBillingDayOfMonth}
                  onChange={(e) => { const v = e.target.value; setSubscriptionBillingDayOfMonth(v === '' ? '' : Math.min(31, Math.max(1, parseInt(v, 10) || 1))); }}
                  placeholder="e.g. 16 for 16th"
                />
              </div>
            )}
            {subscriptionBillingInterval === 'weekly' && (
              <div className="space-y-2">
                <Label>Day of week (optional)</Label>
                <Select value={subscriptionBillingDayOfWeek === '' ? 'any' : String(subscriptionBillingDayOfWeek)} onValueChange={(v) => setSubscriptionBillingDayOfWeek(v === 'any' ? '' : Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)} disabled={creatingSubscription}>Cancel</Button>
            <Button onClick={handleCreateSubscription} disabled={creatingSubscription}>
              {creatingSubscription ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={handlePaymentModalClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Complete your payment in the form below
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full" style={{ height: '80vh' }}>
            {paymentUrl && (
              <iframe
                src={paymentUrl}
                className="w-full h-full border-0"
                title="Payment Form"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-downloads allow-modals allow-pointer-lock allow-presentation"
                allow="accelerometer; autoplay; clipboard-write; clipboard-read; encrypted-media; gyroscope; picture-in-picture; fullscreen; microphone; camera; geolocation; payment; storage-access-by-user-activation"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Billing History</DialogTitle>
            <DialogDescription>
              Transaction history for this {transactionType === 'fee' ? 'fee' : 'subscription'}
            </DialogDescription>
          </DialogHeader>
          {loadingTransactionsDialog ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="font-medium text-foreground">Loading billing history…</p>
              <p className="text-sm text-muted-foreground">Please wait…</p>
            </div>
          ) : transactionId && (
            <div className="space-y-2">
              {(transactionType === 'fee' ? feeTransactions[transactionId] : subscriptionTransactions[transactionId])?.length === 0 ? (
                <p className="text-muted-foreground">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {(transactionType === 'fee' ? feeTransactions[transactionId] : subscriptionTransactions[transactionId])?.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">${transaction.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.transactionDate).toLocaleDateString()}
                          {transaction.invoiceNumber && ` - Invoice #${transaction.invoiceNumber}`}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewReceipt(transaction)}
                        disabled={!transaction.paymentRequestId}
                        title="View receipt in Payments tab"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        View Receipt
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>
              Receipt details for this payment
            </DialogDescription>
          </DialogHeader>
          {loadingReceipt ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="font-medium text-foreground">Loading receipt…</p>
              <p className="text-sm text-muted-foreground">Please wait…</p>
            </div>
          ) : receiptData ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Invoice Number</Label>
                  <p className="font-semibold">{receiptData.invoiceNumber || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p>{new Date(receiptData.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Bill To</Label>
                <p className="font-medium">{receiptData.recipientName}</p>
                <p className="text-sm text-muted-foreground">{receiptData.recipientEmail}</p>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground">Payment Details</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Service Amount:</span>
                    <span className="font-medium">${receiptData.amount.toFixed(2)}</span>
                  </div>
                  {receiptData.fee > 0 && (
                    <div className="flex justify-between">
                      <span>Processing Fee (3%):</span>
                      <span className="font-medium">${receiptData.fee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                    <span>Total Paid:</span>
                    <span>${receiptData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{paymentRailDisplayLabel(receiptData.paymentMethod)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Type</Label>
                  <p className="capitalize">
                    {receiptData.paymentType === 'one_time' ? 'One-Time' : 
                     receiptData.paymentType === 'monthly' ? 'Monthly' : 
                     'Interval Billing'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No receipt data available</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReceiptDialog(false);
              setReceiptData(null);
              setReceiptPaymentId(null);
              setReceiptPaymentIntentId(undefined);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit payment request (super admin only) */}
      <Dialog open={showEditPaymentDialog} onOpenChange={(open) => { if (!open) { setShowEditPaymentDialog(false); setEditingPaymentRequestId(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment Request</DialogTitle>
            <DialogDescription>Change amount, due date, or recipient. Super admin only.</DialogDescription>
          </DialogHeader>
          {loadingEditPayment ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">{loadingEditMessage}</p>
              <p className="text-xs text-muted-foreground">Please wait…</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Recipient name</Label>
                <Input
                  value={editPaymentForm.recipientName}
                  onChange={(e) => setEditPaymentForm((f) => ({ ...f, recipientName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Recipient email</Label>
                <Input
                  type="email"
                  value={editPaymentForm.recipientEmail}
                  onChange={(e) => setEditPaymentForm((f) => ({ ...f, recipientEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPaymentForm.amount}
                  onChange={(e) => setEditPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Due date (optional)</Label>
                <Input
                  type="date"
                  value={editPaymentForm.nextBillingDate}
                  onChange={(e) => setEditPaymentForm((f) => ({ ...f, nextBillingDate: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Leave empty for immediate / next billing.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditPaymentDialog(false); setEditingPaymentRequestId(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditPayment} disabled={savingEditPayment || loadingEditPayment}>
              {savingEditPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

