import React, { useState, useEffect } from "react";
import { 
  Link as LinkIcon, 
  ExternalLink, 
  Layout, 
  Github, 
  Cloud, 
  Cpu, 
  Globe, 
  Settings as SettingsIcon,
  MessageSquare,
  Activity,
  ShieldCheck,
  Code,
  Save,
  Loader2,
  RefreshCw,
  Database,
  HardDrive,
  Plus,
  Trash2,
  X,
  Server as ServerIcon,
  Container,
  Terminal,
  PlayCircle,
  StopCircle,
  AlertCircle,
  History,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { Project, Settings, Server } from "../../types";
import MarkdownEditor from "../editor/MarkdownEditor";

export default function ProjectDetails({ project: initialProject }: { project: Project }) {
  const [project, setProject] = useState<any>(initialProject);
  const [activeTab, setActiveTab] = useState<"overview" | "docs" | "intelligence">("overview");
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [servers, setServers] = useState<Server[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [isEditingIntel, setIsEditingIntelligence] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ label: "", url: "" });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setProject(initialProject);
    fetch("/api/settings").then(res => res.json()).then(data => setSettings(data));
    fetch("/api/servers").then(res => res.json()).then(data => setServers(data));
    
    // Initial health fetch
    fetchHealth();

    // Poll health every 5 mins
    const interval = setInterval(fetchHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [initialProject]);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch(`/api/projects/${initialProject.id}/health`);
      const data = await res.json();
      setHealth(data);
    } catch (e) {}
    setLoadingHealth(false);
  };

  // Helper to normalize properties
  const getVal = (obj: any, key: string) => {
    const snake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return obj[key] !== undefined ? obj[key] : obj[snake];
  };

  const cfD1Id = getVal(project, 'cloudflareD1Id');
  const cfR2Bucket = getVal(project, 'cloudflareR2BucketName');
  const cfProjName = getVal(project, 'cloudflareProjectName');
  const isWorker = getVal(project, 'isWorker');
  const workerName = getVal(project, 'cloudflareWorkerName');
  
  const isDockerManual = getVal(project, 'isDockerProject');
  const serverId = getVal(project, 'serverId');
  const endpointId = getVal(project, 'portainerEndpointId') || 1;
  const stackName = getVal(project, 'portainerStackName');

  const prodUrl = getVal(project, 'prodUrl');
  const isCfManual = getVal(project, 'isCloudflareProject');
  const githubRepo = getVal(project, 'githubRepoFullName');

  const isCloudflare = isCfManual || prodUrl?.includes(".pages.dev") || prodUrl?.includes(".workers.dev") || !!cfProjName || !!workerName;
  const isDocker = isDockerManual || !!stackName;

  const getGithubLink = (path: string) => {
    if (!githubRepo) return null;
    return `https://github.com/${githubRepo}${path}`;
  };

  const getCloudflareLink = (type: string) => {
    const accountId = settings.cloudflareAccountId;
    if (!accountId) return null;
    if (type === "pages") return `https://dash.cloudflare.com/${accountId}/pages/view/${cfProjName || project.name}`;
    if (type === "workers") return `https://dash.cloudflare.com/${accountId}/workers/services/view/${workerName || project.name}/production`;
    if (type === "d1") return cfD1Id ? `https://dash.cloudflare.com/${accountId}/workers/d1/databases/${cfD1Id}/metrics` : `https://dash.cloudflare.com/${accountId}/workers/d1`;
    if (type === "r2") return cfR2Bucket ? `https://dash.cloudflare.com/${accountId}/r2/buckets/${cfR2Bucket}` : `https://dash.cloudflare.com/${accountId}/r2/overview`;
    return null;
  };

  const getPortainerLink = (type: string, containerId?: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return null;
    const baseUrl = server.url.replace(/\/$/, "");
    if (type === "stack") {
      const id = health?.docker?.stackId;
      return id ? `${baseUrl}/#!/${endpointId}/docker/stacks/${stackName}?id=${id}&type=2&regular=true` : `${baseUrl}/#!/${endpointId}/docker/stacks`;
    }
    if (type === "logs" && containerId) return `${baseUrl}/#!/${endpointId}/docker/containers/${containerId}/logs`;
    return baseUrl;
  };

  const StatusDot = ({ status }: { status: string }) => {
    const isSuccess = ['success', 'active', 'completed'].includes(status);
    const isFailure = ['failure', 'inactive', 'failed', 'timed_out'].includes(status);
    const isPending = ['in_progress', 'queued', 'waiting', 'pending'].includes(status);

    if (isSuccess) return <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" title={status} />;
    if (isFailure) return <div className="w-2.5 h-2.5 rounded-full bg-destructive shadow-sm shadow-destructive/50" title={status} />;
    if (isPending) return <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" title={status} />;
    return <div className="w-2.5 h-2.5 rounded-full bg-muted" title={status} />;
  };

  const handleUpdateProject = async () => {
    setSaving(true);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codingAgents: project.codingAgents,
        primaryModel: project.primaryModel,
        agentInstructionsUrl: project.agentInstructionsUrl,
        prodUrl: prodUrl,
        stagingUrl: project.stagingUrl,
        isCloudflareProject: Boolean(isCfManual),
        cloudflareProjectName: cfProjName,
        isWorker: Boolean(isWorker),
        cloudflareWorkerName: workerName,
        cloudflareD1Id: cfD1Id,
        cloudflareR2BucketName: cfR2Bucket,
        isDockerProject: Boolean(isDockerManual),
        serverId: serverId,
        portainerEndpointId: parseInt(endpointId.toString()),
        portainerStackName: stackName,
      }),
    });
    if (res.ok) setIsEditingIntelligence(false);
    setSaving(false);
  };

  const handleSyncWithGithub = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/sync`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setProject({ ...project, ...data.meta, updatedAt: new Date().toISOString() });
        fetchHealth();
        alert("Synced successfully!");
      } else alert(data.error || "Sync failed");
    } catch (e) { alert("Error during sync."); } finally { setSyncing(false); }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/projects/${project.id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLink),
    });
    if (res.ok) {
      const data = await res.json();
      setProject({ ...project, quickLinks: [...(project.quickLinks || []), { id: data.id, ...newLink }] });
      setNewLink({ label: "", url: "" });
      setShowAddLink(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Delete link?")) return;
    const res = await fetch(`/api/projects/${project.id}/links/${linkId}`, { method: "DELETE" });
    if (res.ok) setProject({ ...project, quickLinks: project.quickLinks.filter((l: any) => l.id !== linkId) });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="bg-card border-b p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold uppercase">{project.status}</span>
            </div>
            <p className="text-muted-foreground mt-1">{project.description}</p>
          </div>
          <div className="flex gap-2">
            {prodUrl && (
              <a href={prodUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-md text-sm font-medium hover:bg-green-500/20">
                <Globe className="w-4 h-4" /> Live
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setActiveTab("overview")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Overview</button>
          <button onClick={() => setActiveTab("intelligence")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "intelligence" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Intelligence</button>
          <button onClick={() => setActiveTab("docs")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "docs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Documentation</button>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Pulse / System Health */}
              <section className="bg-card border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" /> System Pulse
                  </h2>
                  <button onClick={fetchHealth} disabled={loadingHealth} className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${loadingHealth ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* GitHub Pulse */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <Github className="w-3.5 h-3.5" /> Recent Actions
                    </div>
                    <div className="flex items-center gap-2 h-6">
                      {health?.github?.length > 0 ? health.github.map((run: any) => (
                        <a key={run.id} href={run.url} target="_blank" rel="noreferrer" title={`${run.name}: ${run.conclusion || run.status}`}>
                          <StatusDot status={run.conclusion || run.status} />
                        </a>
                      )) : <span className="text-[10px] text-muted-foreground italic">No data</span>}
                    </div>
                  </div>

                  {/* Cloudflare Pulse */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <Cloud className="w-3.5 h-3.5 text-orange-500" /> Recent Builds
                    </div>
                    <div className="flex items-center gap-2 h-6">
                      {health?.cloudflare?.length > 0 ? health.cloudflare.map((d: any) => (
                        <a key={d.id} href={d.url} target="_blank" rel="noreferrer" title={`${d.environment}: ${d.status}`}>
                          <StatusDot status={d.status} />
                        </a>
                      )) : <span className="text-[10px] text-muted-foreground italic">No data</span>}
                    </div>
                  </div>

                  {/* Docker Pulse */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <Container className="w-3.5 h-3.5 text-blue-500" /> Containers
                    </div>
                    <div className="flex items-center gap-2 h-6">
                      {health?.docker?.containers?.length > 0 ? health.docker.containers.slice(0, 5).map((c: any) => (
                        <div key={c.id} title={`${c.name}: ${c.state}`}>
                          <StatusDot status={c.state} />
                        </div>
                      )) : <span className="text-[10px] text-muted-foreground italic">No data</span>}
                    </div>
                  </div>
                </div>
              </section>

              {/* GitHub Context */}
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Github className="w-5 h-5" /> GitHub Integration
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <QuickLinkItem label="Source Code" url={getGithubLink("")} icon={<Code />} />
                  <QuickLinkItem label="Actions / CI" url={getGithubLink("/actions")} icon={<Activity />} />
                  <QuickLinkItem label="Issues" url={getGithubLink("/issues")} icon={<MessageSquare />} />
                  <QuickLinkItem label="Secrets" url={getGithubLink("/settings/secrets/actions")} icon={<ShieldCheck />} />
                </div>
              </section>

              {/* Cloudflare Infrastructure */}
              {isCloudflare && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-orange-500" /> Cloudflare Resources
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isWorker ? (
                      <QuickLinkItem label="Worker Production" url={getCloudflareLink("workers")} icon={<Cloud />} />
                    ) : (
                      <QuickLinkItem label="Pages Deployment" url={getCloudflareLink("pages")} icon={<Cloud />} />
                    )}
                    <QuickLinkItem label="D1 Database" url={getCloudflareLink("d1")} icon={<Database />} />
                    <QuickLinkItem label="R2 Storage" url={getCloudflareLink("r2")} icon={<HardDrive />} />
                  </div>
                </section>
              )}

              {/* Docker Infrastructure */}
              {isDocker && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Container className="w-5 h-5 text-blue-500" /> Docker & Portainer
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <QuickLinkItem label={`Stack: ${stackName}`} url={getPortainerLink("stack")} icon={<Layout />} />
                    {(health?.docker?.containers || []).map((c: any) => (
                      <div key={c.id} className="relative group/link">
                        <QuickLinkItem label={`Logs: ${c.name}`} url={getPortainerLink("logs", c.id)} icon={<Terminal className={c.state === 'running' ? 'text-green-500' : 'text-destructive'} />} />
                        <span className="absolute bottom-1 right-3 text-[8px] font-mono opacity-50 uppercase">{c.status}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Custom Links */}
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" /> Project Links
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(project.quickLinks || []).map((link: any) => (
                    <div key={link.id} className="relative group/link">
                      <QuickLinkItem label={link.label} url={link.url} />
                      <button onClick={() => handleDeleteLink(link.id)} className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover/link:opacity-100 transition-opacity shadow-lg">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {showAddLink ? (
                    <form onSubmit={handleAddLink} className="p-4 rounded-lg border bg-card space-y-3 shadow-inner">
                      <input className="w-full p-2 border rounded-md text-sm" placeholder="Label" value={newLink.label} onChange={(e) => setNewLink({ ...newLink, label: e.target.value })} required />
                      <input className="w-full p-2 border rounded-md text-sm" placeholder="URL" type="url" value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} required />
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Add</button>
                        <button type="button" onClick={() => setShowAddLink(false)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setShowAddLink(true)} className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary transition-all">
                      <Plus className="w-4 h-4" /> Add Link
                    </button>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar Meta */}
            <div className="space-y-8">
              <section className="rounded-lg border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Project Meta</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">GitHub Repo</span>
                    <span className="font-mono text-xs truncate max-w-[150px]">{githubRepo || "Not linked"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sync</span>
                    <span>{new Date(getVal(project, 'updatedAt')).toLocaleDateString()}</span>
                  </div>
                </div>
                <button onClick={handleSyncWithGithub} disabled={syncing} className="w-full mt-6 py-2 border rounded-md text-xs font-bold hover:bg-muted transition-all flex items-center justify-center gap-2">
                   {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sync Repo Files
                </button>
              </section>
            </div>
          </div>
        )}

        {activeTab === "intelligence" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-card border rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-500" /> Intelligence Stack
                  </h2>
                  <button onClick={() => isEditingIntel ? handleUpdateProject() : setIsEditingIntelligence(true)} className="text-sm font-bold text-primary flex items-center gap-1">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditingIntel ? <Save className="w-4 h-4" /> : <SettingsIcon className="w-4 h-4" />}
                    {isEditingIntel ? "Save" : "Edit"}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Coding Agents</label>
                    {isEditingIntel ? (
                      <input className="w-full p-2 border rounded-md text-sm" value={project.codingAgents || ""} onChange={(e) => setProject({ ...project, codingAgents: e.target.value })} />
                    ) : (
                      <div className="p-3 bg-muted rounded-md font-medium">{project.codingAgents || "None"}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">AI Model</label>
                    {isEditingIntel ? (
                      <input className="w-full p-2 border rounded-md text-sm" value={project.primaryModel || ""} onChange={(e) => setProject({ ...project, primaryModel: e.target.value })} />
                    ) : (
                      <div className="p-3 bg-muted rounded-md font-medium">{project.primaryModel || "None"}</div>
                    )}
                  </div>
                </div>

                {isEditingIntel && (
                  <div className="mt-8 pt-8 border-t space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-4">
                      <h3 className="font-bold text-orange-600 text-xs uppercase tracking-widest flex items-center gap-2"><Cloud className="w-4 h-4" /> Cloudflare Config</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Pages Name</label>
                          <input className="w-full p-2 border rounded-md text-sm" value={cfProjName || ""} onChange={(e) => setProject({ ...project, cloudflareProjectName: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Worker Name</label>
                          <input className="w-full p-2 border rounded-md text-sm" value={workerName || ""} onChange={(e) => setProject({ ...project, cloudflareWorkerName: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="isWorker" checked={!!isWorker} onChange={(e) => setProject({ ...project, isWorker: e.target.checked })} />
                          <label htmlFor="isWorker" className="text-sm font-medium">This is a Worker</label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-blue-600 text-xs uppercase tracking-widest flex items-center gap-2"><Container className="w-4 h-4" /> Docker Config</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Target Server</label>
                          <select className="w-full p-2 border rounded-md text-sm bg-background" value={serverId || ""} onChange={(e) => setProject({ ...project, serverId: e.target.value })}>
                            <option value="">Select a Server</option>
                            {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Stack Name</label>
                          <input className="w-full p-2 border rounded-md text-sm" value={stackName || ""} onChange={(e) => setProject({ ...project, portainerStackName: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Production URL</label>
                          <input className="w-full p-2 border rounded-md text-sm" value={prodUrl || ""} onChange={(e) => setProject({ ...project, prodUrl: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Instructions URL</label>
                          <input className="w-full p-2 border rounded-md text-sm" value={project.agentInstructionsUrl || ""} onChange={(e) => setProject({ ...project, agentInstructionsUrl: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {activeTab === "docs" && <MarkdownEditor projectId={project.id} />}
      </div>
    </div>
  );
}

function QuickLinkItem({ label, url, icon }: { label: string, url: string | null, icon?: React.ReactNode }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary transition-colors group shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded bg-muted">
          {icon ? React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4 text-primary" }) : <LinkIcon className="w-4 h-4 text-primary" />}
        </div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </a>
  );
}
