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
  RefreshCw
} from "lucide-react";
import { Project, Settings } from "../../types";
import MarkdownEditor from "../editor/MarkdownEditor";

export default function ProjectDetails({ project: initialProject }: { project: Project }) {
  const [project, setProject] = useState<Project>(initialProject);
  const [activeTab, setActiveTab] = useState<"overview" | "docs" | "intelligence">("overview");
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [isEditingIntel, setIsEditingIntelligence] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setProject(initialProject);
    fetch("/api/settings").then(res => res.json()).then(data => setSettings(data));
  }, [initialProject]);

  // Cloudflare Detection Logic
  const isCloudflare = 
    project.isCloudflareProject || 
    project.prodUrl?.includes(".pages.dev") || 
    project.prodUrl?.includes(".workers.dev") ||
    !!project.cloudflareProjectName;

  // Helper for generating GitHub links
  const getGithubLink = (path: string) => {
    if (!project.githubRepoFullName) return null;
    return `https://github.com/${project.githubRepoFullName}${path}`;
  };

  // Helper for generating Cloudflare dashboard links
  const getCloudflareLink = (type: string) => {
    const accountId = settings.cloudflareAccountId;
    if (!accountId) return null;
    if (type === "pages") {
      return `https://dash.cloudflare.com/${accountId}/pages/view/${project.cloudflareProjectName || project.name}`;
    }
    if (type === "d1") return `https://dash.cloudflare.com/${accountId}/d1`;
    if (type === "r2") return `https://dash.cloudflare.com/${accountId}/r2/overview`;
    return null;
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
        prodUrl: project.prodUrl,
        stagingUrl: project.stagingUrl,
        isCloudflareProject: project.isCloudflareProject,
        cloudflareProjectName: project.cloudflareProjectName,
      }),
    });
    if (res.ok) {
      setIsEditingIntelligence(false);
    }
    setSaving(false);
  };

  const handleSyncWithGithub = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        // Update local state with new metadata
        setProject({
          ...project,
          ...data.meta,
          updatedAt: new Date()
        });
        alert("Synced successfully with GitHub!");
      } else {
        alert(data.error || "Sync failed");
      }
    } catch (e) {
      alert("An error occurred during sync.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="bg-card border-b p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold uppercase">
                {project.status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">{project.description}</p>
          </div>
          <div className="flex gap-2">
            {project.prodUrl && (
              <a href={project.prodUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-md text-sm font-medium hover:bg-green-500/20">
                <Globe className="w-4 h-4" /> Live
              </a>
            )}
            {project.githubRepoFullName && (
              <a href={`https://github.com/${project.githubRepoFullName}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm font-medium hover:bg-muted/80">
                <Github className="w-4 h-4" /> Repo
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setActiveTab("overview")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            Overview
          </button>
          <button onClick={() => setActiveTab("intelligence")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "intelligence" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            Intelligence
          </button>
          <button onClick={() => setActiveTab("docs")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "docs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            Documentation
          </button>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* GitHub Auto-Links */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    GitHub Context
                  </h2>
                  {project.githubRepoFullName && (
                    <button 
                      onClick={handleSyncWithGithub}
                      disabled={syncing}
                      className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      {syncing ? "Syncing..." : "Sync Metadata"}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <QuickLinkItem label="Source Code" url={getGithubLink("")} icon={<Code />} />
                  <QuickLinkItem label="Issues" url={getGithubLink("/issues")} icon={<MessageSquare />} />
                  <QuickLinkItem label="Actions / CI" url={getGithubLink("/actions")} icon={<Activity />} />
                  <QuickLinkItem label="Secrets & Variables" url={getGithubLink("/settings/secrets/actions")} icon={<ShieldCheck />} />
                </div>
              </section>

              {/* Cloudflare Auto-Links (Dynamic) */}
              {isCloudflare && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-orange-500" />
                    Cloudflare Infrastructure
                  </h2>
                  {!settings.cloudflareAccountId ? (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-md text-orange-800 text-sm">
                      Please configure your <strong>Cloudflare Account ID</strong> in the Admin Panel to enable deep-linking.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <QuickLinkItem label="Pages Deployment" url={getCloudflareLink("pages")} icon={<Cloud />} />
                      <QuickLinkItem label="D1 Database" url={getCloudflareLink("d1")} icon={<Layout />} />
                      <QuickLinkItem label="R2 Storage" url={getCloudflareLink("r2")} icon={<Layout />} />
                    </div>
                  )}
                </section>
              )}

              {/* Custom Links */}
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Project Links
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(project.quickLinks || []).map((link, i) => (
                    <QuickLinkItem key={i} label={link.label} url={link.url} />
                  ))}
                  <button className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary transition-all">
                    <Plus className="w-4 h-4" />
                    Add Custom Link
                  </button>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Project Meta</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">GitHub Repo</span>
                    <span className="font-mono text-xs truncate max-w-[150px]">{project.githubRepoFullName || "Not linked"}</span>
                  </div>
                  {isCloudflare && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">CF Name</span>
                      <span className="font-mono text-xs">{project.cloudflareProjectName || project.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "intelligence" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-500" />
                    Agent Intelligence Stack
                  </h2>
                  <button 
                    onClick={() => isEditingIntel ? handleUpdateProject() : setIsEditingIntelligence(true)}
                    className="text-sm font-bold text-primary flex items-center gap-1"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditingIntel ? <Save className="w-4 h-4" /> : <SettingsIcon className="w-4 h-4" />}
                    {isEditingIntel ? "Save Changes" : "Edit Config"}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coding Agents</label>
                    {isEditingIntel ? (
                      <input 
                        className="w-full p-2 border rounded-md text-sm"
                        value={project.codingAgents || ""}
                        onChange={(e) => setProject({ ...project, codingAgents: e.target.value })}
                        placeholder="e.g. Gemini, OpenCode"
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md font-medium">
                        {project.codingAgents || "Not documented"}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary AI Model</label>
                    {isEditingIntel ? (
                      <input 
                        className="w-full p-2 border rounded-md text-sm"
                        value={project.primaryModel || ""}
                        onChange={(e) => setProject({ ...project, primaryModel: e.target.value })}
                        placeholder="e.g. GPT-4o, Claude 3.5 Sonnet"
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md font-medium">
                        {project.primaryModel || "Not documented"}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-8 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Agent Instructions / Prompts (URL)</label>
                  {isEditingIntel ? (
                    <input 
                      className="w-full p-2 border rounded-md text-sm"
                      value={project.agentInstructionsUrl || ""}
                      onChange={(e) => setProject({ ...project, agentInstructionsUrl: e.target.value })}
                      placeholder="https://github.com/.../docs/PROMPTS.md"
                    />
                  ) : project.agentInstructionsUrl ? (
                    <a href={project.agentInstructionsUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 border rounded-md hover:bg-muted transition-colors">
                      <span className="font-medium">System Instructions & Prompts</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="p-4 border-2 border-dashed rounded-md text-center text-muted-foreground italic text-sm">
                      No instruction URL linked.
                    </div>
                  )}
                </div>

                {isEditingIntel && (
                  <div className="mt-8 pt-8 border-t space-y-4">
                    <h3 className="font-bold text-sm uppercase text-muted-foreground">External Links & Deployment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Production URL</label>
                        <input 
                          className="w-full p-2 border rounded-md text-sm"
                          value={project.prodUrl || ""}
                          onChange={(e) => setProject({ ...project, prodUrl: e.target.value })}
                          placeholder="https://myapp.pages.dev"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Staging URL</label>
                        <input 
                          className="w-full p-2 border rounded-md text-sm"
                          value={project.stagingUrl || ""}
                          onChange={(e) => setProject({ ...project, stagingUrl: e.target.value })}
                          placeholder="https://staging.myapp.com"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <input 
                          type="checkbox"
                          id="isCf"
                          checked={!!project.isCloudflareProject}
                          onChange={(e) => setProject({ ...project, isCloudflareProject: e.target.checked })}
                        />
                        <label htmlFor="isCf" className="text-sm font-medium">Force Cloudflare Links</label>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">CF Project Name (if different)</label>
                        <input 
                          className="w-full p-2 border rounded-md text-sm"
                          value={project.cloudflareProjectName || ""}
                          onChange={(e) => setProject({ ...project, cloudflareProjectName: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {activeTab === "docs" && (
          <MarkdownEditor projectId={project.id} />
        )}
      </div>
    </div>
  );
}

function QuickLinkItem({ label, url, icon }: { label: string, url: string | null, icon?: React.ReactNode }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded bg-muted">
          {icon ? React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4 text-primary" }) : <LinkIcon className="w-4 h-4 text-primary" />}
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </a>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}
