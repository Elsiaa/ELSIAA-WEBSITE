"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Building2, Users, FolderOpen, LogOut, RefreshCw, FileSignature, Copy, Mail, DollarSign, Calendar, Maximize2, CreditCard, FolderArchive, ShieldCheck, Layers, UserCircle, Activity, LifeBuoy, UserCog, ScrollText } from "lucide-react";
import { signOutAndHardRedirect } from "@/lib/auth-sign-out-client";
import { toast } from "sonner";
import CompaniesManagement from "@/components/admin/companies-management";
import UsersManagementNew from "@/components/admin/users-management-new";
import ProjectsManagementNew from "@/components/admin/projects-management-new";
import EmailSender from "@/components/admin/email-sender";
import EmailHistory from "@/components/admin/email-history";
import PaymentsManagementNew from "@/components/admin/payments-management";
import PaymentsLicensing from "@/components/admin/payments-licensing";
import BillingManagement from "@/components/admin/billing-management";
import PaymentMethodsManagement from "@/components/admin/payment-methods-management";
import CompanyPaymentsAttach from "@/components/admin/company-payments-attach";
import CompanyBillingPayments from "@/components/admin/company-billing-payments";
import CompanyAuthorizedDevices from "@/components/admin/company-authorized-devices";
import CompanyFileStorage from "@/components/admin/company-file-storage";
import SupportAgentsManagement from "@/components/admin/support-agents-management";
import ProjectProgramLogs from "@/components/admin/project-program-logs";
import SupportDesk from "@/components/support/support-desk";
import { poelLogoFiles } from "@/lib/poel-theme";
import { companyUserHasModule } from "@/lib/company-user-modules";
import type { Company, User, UserWithCompany } from "@/types/company";

// Email tab component to manage shared state
function EmailTabContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEmailSent = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <EmailSender onEmailSent={handleEmailSent} />
      <EmailHistory refreshTrigger={refreshTrigger} />
    </div>
  );
}

interface Project {
  id: string;
  companyId: string;
  title: string;
  url: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
}

type TabType = "companies" | "users" | "projects" | "signatures" | "email" | "billing-payments" | "payment-methods" | "company-payments" | "payments" | "billing" | "payments-licensing" | "authorizations" | "meetings" | "company-files" | "support" | "support-agents" | "logs";

interface AdminClientNewProps {
  companies: (Company & { stats?: { users: number; projects: number; meetings: number } })[];
  initialUsers: UserWithCompany[];
  initialProjects: { [companyId: string]: Project[] } | Project[];
  currentUser: User | null;
  userEmail: string;
  isSuperAdmin: boolean;
  isSupportAgent?: boolean;
  supportAgentAccess?: {
    canSupport: boolean;
    canAuthorizations: boolean;
    canProgramLogs: boolean;
    canFiles: boolean;
    supportCompanyIds: string[];
    authorizationsCompanyIds: string[];
    programLogsCompanyIds: string[];
    filesCompanyIds: string[];
  } | null;
  initialTab?: TabType;
}

type SuperAdminTabGroup = "structure" | "personal" | "usage" | "support" | "logs";

const SUPER_ADMIN_STRUCTURE_TABS = new Set<TabType>(["companies", "users", "projects", "support-agents"]);
const SUPER_ADMIN_PERSONAL_TABS = new Set<TabType>(["email", "meetings"]);
const SUPER_ADMIN_SUPPORT_TABS = new Set<TabType>(["support"]);
const SUPER_ADMIN_LOGS_TABS = new Set<TabType>(["logs"]);

function superAdminTabGroup(tab: TabType): SuperAdminTabGroup {
  if (SUPER_ADMIN_STRUCTURE_TABS.has(tab)) return "structure";
  if (SUPER_ADMIN_PERSONAL_TABS.has(tab)) return "personal";
  if (SUPER_ADMIN_LOGS_TABS.has(tab)) return "logs";
  if (SUPER_ADMIN_SUPPORT_TABS.has(tab)) return "support";
  return "usage";
}

interface SignatureRequest {
  id: string;
  title: string;
  status: "draft" | "sent" | "completed";
  public_token: string;
  created_at: string;
  updated_at: string;
}

export default function AdminClientNew({
  companies,
  initialUsers,
  initialProjects,
  currentUser,
  userEmail,
  isSuperAdmin,
  isSupportAgent = false,
  supportAgentAccess = null,
  initialTab = "authorizations",
}: AdminClientNewProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingSignatureRequest, setCreatingSignatureRequest] = useState(false);
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [loadingSignatureRequests, setLoadingSignatureRequests] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [requestSignatures, setRequestSignatures] = useState<Record<string, { signed_pdf_url: string | null }[]>>({});
  const [copyingLinkId, setCopyingLinkId] = useState<string | null>(null);

  // Refresh all data by reloading the page
  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  // Callback for when data changes (create/edit operations)
  const handleDataChange = () => {
    handleRefresh();
  };

  // Convert projects to flat array with company info
  const projectsArray: Project[] = Array.isArray(initialProjects)
    ? initialProjects
    : Object.entries(initialProjects).flatMap(([companyId, projects]) =>
      projects.map((project) => ({
        ...project,
        company: companies.find((c) => c.id === companyId),
      }))
    );

  const supportDeskCompanies =
    isSupportAgent && supportAgentAccess
      ? companies.filter((c) => supportAgentAccess.supportCompanyIds.includes(c.id))
      : companies;

  const authorizationsCompanies =
    isSupportAgent && supportAgentAccess
      ? companies.filter((c) => supportAgentAccess.authorizationsCompanyIds.includes(c.id))
      : companies;

  const authorizationsProjects =
    isSupportAgent && supportAgentAccess
      ? projectsArray.filter((p) => supportAgentAccess.authorizationsCompanyIds.includes(p.companyId))
      : projectsArray;

  const programLogsCompanies =
    isSupportAgent && supportAgentAccess
      ? companies.filter((c) => supportAgentAccess.programLogsCompanyIds.includes(c.id))
      : companies;

  const programLogsProjects =
    isSupportAgent && supportAgentAccess
      ? projectsArray.filter((p) => supportAgentAccess.programLogsCompanyIds.includes(p.companyId))
      : projectsArray;

  const supportAgentAuthorizationsElevated =
    Boolean(isSupportAgent && supportAgentAccess?.canAuthorizations);

  /** Companies where this agent has the Files grant (Support agents screen) — picker matches that permission only. */
  const supportAgentFilesGrantCompanies =
    isSupportAgent && supportAgentAccess
      ? companies.filter((c) => supportAgentAccess.filesCompanyIds.includes(c.id))
      : [];

  const supportAgentCompanyFilesMode = Boolean(
    isSupportAgent && supportAgentAccess?.canFiles && supportAgentFilesGrantCompanies.length > 0
  );

  const isCompanyAdminUser =
    Boolean(currentUser?.company_id) && currentUser?.role === "admin";

  const companyCanAuthorizations =
    Boolean(currentUser?.company_id) && companyUserHasModule(currentUser, "authorizations");
  const companyCanFiles =
    Boolean(currentUser?.company_id) && companyUserHasModule(currentUser, "files");
  const companyCanLogs =
    Boolean(currentUser?.company_id) && companyUserHasModule(currentUser, "program_logs");
  const companyCanSupport =
    Boolean(currentUser?.company_id) && companyUserHasModule(currentUser, "support");

  const showFilesTabForUser =
    isSuperAdmin ||
    (isSupportAgent ? Boolean(supportAgentAccess?.canFiles) : companyCanFiles);

  // Load existing signature requests when signatures tab is active
  useEffect(() => {
    if (!isSuperAdmin || activeTab !== "signatures") return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoadingSignatureRequests(true);
        const res = await fetch("/api/pdf-signatures/requests", { cache: "no-store" });
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (!cancelled && Array.isArray(data.requests)) {
          setSignatureRequests(data.requests);
          
          // Fetch signatures for each request
          const signaturesMap: Record<string, { signed_pdf_url: string | null }[]> = {};
          await Promise.all(
            data.requests.map(async (req: SignatureRequest) => {
              try {
                const sigRes = await fetch(`/api/pdf-signatures/requests/${req.id}/signatures`, {
                  cache: "no-store",
                });
                if (sigRes.ok && !cancelled) {
                  const sigData = await sigRes.json();
                  signaturesMap[req.id] = Array.isArray(sigData.signatures) 
                    ? sigData.signatures 
                    : [];
                }
              } catch (err) {
                console.error(`Error loading signatures for request ${req.id}:`, err);
                signaturesMap[req.id] = [];
              }
            })
          );
          if (!cancelled) {
            setRequestSignatures(signaturesMap);
          }
        }
      } catch (err) {
        console.error("Error loading signature requests:", err);
      } finally {
        if (!cancelled) {
          setLoadingSignatureRequests(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, isSuperAdmin]);

  const superAdminGroup = isSuperAdmin ? superAdminTabGroup(activeTab) : null;

  const tabButtonClass = (isActive: boolean) =>
    `flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
      isActive ? "border-flame text-flame" : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="min-h-screen">
      <div className="mb-6 flex w-full justify-center">
        <Image
          src={poelLogoFiles.full}
          alt="ELSIAA"
          width={280}
          height={72}
          priority
          className="h-16 w-auto sm:h-20 md:h-[5.5rem]"
        />
      </div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              {isSuperAdmin ? "Super Admin" : isSupportAgent ? "Support agent" : "Company Admin"} — {userEmail}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/80 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
              title="Refresh all data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-secondary/80 hover:bg-secondary rounded-lg transition-colors"
              onClick={() => void signOutAndHardRedirect("/")}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/50 mb-8">
        {isSupportAgent && supportAgentAccess ? (
          <div className="flex flex-wrap gap-1 sm:gap-4">
            {supportAgentAccess.canAuthorizations && (
              <button
                type="button"
                onClick={() => setActiveTab("authorizations")}
                className={tabButtonClass(activeTab === "authorizations")}
              >
                <ShieldCheck className="w-5 h-5 shrink-0" />
                Authorizations
              </button>
            )}
            {supportAgentAccess.canSupport && (
              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className={tabButtonClass(activeTab === "support")}
              >
                <LifeBuoy className="w-5 h-5 shrink-0" />
                Support
              </button>
            )}
            {supportAgentAccess.canProgramLogs && (
              <button
                type="button"
                onClick={() => setActiveTab("logs")}
                className={tabButtonClass(activeTab === "logs")}
              >
                <ScrollText className="w-5 h-5 shrink-0" />
                Logs
              </button>
            )}
            {supportAgentAccess.canFiles && (
              <button
                type="button"
                onClick={() => setActiveTab("company-files")}
                className={tabButtonClass(activeTab === "company-files")}
              >
                <FolderArchive className="w-5 h-5 shrink-0" />
                Files
              </button>
            )}
          </div>
        ) : isSuperAdmin ? (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1 sm:gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("authorizations")}
                className={tabButtonClass(superAdminGroup === "usage")}
              >
                <Activity className="w-5 h-5 shrink-0" />
                Usage
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("companies")}
                className={tabButtonClass(superAdminGroup === "structure")}
              >
                <Layers className="w-5 h-5 shrink-0" />
                Structure
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("email")}
                className={tabButtonClass(superAdminGroup === "personal")}
              >
                <UserCircle className="w-5 h-5 shrink-0" />
                Personal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("logs")}
                className={tabButtonClass(superAdminGroup === "logs")}
              >
                <ScrollText className="w-5 h-5 shrink-0" />
                Logs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className={tabButtonClass(superAdminGroup === "support")}
              >
                <LifeBuoy className="w-5 h-5 shrink-0" />
                Support
              </button>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-3 border-l-2 border-border/50 pl-3 ml-1 min-h-[3rem] items-end">
              {superAdminGroup === "structure" && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab("companies")}
                    className={tabButtonClass(activeTab === "companies")}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    Companies
                    <span className="px-2 py-0.5 bg-secondary/60 rounded text-xs">
                      {companies.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    className={tabButtonClass(activeTab === "users")}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    Users
                    <span className="px-2 py-0.5 bg-secondary/60 rounded text-xs">
                      {initialUsers.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("projects")}
                    className={tabButtonClass(activeTab === "projects")}
                  >
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    Projects
                    <span className="px-2 py-0.5 bg-secondary/60 rounded text-xs">
                      {projectsArray.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("support-agents")}
                    className={tabButtonClass(activeTab === "support-agents")}
                  >
                    <UserCog className="w-4 h-4 shrink-0" />
                    Support agents
                  </button>
                </>
              )}
              {superAdminGroup === "personal" && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab("email")}
                    className={tabButtonClass(activeTab === "email")}
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("meetings")}
                    className={tabButtonClass(activeTab === "meetings")}
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    Calendar
                  </button>
                </>
              )}
              {superAdminGroup === "support" && (
                <p className="py-2 pl-1 text-sm text-muted-foreground">
                  Company tickets, participants, and live updates.
                </p>
              )}
              {superAdminGroup === "logs" && (
                <p className="py-2 pl-1 text-sm text-muted-foreground">
                  Webhook ingest and program output by company and project.
                </p>
              )}
              {superAdminGroup === "usage" && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab("authorizations")}
                    className={tabButtonClass(activeTab === "authorizations")}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    Authorizations
                  </button>
                  {showFilesTabForUser ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab("company-files")}
                      className={tabButtonClass(activeTab === "company-files")}
                    >
                      <FolderArchive className="w-4 h-4 shrink-0" />
                      Files
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signatures")}
                    className={tabButtonClass(activeTab === "signatures")}
                  >
                    <FileSignature className="w-4 h-4 shrink-0" />
                    Signatures
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("billing")}
                    className={tabButtonClass(activeTab === "billing")}
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("payments")}
                    className={tabButtonClass(activeTab === "payments")}
                  >
                    <DollarSign className="w-4 h-4 shrink-0" />
                    Payments
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("payments-licensing")}
                    className={tabButtonClass(activeTab === "payments-licensing")}
                  >
                    <DollarSign className="w-4 h-4 shrink-0" />
                    Subscriptions
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {companyCanAuthorizations ? (
              <button
                type="button"
                onClick={() => setActiveTab("authorizations")}
                className={tabButtonClass(activeTab === "authorizations")}
              >
                <ShieldCheck className="w-5 h-5" />
                Authorizations
              </button>
            ) : null}
            {showFilesTabForUser ? (
              <button
                type="button"
                onClick={() => setActiveTab("company-files")}
                className={tabButtonClass(activeTab === "company-files")}
              >
                <FolderArchive className="w-5 h-5" />
                Files
              </button>
            ) : null}
            {isCompanyAdminUser ? (
              <button
                type="button"
                onClick={() => setActiveTab("billing-payments")}
                className={tabButtonClass(activeTab === "billing-payments")}
              >
                <CreditCard className="w-5 h-5" />
                Billing & Payments
              </button>
            ) : null}
            {isCompanyAdminUser ? (
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={tabButtonClass(activeTab === "users")}
              >
                <Users className="w-5 h-5" />
                Users
                <span className="px-2 py-0.5 bg-secondary/60 rounded text-xs">
                  {initialUsers.length}
                </span>
              </button>
            ) : null}
            {companyCanLogs ? (
              <button
                type="button"
                onClick={() => setActiveTab("logs")}
                className={tabButtonClass(activeTab === "logs")}
              >
                <ScrollText className="w-5 h-5" />
                Logs
              </button>
            ) : null}
            {companyCanSupport ? (
              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className={tabButtonClass(activeTab === "support")}
              >
                <LifeBuoy className="w-5 h-5" />
                Support
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="pb-12">
        {activeTab === "companies" && isSuperAdmin && (
          <CompaniesManagement 
            initialCompanies={companies} 
            initialUsers={initialUsers}
            initialProjects={projectsArray}
            currentUser={currentUser}
            onDataChange={handleDataChange} 
          />
        )}

        {activeTab === "users" && (isSuperAdmin || isCompanyAdminUser) && (
          <UsersManagementNew
            initialUsers={initialUsers}
            companies={companies}
            isSuperAdmin={isSuperAdmin}
            currentUser={currentUser}
            onDataChange={handleDataChange}
          />
        )}

        {activeTab === "support" &&
          (isSuperAdmin ||
            (isSupportAgent && Boolean(supportAgentAccess?.canSupport)) ||
            companyCanSupport) && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Support tickets</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tickets support long replies and large attachment previews. Add company users as participants;
                everyone on the ticket and super-admins get email on new messages (super-admins are not copied on their
                own sends).
              </p>
            </div>
            <SupportDesk
              mode="admin"
              isSuperAdmin={isSuperAdmin}
              supportAgentMode={
                Boolean(isSupportAgent && (supportAgentAccess?.supportCompanyIds.length ?? 0) > 1)
              }
              companies={supportDeskCompanies}
              allUsers={initialUsers}
              fixedCompanyId={
                isSupportAgent && supportAgentAccess?.supportCompanyIds.length === 1
                  ? supportAgentAccess.supportCompanyIds[0]
                  : currentUser?.company_id ?? null
              }
            />
          </div>
        )}

        {activeTab === "company-files" && showFilesTabForUser && (
          <CompanyFileStorage
            companies={supportAgentCompanyFilesMode ? supportAgentFilesGrantCompanies : companies}
            currentUser={currentUser}
            isSuperAdmin={isSuperAdmin}
            supportAgentCompanyFiles={supportAgentCompanyFilesMode}
          />
        )}

        {activeTab === "projects" && isSuperAdmin && (
          <ProjectsManagementNew
            initialProjects={projectsArray}
            companies={companies}
            isSuperAdmin={isSuperAdmin}
            currentCompanyId={currentUser?.company_id || null}
            onDataChange={handleDataChange}
          />
        )}

        {activeTab === "support-agents" && isSuperAdmin && (
          <SupportAgentsManagement companies={companies} onDataChange={handleDataChange} />
        )}

        {activeTab === "signatures" && isSuperAdmin && (
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-2">PDF Signature Requests</h2>
              <p className="text-sm text-muted-foreground">
                Create and manage PDF signature requests. You can see which ones are still pending
                and which have been completed, and open any request to place or review signatures.
              </p>
              <form
                className="space-y-4 border border-border/60 rounded-lg p-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (creatingSignatureRequest) return;

                  setCreatingSignatureRequest(true);
                  const form = event.currentTarget;
                  const titleInput = form.querySelector<HTMLInputElement>('input[name="title"]');
                  const fileInput = form.querySelector<HTMLInputElement>('input[name="file"]');

                  if (!fileInput?.files || fileInput.files.length === 0) {
                    setCreatingSignatureRequest(false);
                    alert('Please select a PDF file');
                    return;
                  }

                  const formData = new FormData();
                  formData.append('title', titleInput?.value || 'Signature Request');
                  formData.append('file', fileInput.files[0]);

                  try {
                    const res = await fetch('/api/pdf-signatures/requests', {
                      method: 'POST',
                      body: formData,
                    });

                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(data.error || 'Failed to create request');
                    }

                    const data = await res.json();
                    // Redirect to signature placement page for this request
                    if (data.id) {
                      window.location.href = `/admin/signatures/${data.id}`;
                    } else {
                      console.error('Request created, but ID was missing from response.');
                      setCreatingSignatureRequest(false);
                      alert('Request created, but something went wrong. Please refresh the page.');
                    }
                  } catch (error) {
                    console.error(error);
                    setCreatingSignatureRequest(false);
                    alert(
                      error instanceof Error
                        ? error.message
                        : 'Failed to create PDF signature request'
                    );
                  }
                }}
              >
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Title</label>
                  <input
                    name="title"
                    type="text"
                    className="w-full px-3 py-2 rounded border border-border bg-background"
                    placeholder="e.g. Service Agreement"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">PDF file</label>
                  <input
                    name="file"
                    type="file"
                    accept="application/pdf"
                    className="w-full text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingSignatureRequest}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-flame text-white hover:bg-coral text-sm disabled:opacity-60"
                >
                  <FileSignature className="w-4 h-4" />
                  {creatingSignatureRequest ? 'Creating request…' : 'Create request'}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Existing requests</h3>
              {loadingSignatureRequests ? (
                <p className="text-sm text-muted-foreground">Loading requests…</p>
              ) : signatureRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No signature requests yet. Create one above to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {signatureRequests.map((req) => {
                    const signatures = requestSignatures[req.id] || [];
                    const signedPdfs = signatures.filter(sig => sig.signed_pdf_url);
                    
                    return (
                      <div
                        key={req.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-border/60 rounded-lg px-3 py-2"
                      >
                        <div className="space-y-0.5 flex-1">
                          <div className="font-medium">{req.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Created{" "}
                            {new Date(req.created_at).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </div>
                          {signedPdfs.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {signedPdfs.map((sig, idx) => (
                                <a
                                  key={idx}
                                  href={sig.signed_pdf_url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-steel hover:text-mist hover:underline"
                                >
                                  View signed PDF {signedPdfs.length > 1 ? `#${idx + 1}` : ""}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              req.status === "completed"
                                ? "bg-primary/20 text-primary"
                                : req.status === "sent"
                                ? "bg-muted text-muted-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {req.status === "completed"
                              ? "Completed"
                              : req.status === "sent"
                              ? "Sent"
                              : "Draft"}
                          </span>
                          <button
                            type="button"
                            className="px-3 py-1 rounded border border-border text-xs hover:bg-muted disabled:opacity-60 flex items-center gap-1"
                            disabled={copyingLinkId === req.id}
                            onClick={async () => {
                              const signingLink = `${typeof window !== "undefined" ? window.location.origin : ""}/sign/${req.public_token}`;
                              try {
                                setCopyingLinkId(req.id);
                                await navigator.clipboard.writeText(signingLink);
                                toast.success("Signing link copied to clipboard!", {
                                  duration: 2000,
                                });
                              } catch (err) {
                                // Fallback if clipboard fails
                                const textArea = document.createElement("textarea");
                                textArea.value = signingLink;
                                textArea.style.position = "fixed";
                                textArea.style.opacity = "0";
                                document.body.appendChild(textArea);
                                textArea.select();
                                try {
                                  document.execCommand("copy");
                                  toast.success("Signing link copied to clipboard!", {
                                    duration: 2000,
                                  });
                                } catch (fallbackErr) {
                                  toast.error("Failed to copy link", {
                                    description: "Please copy manually: " + signingLink,
                                  });
                                }
                                document.body.removeChild(textArea);
                              } finally {
                                setTimeout(() => setCopyingLinkId(null), 1500);
                              }
                            }}
                          >
                            <Copy className="w-3 h-3" />
                            {copyingLinkId === req.id ? "Copied!" : "Copy link"}
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 rounded border border-border text-xs hover:bg-muted disabled:opacity-60"
                            disabled={deletingRequestId === req.id}
                            onClick={async () => {
                              if (!confirm("Delete this signature request and all its PDFs?")) {
                                return;
                              }
                              try {
                                setDeletingRequestId(req.id);
                                const res = await fetch(`/api/pdf-signatures/requests/${req.id}`, {
                                  method: "DELETE",
                                });
                                if (!res.ok) {
                                  const data = await res.json().catch(() => ({}));
                                  throw new Error(data.error || "Failed to delete request");
                                }
                                setSignatureRequests((prev) =>
                                  prev.filter((r) => r.id !== req.id)
                                );
                              } catch (err) {
                                console.error(err);
                                alert(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to delete signature request"
                                );
                              } finally {
                                setDeletingRequestId(null);
                              }
                            }}
                          >
                            {deletingRequestId === req.id ? "Deleting…" : "Delete"}
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 rounded bg-secondary text-xs"
                            onClick={() => {
                              window.location.href = `/admin/signatures/${req.id}`;
                            }}
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "email" && isSuperAdmin && (
          <EmailTabContent />
        )}

        {activeTab === "billing-payments" && !isSuperAdmin && isCompanyAdminUser && (
          <CompanyBillingPayments currentUser={currentUser} />
        )}

        {activeTab === "authorizations" && !isSuperAdmin && !isSupportAgent && companyCanAuthorizations && (
          <CompanyAuthorizedDevices currentUser={currentUser} />
        )}

        {activeTab === "payment-methods" && !isSuperAdmin && (
          <PaymentMethodsManagement
            isSuperAdmin={isSuperAdmin}
            currentUser={currentUser}
          />
        )}

        {activeTab === "company-payments" && !isSuperAdmin && (
          <CompanyPaymentsAttach
            currentUser={currentUser}
          />
        )}

        {activeTab === "billing" && isSuperAdmin && (
          <BillingManagement companies={companies} projects={projectsArray} isSuperAdmin={isSuperAdmin} />
        )}

        {activeTab === "payments" && isSuperAdmin && (
          <PaymentsManagementNew
            companies={companies}
            isSuperAdmin={isSuperAdmin}
            currentUser={currentUser}
            onDataChange={handleDataChange}
          />
        )}

        {activeTab === "payments-licensing" && (
          <PaymentsLicensing
            companies={companies}
            projects={projectsArray}
            isSuperAdmin={isSuperAdmin}
            currentUser={currentUser}
            variant="billing"
          />
        )}

        {activeTab === "authorizations" &&
          (isSuperAdmin || (isSupportAgent && Boolean(supportAgentAccess?.canAuthorizations))) && (
          <PaymentsLicensing
            companies={authorizationsCompanies}
            projects={authorizationsProjects}
            isSuperAdmin={isSuperAdmin}
            authorizationsElevated={supportAgentAuthorizationsElevated}
            currentUser={currentUser}
            variant="authorizations"
          />
        )}

        {activeTab === "logs" &&
          (isSuperAdmin ||
            (isSupportAgent && Boolean(supportAgentAccess?.canProgramLogs)) ||
            companyCanLogs) && (
          <ProjectProgramLogs
            projects={isSupportAgent && supportAgentAccess?.canProgramLogs ? programLogsProjects : projectsArray}
            companies={isSupportAgent && supportAgentAccess?.canProgramLogs ? programLogsCompanies : companies}
            isSuperAdmin={isSuperAdmin}
          />
        )}

        {activeTab === "meetings" && isSuperAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Calendar</h2>
              <button
                onClick={() => {
                  const newWindow = window.open('/admin/calendar', '_blank');
                  if (newWindow) {
                    newWindow.focus();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                Open in Full Screen
              </button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden" style={{ height: '800px' }}>
              <iframe
                src="/admin/calendar"
                className="w-full h-full border-0"
                title="Admin Calendar"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
