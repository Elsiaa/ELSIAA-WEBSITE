"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, FileSignature, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import CompaniesManagement from "@/components/admin/companies-management";
import UsersManagementNew from "@/components/admin/users-management-new";
import ProjectsManagementNew from "@/components/admin/projects-management-new";
import PaymentsLicensing from "@/components/admin/payments-licensing";
import PaymentMethodsManagement from "@/components/admin/payment-methods-management";
import CompanyPaymentsAttach from "@/components/admin/company-payments-attach";
import CompanyBillingPayments from "@/components/admin/company-billing-payments";
import SuperAdminBillingHub from "@/components/admin/super-admin-billing-hub";
import CompanyAuthorizedDevices from "@/components/admin/company-authorized-devices";
import CompanyFileStorage from "@/components/admin/company-file-storage";
import SupportAgentsManagement from "@/components/admin/support-agents-management";
import ProjectProgramLogs from "@/components/admin/project-program-logs";
import SupportDesk from "@/components/support/support-desk";
import { companyUserHasModule } from "@/lib/company-user-modules";
import type { Company, User, UserWithCompany } from "@/types/company";
import { MailControlPlane } from "@/components/mail/MailControlPlane";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_GREEN, type AdminNavEntry, type AdminTabId } from "@/components/admin/tokens";
import { readAdminTab, writeAdminTab } from "@/lib/ui-place";

function EmailTabContent() {
  return <MailControlPlane />;
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

type TabType = AdminTabId;

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
  /** Soft re-fetch bootstrap data without a full page reload (keeps active tab). */
  onSoftRefresh?: () => void | Promise<void>;
  softRefreshing?: boolean;
  /** Bumped after soft refresh so tab panels remount with fresh initial props. */
  dataRevision?: number;
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
  onSoftRefresh,
  softRefreshing = false,
  dataRevision = 0,
}: AdminClientNewProps) {
  const [activeTab, setActiveTab] = useState<TabType>(() => readAdminTab(initialTab) as TabType);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingSignatureRequest, setCreatingSignatureRequest] = useState(false);
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [loadingSignatureRequests, setLoadingSignatureRequests] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [requestSignatures, setRequestSignatures] = useState<
    Record<string, { signed_pdf_url: string | null }[]>
  >({});
  const [copyingLinkId, setCopyingLinkId] = useState<string | null>(null);

  useEffect(() => {
    writeAdminTab(activeTab);
  }, [activeTab]);

  // Soft refresh: re-fetch data in place — never full-page reload (loses tab/scroll).
  const handleRefresh = async () => {
    if (!onSoftRefresh) return;
    setRefreshing(true);
    try {
      await onSoftRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  // Children already update their own lists; skip reload so the active tab stays put.
  // Toolbar Refresh still calls handleRefresh for an explicit soft re-fetch.
  const handleDataChange = () => {
    /* no full reload */
  };

  // Convert projects to flat array with company info
  const projectsArray: Project[] = Array.isArray(initialProjects)
    ? initialProjects
    : Object.entries(initialProjects).flatMap(([companyId, projects]) =>
        projects.map((project) => ({
          ...project,
          company: companies.find((c) => c.id === companyId),
        })),
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
      ? projectsArray.filter((p) =>
          supportAgentAccess.authorizationsCompanyIds.includes(p.companyId),
        )
      : projectsArray;

  const programLogsCompanies =
    isSupportAgent && supportAgentAccess
      ? companies.filter((c) => supportAgentAccess.programLogsCompanyIds.includes(c.id))
      : companies;

  const programLogsProjects =
    isSupportAgent && supportAgentAccess
      ? projectsArray.filter((p) => supportAgentAccess.programLogsCompanyIds.includes(p.companyId))
      : projectsArray;

  const supportAgentAuthorizationsElevated = Boolean(
    isSupportAgent && supportAgentAccess?.canAuthorizations,
  );

  /** Companies where this agent has the Files grant (Support agents screen) — picker matches that permission only. */
  const supportAgentFilesGrantCompanies =
    isSupportAgent && supportAgentAccess
      ? companies.filter((c) => supportAgentAccess.filesCompanyIds.includes(c.id))
      : [];

  const supportAgentCompanyFilesMode = Boolean(
    isSupportAgent && supportAgentAccess?.canFiles && supportAgentFilesGrantCompanies.length > 0,
  );

  const isCompanyAdminUser = Boolean(currentUser?.company_id) && currentUser?.role === "admin";

  const companyCanAuthorizations =
    Boolean(currentUser?.company_id) && companyUserHasModule(currentUser, "authorizations");
  const companyCanFiles =
    Boolean(currentUser?.company_id) && companyUserHasModule(currentUser, "files");
  const companyCanLogs =
    Boolean(currentUser?.company_id) && companyUserHasModule(currentUser, "program_logs");
  const companyCanSupport =
    Boolean(currentUser?.company_id) && companyUserHasModule(currentUser, "support");

  const showFilesTabForUser =
    isSuperAdmin || (isSupportAgent ? Boolean(supportAgentAccess?.canFiles) : companyCanFiles);

  const roleLabel = isSuperAdmin
    ? "Super admin"
    : isSupportAgent
      ? "Support agent"
      : "Company admin";

  const sidebarNav = useMemo((): AdminNavEntry[] => {
    if (isSupportAgent && supportAgentAccess) {
      const items: AdminNavEntry[] = [];
      if (supportAgentAccess.canAuthorizations) {
        items.push({
          kind: "item",
          id: "authorizations",
          label: "Authorizations",
          blurb: "Devices & access.",
        });
      }
      if (supportAgentAccess.canSupport) {
        items.push({ kind: "item", id: "support", label: "Support", blurb: "Tickets desk." });
      }
      if (supportAgentAccess.canProgramLogs) {
        items.push({ kind: "item", id: "logs", label: "Logs", blurb: "Program output." });
      }
      if (supportAgentAccess.canFiles) {
        items.push({
          kind: "item",
          id: "company-files",
          label: "Files",
          blurb: "Company storage.",
        });
      }
      return items;
    }

    if (isSuperAdmin) {
      const usageChildren = [
        { id: "authorizations" as const, label: "Authorizations", blurb: "Devices & overrides." },
        ...(showFilesTabForUser
          ? [{ id: "company-files" as const, label: "Files", blurb: "Shared storage." }]
          : []),
        { id: "signatures" as const, label: "Signatures", blurb: "PDF sign requests." },
        { id: "billing" as const, label: "Billing", blurb: "Bills, requests & licenses." },
      ];

      return [
        {
          kind: "group" as const,
          id: "usage",
          label: "Usage",
          blurb: "Ops & billing tools.",
          children: usageChildren,
        },
        {
          kind: "group" as const,
          id: "structure",
          label: "Structure",
          blurb: "Tenants & people.",
          children: [
            {
              id: "companies" as const,
              label: "Companies",
              blurb: "Tenant accounts.",
              badge: companies.length,
            },
            {
              id: "users" as const,
              label: "Users",
              blurb: "People & roles.",
              badge: initialUsers.length,
            },
            {
              id: "projects" as const,
              label: "Projects",
              blurb: "Active builds.",
              badge: projectsArray.length,
            },
            { id: "support-agents" as const, label: "Support agents", blurb: "Module grants." },
          ],
        },
        {
          kind: "item" as const,
          id: "email" as const,
          label: "Mail",
          blurb: "Accounts, keys & send.",
        },
        {
          kind: "item" as const,
          id: "meetings" as const,
          label: "Calendar",
          blurb: "Meeting requests.",
        },
        {
          kind: "item" as const,
          id: "logs" as const,
          label: "Logs",
          blurb: "Program output by project.",
        },
        {
          kind: "item" as const,
          id: "support" as const,
          label: "Support",
          blurb: "Tickets & participants.",
        },
      ];
    }

    // Company admin
    const items: AdminNavEntry[] = [];
    if (companyCanAuthorizations) {
      items.push({
        kind: "item",
        id: "authorizations",
        label: "Authorizations",
        blurb: "Devices & access.",
      });
    }
    if (showFilesTabForUser) {
      items.push({ kind: "item", id: "company-files", label: "Files", blurb: "Company storage." });
    }
    if (isCompanyAdminUser) {
      items.push({
        kind: "item",
        id: "billing-payments",
        label: "Billing",
        blurb: "Methods & history.",
      });
      items.push({
        kind: "item",
        id: "users",
        label: "Users",
        blurb: "Company members.",
        badge: initialUsers.length,
      });
    }
    if (companyCanLogs) {
      items.push({ kind: "item", id: "logs", label: "Logs", blurb: "Program output." });
    }
    if (companyCanSupport) {
      items.push({ kind: "item", id: "support", label: "Support", blurb: "Tickets desk." });
    }
    return items;
  }, [
    isSupportAgent,
    supportAgentAccess,
    isSuperAdmin,
    showFilesTabForUser,
    companies.length,
    initialUsers.length,
    projectsArray.length,
    companyCanAuthorizations,
    isCompanyAdminUser,
    companyCanLogs,
    companyCanSupport,
  ]);

  // Ensure the open tab exists in this role's nav (company admins may lack Authorizations).
  useEffect(() => {
    const ids = new Set<AdminTabId>();
    for (const entry of sidebarNav) {
      if (entry.kind === "item") ids.add(entry.id);
      if (entry.kind === "group") {
        for (const child of entry.children) ids.add(child.id);
      }
    }
    if (ids.size === 0) return;
    setActiveTab((current) => (ids.has(current) ? current : [...ids][0]!));
  }, [sidebarNav]);

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
            }),
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

  return (
    <AdminShell
      active={activeTab}
      onNavigate={setActiveTab}
      email={userEmail}
      roleLabel={roleLabel}
      nav={sidebarNav}
      onRefresh={onSoftRefresh ? () => void handleRefresh() : undefined}
      refreshing={refreshing || softRefreshing}
    >
      {/* Tab Content — key remounts panels after soft refresh without losing activeTab */}
      <div className="pb-12" key={dataRevision}>
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
                <p className="text-sm text-[#111]/55 mt-1">
                  Tickets support long replies and large attachment previews. Add company users as
                  participants; everyone on the ticket and super-admins get email on new messages
                  (super-admins are not copied on their own sends).
                </p>
              </div>
              <SupportDesk
                mode="admin"
                isSuperAdmin={isSuperAdmin}
                supportAgentMode={Boolean(
                  isSupportAgent && (supportAgentAccess?.supportCompanyIds.length ?? 0) > 1,
                )}
                companies={supportDeskCompanies}
                allUsers={initialUsers}
                fixedCompanyId={
                  isSupportAgent && supportAgentAccess?.supportCompanyIds.length === 1
                    ? supportAgentAccess.supportCompanyIds[0]
                    : (currentUser?.company_id ?? null)
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
              <p className="text-sm text-[#111]/55">
                Create and manage PDF signature requests. You can see which ones are still pending
                and which have been completed, and open any request to place or review signatures.
              </p>
              <form
                className="space-y-4 border border-black/[0.08] rounded-lg p-4 bg-white"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (creatingSignatureRequest) return;

                  setCreatingSignatureRequest(true);
                  const form = event.currentTarget;
                  const titleInput = form.querySelector<HTMLInputElement>('input[name="title"]');
                  const fileInput = form.querySelector<HTMLInputElement>('input[name="file"]');

                  if (!fileInput?.files || fileInput.files.length === 0) {
                    setCreatingSignatureRequest(false);
                    alert("Please select a PDF file");
                    return;
                  }

                  const formData = new FormData();
                  formData.append("title", titleInput?.value || "Signature Request");
                  formData.append("file", fileInput.files[0]);

                  try {
                    const res = await fetch("/api/pdf-signatures/requests", {
                      method: "POST",
                      body: formData,
                    });

                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(data.error || "Failed to create request");
                    }

                    const data = await res.json();
                    // Redirect to signature placement page for this request
                    if (data.id) {
                      window.location.href = `/admin/signatures/${data.id}`;
                    } else {
                      console.error("Request created, but ID was missing from response.");
                      setCreatingSignatureRequest(false);
                      alert("Request created, but something went wrong. Please refresh the page.");
                    }
                  } catch (error) {
                    console.error(error);
                    setCreatingSignatureRequest(false);
                    alert(
                      error instanceof Error
                        ? error.message
                        : "Failed to create PDF signature request",
                    );
                  }
                }}
              >
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Title</label>
                  <input
                    name="title"
                    type="text"
                    className="w-full px-3 py-2 rounded border border-black/[0.08] bg-white text-[#111]"
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm disabled:opacity-60"
                  style={{ backgroundColor: ADMIN_GREEN }}
                >
                  <FileSignature className="w-4 h-4" />
                  {creatingSignatureRequest ? "Creating request…" : "Create request"}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Existing requests</h3>
              {loadingSignatureRequests ? (
                <p className="text-sm text-[#111]/55">Loading requests…</p>
              ) : signatureRequests.length === 0 ? (
                <p className="text-sm text-[#111]/55">
                  No signature requests yet. Create one above to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {signatureRequests.map((req) => {
                    const signatures = requestSignatures[req.id] || [];
                    const signedPdfs = signatures.filter((sig) => sig.signed_pdf_url);

                    return (
                      <div
                        key={req.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-black/[0.08] rounded-lg px-3 py-2 bg-white"
                      >
                        <div className="space-y-0.5 flex-1">
                          <div className="font-medium text-[#111]">{req.title}</div>
                          <div className="text-xs text-[#111]/55">
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
                                  className="text-xs text-[#1e6b3c] hover:underline"
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
                                ? "bg-[#1e6b3c]/15 text-[#1e6b3c]"
                                : req.status === "sent"
                                  ? "bg-black/[0.06] text-[#111]/55"
                                  : "bg-black/[0.04] text-[#111]/70"
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
                            className="px-3 py-1 rounded border border-black/[0.08] text-xs text-[#111] hover:bg-black/[0.04] disabled:opacity-60 flex items-center gap-1"
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
                            className="px-3 py-1 rounded border border-black/[0.08] text-xs text-[#111] hover:bg-black/[0.04] disabled:opacity-60"
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
                                setSignatureRequests((prev) => prev.filter((r) => r.id !== req.id));
                              } catch (err) {
                                console.error(err);
                                alert(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to delete signature request",
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
                            className="px-3 py-1 rounded bg-[#1e6b3c] text-white text-xs"
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

        {activeTab === "email" && isSuperAdmin && <EmailTabContent />}

        {activeTab === "billing-payments" && !isSuperAdmin && isCompanyAdminUser && (
          <CompanyBillingPayments currentUser={currentUser} />
        )}

        {activeTab === "authorizations" &&
          !isSuperAdmin &&
          !isSupportAgent &&
          companyCanAuthorizations && <CompanyAuthorizedDevices currentUser={currentUser} />}

        {activeTab === "payment-methods" && !isSuperAdmin && (
          <PaymentMethodsManagement isSuperAdmin={isSuperAdmin} currentUser={currentUser} />
        )}

        {activeTab === "company-payments" && !isSuperAdmin && (
          <CompanyPaymentsAttach currentUser={currentUser} />
        )}

        {activeTab === "billing" && isSuperAdmin && (
          <SuperAdminBillingHub
            companies={companies}
            projects={projectsArray}
            isSuperAdmin={isSuperAdmin}
            currentUser={currentUser}
            onDataChange={handleDataChange}
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
              projects={
                isSupportAgent && supportAgentAccess?.canProgramLogs
                  ? programLogsProjects
                  : projectsArray
              }
              companies={
                isSupportAgent && supportAgentAccess?.canProgramLogs
                  ? programLogsCompanies
                  : companies
              }
              isSuperAdmin={isSuperAdmin}
            />
          )}

        {activeTab === "meetings" && isSuperAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Calendar</h2>
              <button
                onClick={() => {
                  const newWindow = window.open("/admin/calendar", "_blank");
                  if (newWindow) {
                    newWindow.focus();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: ADMIN_GREEN }}
              >
                <Maximize2 className="w-4 h-4" />
                Open in Full Screen
              </button>
            </div>
            <div
              className="border border-black/[0.08] rounded-lg overflow-hidden bg-white"
              style={{ height: "800px" }}
            >
              <iframe
                src="/admin/calendar"
                className="w-full h-full border-0"
                title="Admin Calendar"
              />
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
