"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SoftwareVersionSelect } from "@/components/admin/software-version-select";
import {
  Smartphone,
  Plus,
  Trash2,
  CheckCircle,
  Pause,
  Play,
  Loader2,
  AlertCircle,
  Key,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { resolveExtensionRefSelectValue } from "@/lib/extension-github-ref-select";

interface Device {
  id: string;
  name: string;
  deviceId: string;
  status: string;
  isAdminDevice?: boolean;
  createdAt?: string;
}

interface Project {
  id: string;
  title: string;
  deviceLimit?: number | null;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return dateStr;
  }
};

interface CompanyAuthorizedDevicesProps {
  currentUser: any;
}

export default function CompanyAuthorizedDevices({ currentUser }: CompanyAuthorizedDevicesProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [devicesByProject, setDevicesByProject] = useState<Record<string, Device[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingDeviceId, setLoadingDeviceId] = useState<string | null>(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceId, setNewDeviceId] = useState("");
  const [activeAddProject, setActiveAddProject] = useState<string | null>(null);
  const [editingAuthDeviceId, setEditingAuthDeviceId] = useState<string | null>(null);
  const [editAuthName, setEditAuthName] = useState("");
  const [editAuthDeviceExternalId, setEditAuthDeviceExternalId] = useState("");
  const [projectApiKeyReveal, setProjectApiKeyReveal] = useState<Record<string, string>>({});
  const [apiKeyLoading, setApiKeyLoading] = useState<Record<string, boolean>>({});
  const [githubStatusByProject, setGithubStatusByProject] = useState<
    Record<
      string,
      {
        hasGithubUrl: boolean;
        latestPushDate: string | null;
        currentRef?: string | null;
        defaultBranch?: string | null;
        deploymentVisibleFrom?: string | null;
        commits?: Array<{ sha: string; message: string; date: string }>;
        hasMoreCommits?: boolean;
        commitRawOffset?: number;
      }
    >
  >({});
  const [refUpdating, setRefUpdating] = useState<Record<string, boolean>>({});
  const [selectedRefByProject, setSelectedRefByProject] = useState<Record<string, string>>({});

  const companyId = currentUser?.company_id;

  const handleSaveRef = async (projectId: string) => {
    const gh = githubStatusByProject[projectId];
    const defaultBr = gh?.defaultBranch ?? "main";
    const commits = gh?.commits ?? [];
    const newRef =
      selectedRefByProject[projectId] ??
      resolveExtensionRefSelectValue(gh?.currentRef ?? null, defaultBr, commits);
    if (!newRef) return;

    setRefUpdating((prev) => ({ ...prev, [projectId]: true }));
    try {
      const res = await fetch(`/api/projects/${projectId}/github-ref`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: newRef }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to update GitHub version");
        return;
      }

      const { ref } = await res.json();
      setGithubStatusByProject((prev) => ({
        ...prev,
        [projectId]: {
          ...prev[projectId]!,
          currentRef: ref,
        },
      }));
      toast.success("GitHub version updated successfully");
    } catch {
      toast.error("Failed to update GitHub version");
    } finally {
      setRefUpdating((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const revealApiKey = async (projectId: string) => {
    if (projectApiKeyReveal[projectId] !== undefined) {
      setProjectApiKeyReveal((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
      return;
    }
    setApiKeyLoading((prev) => ({ ...prev, [projectId]: true }));
    try {
      const res = await fetch(`/api/projects/${projectId}/api-key`);
      const data = await res.json();
      if (res.ok) {
        setProjectApiKeyReveal((prev) => ({ ...prev, [projectId]: data.apiKey ?? "(not set)" }));
      } else {
        setProjectApiKeyReveal((prev) => ({ ...prev, [projectId]: "(error)" }));
      }
    } catch {
      setProjectApiKeyReveal((prev) => ({ ...prev, [projectId]: "(error)" }));
    } finally {
      setApiKeyLoading((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const copyApiKey = async (projectId: string) => {
    const value = projectApiKeyReveal[projectId];
    if (!value || value === "(not set)" || value === "(error)") return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success("API key copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const projectsRes = await fetch(`/api/companies/${companyId}/projects`, {
          cache: "no-store",
        });

        let projectsList: Project[] = [];
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          const raw = Array.isArray(data) ? data : data.projects || [];
          projectsList = raw.map(
            (p: {
              id: string;
              title: string;
              deviceLimit?: number | null;
              device_limit?: number | null;
            }) => ({
              id: p.id,
              title: p.title,
              deviceLimit: p.deviceLimit ?? p.device_limit ?? null,
            }),
          );
        }

        // Authoritative per-project limit (same source as API enforcement); avoids stale list JSON or caching.
        projectsList = await Promise.all(
          projectsList.map(async (p) => {
            try {
              const res = await fetch(`/api/projects/${p.id}/device-limit`, { cache: "no-store" });
              if (res.ok) {
                const { deviceLimit } = await res.json();
                return { ...p, deviceLimit: deviceLimit ?? p.deviceLimit ?? null };
              }
            } catch {}
            return p;
          }),
        );

        if (!cancelled) setProjects(projectsList);

        const ghStatus: Record<
          string,
          {
            hasGithubUrl: boolean;
            latestPushDate: string | null;
            currentRef?: string | null;
            defaultBranch?: string | null;
            deploymentVisibleFrom?: string | null;
            commits?: Array<{ sha: string; message: string; date: string }>;
          }
        > = {};
        await Promise.all(
          projectsList.map(async (p) => {
            try {
              const res = await fetch(`/api/projects/${p.id}/github-status`, { cache: "no-store" });
              if (res.ok) {
                ghStatus[p.id] = await res.json();
              }
            } catch {}
          }),
        );
        if (!cancelled) {
          setGithubStatusByProject(ghStatus);
          const initialRefs: Record<string, string> = {};
          for (const [pid, status] of Object.entries(ghStatus)) {
            if (status.commits?.length) {
              initialRefs[pid] = resolveExtensionRefSelectValue(
                status.currentRef ?? null,
                status.defaultBranch ?? "main",
                status.commits,
              );
            }
          }
          setSelectedRefByProject(initialRefs);
        }

        const byProject: Record<string, Device[]> = {};
        await Promise.all(
          projectsList.map(async (p) => {
            try {
              const res = await fetch(`/api/projects/${p.id}/auth-devices`, { cache: "no-store" });
              if (res.ok) {
                const { devices } = await res.json();
                byProject[p.id] = (devices || []).map((d: any) => ({
                  id: d.id,
                  name: d.name,
                  deviceId: d.deviceId,
                  status: d.status,
                  isAdminDevice: Boolean(d.isAdminDevice),
                  createdAt: d.createdAt,
                }));
              }
            } catch {}
          }),
        );
        if (!cancelled) setDevicesByProject(byProject);
      } catch {
        toast.error("Failed to load device data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const countQuotaDevices = (devices: Device[]) =>
    devices.filter((d) => !d.isAdminDevice && (d.status === "active" || d.status === "paused"))
      .length;

  const beginEditDevice = (d: Device) => {
    setEditingAuthDeviceId(d.id);
    setEditAuthName(d.name);
    setEditAuthDeviceExternalId(d.deviceId || "");
  };

  const cancelEditDevice = () => {
    setEditingAuthDeviceId(null);
    setEditAuthName("");
    setEditAuthDeviceExternalId("");
  };

  const saveEditDevice = async (projectId: string, deviceDbId: string) => {
    const name = editAuthName.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    setLoadingDeviceId(`edit-${deviceDbId}`);
    try {
      const res = await fetch(`/api/projects/${projectId}/auth-devices/${deviceDbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          deviceId: editAuthDeviceExternalId.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }
      const updated = data.device as Device | undefined;
      if (updated) {
        setDevicesByProject((prev) => ({
          ...prev,
          [projectId]: (prev[projectId] || []).map((row) =>
            row.id === deviceDbId
              ? {
                  ...row,
                  name: updated.name,
                  deviceId: updated.deviceId,
                  status: updated.status,
                }
              : row,
          ),
        }));
      }
      cancelEditDevice();
      toast.success("Device updated");
    } finally {
      setLoadingDeviceId(null);
    }
  };

  const handleApprove = async (projectId: string, deviceDbId: string) => {
    setLoadingDeviceId(deviceDbId);
    try {
      const res = await fetch(`/api/projects/${projectId}/auth-devices/${deviceDbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const updated = data.device as Device | undefined;
        setDevicesByProject((prev) => ({
          ...prev,
          [projectId]: (prev[projectId] || []).map((d) =>
            d.id === deviceDbId
              ? updated
                ? { ...d, name: updated.name, deviceId: updated.deviceId, status: updated.status }
                : { ...d, status: "active" }
              : d,
          ),
        }));
        toast.success("Device approved");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to approve");
      }
    } finally {
      setLoadingDeviceId(null);
    }
  };

  const handleTogglePause = async (projectId: string, device: Device) => {
    const newStatus = device.status === "active" ? "paused" : "active";
    setLoadingDeviceId(device.id);
    try {
      const res = await fetch(`/api/projects/${projectId}/auth-devices/${device.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const updated = data.device as Device | undefined;
        setDevicesByProject((prev) => ({
          ...prev,
          [projectId]: (prev[projectId] || []).map((d) =>
            d.id === device.id
              ? updated
                ? { ...d, name: updated.name, deviceId: updated.deviceId, status: updated.status }
                : { ...d, status: newStatus }
              : d,
          ),
        }));
        toast.success(newStatus === "paused" ? "Device paused" : "Device resumed");
      } else toast.error("Failed to update");
    } finally {
      setLoadingDeviceId(null);
    }
  };

  const handleRemove = async (projectId: string, deviceDbId: string) => {
    if (!confirm("Remove this device?")) return;
    setLoadingDeviceId(deviceDbId);
    try {
      const res = await fetch(`/api/projects/${projectId}/auth-devices/${deviceDbId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDevicesByProject((prev) => ({
          ...prev,
          [projectId]: (prev[projectId] || []).filter((d) => d.id !== deviceDbId),
        }));
        toast.success("Device removed");
      } else toast.error("Failed to remove");
    } finally {
      setLoadingDeviceId(null);
    }
  };

  const handleAddDevice = async (projectId: string) => {
    const name = (activeAddProject === projectId ? newDeviceName : "").trim();
    const deviceId = (activeAddProject === projectId ? newDeviceId : "").trim();
    if (!name && !deviceId) {
      toast.error("Enter at least a name or device ID");
      return;
    }
    setLoadingDeviceId(`add-${projectId}`);
    try {
      const res = await fetch(`/api/projects/${projectId}/auth-devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, deviceId: deviceId || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to add device");
        return;
      }
      const { device } = await res.json();
      setDevicesByProject((prev) => ({
        ...prev,
        [projectId]: [device, ...(prev[projectId] || [])],
      }));
      setNewDeviceName("");
      setNewDeviceId("");
      setActiveAddProject(null);
      toast.success("Device added");
    } finally {
      setLoadingDeviceId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading devices…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quota bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Smartphone className="w-5 h-5" />
            Authorized Devices
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage authorized devices for your projects. Device quotas are set per project. Add
            devices or approve pending requests below.
          </p>
        </CardHeader>
      </Card>

      {/* Per-project device cards */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No projects found for your company.
          </CardContent>
        </Card>
      ) : (
        projects.map((project) => {
          const devices = devicesByProject[project.id] || [];
          const pendingCount = devices.filter((d) => d.status === "pending").length;
          const usedQuota = countQuotaDevices(devices);
          const lim = project.deviceLimit ?? null;
          const atProjectLimit = lim != null && usedQuota >= lim;

          return (
            <Card key={project.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex flex-col">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    {githubStatusByProject[project.id]?.hasGithubUrl && (
                      <div className="mt-2 flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            Software Version:
                          </span>
                          {githubStatusByProject[project.id]?.commits?.length ? (
                            <>
                              {(() => {
                                const gh = githubStatusByProject[project.id]!;
                                const defaultBr = gh.defaultBranch ?? "main";
                                const commits = gh.commits ?? [];
                                const selectValue =
                                  selectedRefByProject[project.id] ??
                                  resolveExtensionRefSelectValue(
                                    gh.currentRef ?? null,
                                    defaultBr,
                                    commits,
                                  );
                                const savedRef = gh.currentRef ?? "";
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
                                        setSelectedRefByProject((prev) => ({
                                          ...prev,
                                          [project.id]: val,
                                        }))
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
                                          "Save"
                                        )}
                                      </Button>
                                    ) : null}
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Loading versions...
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-muted-foreground">
                      Quota (active + paused):{" "}
                      <span className="font-semibold text-foreground">
                        {usedQuota}
                        {lim != null ? ` / ${lim}` : ""}
                      </span>
                      {lim == null && (
                        <span className="text-muted-foreground font-normal"> (no limit)</span>
                      )}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {devices.length} total
                    </Badge>
                    {pendingCount > 0 && (
                      <Badge variant="outline" className="border-primary text-primary text-xs">
                        {pendingCount} pending
                      </Badge>
                    )}
                    {atProjectLimit && (
                      <span className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="w-3.5 h-3.5" />
                        At limit
                      </span>
                    )}
                  </div>
                </div>
                {lim != null && (
                  <div className="mt-2 max-w-md">
                    <div className="w-full bg-secondary/60 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          atProjectLimit
                            ? "bg-destructive"
                            : usedQuota / lim > 0.8
                              ? "bg-slate"
                              : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(100, (usedQuota / lim) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {/* Project API key: reveal + copy */}
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Project API Key
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {projectApiKeyReveal[project.id] === undefined ? (
                      <code className="text-xs bg-secondary/80 px-2 py-1 rounded font-mono text-muted-foreground">
                        ••••••••••••••••
                      </code>
                    ) : (
                      <code className="text-xs bg-secondary/80 px-2 py-1 rounded font-mono break-all max-w-full">
                        {projectApiKeyReveal[project.id]}
                      </code>
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => revealApiKey(project.id)}
                        disabled={!!apiKeyLoading[project.id]}
                        title={projectApiKeyReveal[project.id] !== undefined ? "Hide" : "Reveal"}
                      >
                        {apiKeyLoading[project.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : projectApiKeyReveal[project.id] !== undefined ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      {projectApiKeyReveal[project.id] !== undefined &&
                        projectApiKeyReveal[project.id] !== "(not set)" &&
                        projectApiKeyReveal[project.id] !== "(error)" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => copyApiKey(project.id)}
                            title="Copy API key"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {devices.length === 0 ? (
                  <p className="text-sm text-muted-foreground mb-3">No devices registered yet.</p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {devices.map((d) => (
                      <div
                        key={d.id}
                        className={`p-3 border rounded-lg text-sm ${
                          d.status === "pending"
                            ? "border-border bg-muted/50"
                            : d.status === "paused"
                              ? "border-muted bg-muted/20"
                              : ""
                        }`}
                      >
                        {editingAuthDeviceId === d.id ? (
                          <div className="space-y-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-muted-foreground">Name</label>
                                <Input
                                  value={editAuthName}
                                  onChange={(e) => setEditAuthName(e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-muted-foreground">Device ID</label>
                                <Input
                                  value={editAuthDeviceExternalId}
                                  onChange={(e) => setEditAuthDeviceExternalId(e.target.value)}
                                  className="text-sm font-mono"
                                  placeholder="Leave empty to generate a new ID"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Clearing device ID and saving assigns a new random ID (required by the
                              database).
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                disabled={loadingDeviceId === `edit-${d.id}`}
                                onClick={() => saveEditDevice(project.id, d.id)}
                              >
                                {loadingDeviceId === `edit-${d.id}` ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                )}
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditDevice}
                                type="button"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                              <span className="font-medium">{d.name}</span>
                              <Badge
                                variant={
                                  d.status === "active"
                                    ? "default"
                                    : d.status === "pending"
                                      ? "outline"
                                      : "secondary"
                                }
                                className={
                                  d.status === "pending"
                                    ? "border-muted-foreground text-muted-foreground"
                                    : ""
                                }
                              >
                                {d.status}
                              </Badge>
                              {d.deviceId ? (
                                <span className="text-xs text-muted-foreground font-mono break-all">
                                  {d.deviceId}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={loadingDeviceId !== null}
                                onClick={() => beginEditDevice(d)}
                                title="Edit name and device ID"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              {d.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-primary border-primary hover:bg-primary/10"
                                  disabled={loadingDeviceId === d.id}
                                  onClick={() => handleApprove(project.id, d.id)}
                                >
                                  {loadingDeviceId === d.id ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  )}
                                  Approve
                                </Button>
                              )}
                              {d.status !== "pending" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={loadingDeviceId === d.id}
                                  onClick={() => handleTogglePause(project.id, d)}
                                  title={d.status === "active" ? "Pause device" : "Resume device"}
                                >
                                  {loadingDeviceId === d.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : d.status === "active" ? (
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
                                disabled={loadingDeviceId === d.id}
                                onClick={() => handleRemove(project.id, d.id)}
                                title="Remove device"
                              >
                                {loadingDeviceId === d.id ? (
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
                  </div>
                )}

                {/* Add device: name and/or device ID (at least one required) */}
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Name (optional)</label>
                    <Input
                      placeholder="Device name"
                      value={activeAddProject === project.id ? newDeviceName : ""}
                      onChange={(e) => {
                        setNewDeviceName(e.target.value);
                        setActiveAddProject(project.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddDevice(project.id);
                        }
                      }}
                      className="max-w-[180px]"
                      disabled={atProjectLimit}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Device ID (optional)</label>
                    <Input
                      placeholder="Device ID"
                      value={activeAddProject === project.id ? newDeviceId : ""}
                      onChange={(e) => {
                        setNewDeviceId(e.target.value);
                        setActiveAddProject(project.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddDevice(project.id);
                        }
                      }}
                      className="max-w-[220px] font-mono text-sm"
                      disabled={atProjectLimit}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingDeviceId === `add-${project.id}` || atProjectLimit}
                    onClick={() => handleAddDevice(project.id)}
                    title={
                      atProjectLimit
                        ? "Device limit reached for this project"
                        : "Add device (name and/or ID required)"
                    }
                  >
                    {loadingDeviceId === `add-${project.id}` ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-1" />
                    )}
                    Add device
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Provide at least a name or device ID.
                </p>
                {atProjectLimit && (
                  <p className="text-xs text-red-500 mt-1">
                    Device limit reached for this project. Contact your administrator to increase
                    the limit.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
