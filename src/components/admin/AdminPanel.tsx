import React, { useState, useEffect } from "react";
import { Save, Github, Cloud, Settings as SettingsIcon, RefreshCw, Plus, Trash2, Server as ServerIcon, ExternalLink, ShieldCheck } from "lucide-react";
import { Settings, Server } from "../../types";

export default function AdminPanel() {
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [servers, setServers] = useState<Server[]>([]);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"config" | "servers" | "sync">("config");

  // New Server Form
  const [newServer, setNewServer] = useState({ name: "", url: "", apiKey: "" });

  useEffect(() => {
    fetchSettings();
    fetchServers();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data);
    setLoading(false);
  };

  const fetchServers = async () => {
    const res = await fetch("/api/servers");
    const data = await res.json();
    setServers(data);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    fetchSettings();
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newServer),
    });
    if (res.ok) {
      setNewServer({ name: "", url: "", apiKey: "" });
      fetchServers();
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm("Delete this server configuration?")) return;
    await fetch(`/api/servers/${id}`, { method: "DELETE" });
    fetchServers();
  };

  const handleSyncGithub = async () => {
    setSyncing(true);
    const res = await fetch("/api/github/repos");
    const data = await res.json();
    if (data.error) {
      alert(data.error);
    } else {
      setGithubRepos(data);
      setActiveTab("sync");
    }
    setSyncing(false);
  };

  const handlePromoteRepo = async (repo: any) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: repo.name,
        description: repo.description,
        githubRepoId: repo.id,
        githubRepoFullName: repo.full_name,
        status: "active",
      }),
    });
    if (res.ok) {
      alert(`Project "${repo.name}" created!`);
    }
  };

  if (loading) return <div className="p-8">Loading Settings...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Control Center</h1>
          <p className="text-muted-foreground">Configure your GitHub, Cloudflare, and Portainer environments.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-md">
          <button
            onClick={() => setActiveTab("config")}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-all ${activeTab === "config" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <SettingsIcon className="w-4 h-4 inline mr-2" />
            Integrations
          </button>
          <button
            onClick={() => setActiveTab("servers")}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-all ${activeTab === "servers" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ServerIcon className="w-4 h-4 inline mr-2" />
            Docker Servers
          </button>
          <button
            onClick={() => setActiveTab("sync")}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-all ${activeTab === "sync" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Sync Repos
          </button>
        </div>
      </div>

      {activeTab === "config" && (
        <div className="grid gap-8">
          <section className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 border-b pb-4">
              <Github className="w-5 h-5" />
              GitHub Connectivity
            </h2>
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase text-muted-foreground">GitHub Account</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                    value={settings.githubUsername || ""}
                    onChange={(e) => setSettings({ ...settings, githubUsername: e.target.value })}
                    placeholder="Username or Org"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase text-muted-foreground">Personal Access Token</label>
                  <input
                    type="password"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                    value={settings.githubPat || ""}
                    onChange={(e) => setSettings({ ...settings, githubPat: e.target.value })}
                    placeholder={(settings as any).hasPat ? "••••••••••••••••" : "Paste PAT"}
                  />
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2 border-b pb-4">
                <Cloud className="w-5 h-5 text-orange-500" />
                Cloudflare Ecosystem
              </h2>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase text-muted-foreground">Cloudflare Account ID</label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                  value={settings.cloudflareAccountId || ""}
                  onChange={(e) => setSettings({ ...settings, cloudflareAccountId: e.target.value })}
                  placeholder="32-character ID"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-4 w-full md:w-auto inline-flex items-center justify-center rounded-md bg-primary px-8 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Update Integrations"}
              </button>
            </form>
          </section>
        </div>
      )}

      {activeTab === "servers" && (
        <div className="grid gap-8">
          <section className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 border-b pb-4">
              <ServerIcon className="w-5 h-5" />
              Add Portainer Server
            </h2>
            <form onSubmit={handleAddServer} className="grid md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Server Name</label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newServer.name}
                  onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                  placeholder="e.g. Home Lab"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Portainer URL</label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newServer.url}
                  onChange={(e) => setNewServer({ ...newServer, url: e.target.value })}
                  placeholder="https://portainer.example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">API Token</label>
                <input
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newServer.apiKey}
                  onChange={(e) => setNewServer({ ...newServer, apiKey: e.target.value })}
                  placeholder="ptr_..."
                  required
                />
              </div>
              <button type="submit" className="md:col-span-3 py-2.5 bg-primary text-primary-foreground rounded-md font-bold text-sm hover:bg-primary/90 transition-all">
                Add Server Environment
              </button>
            </form>
          </section>

          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
              <h2 className="font-bold">Managed Server Instances</h2>
              <span className="text-xs text-muted-foreground font-medium">{servers.length} Servers</span>
            </div>
            <div className="divide-y">
              {servers.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground italic">No servers configured yet.</div>
              ) : (
                servers.map((server) => (
                  <div key={server.id} className="p-4 flex items-center justify-between hover:bg-muted/10">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/5 rounded-full text-primary">
                        <ServerIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold">{server.name}</h3>
                        <p className="text-xs font-mono text-muted-foreground">{server.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {server.hasKey && <ShieldCheck className="w-4 h-4 text-green-500" title="API Key Configured" />}
                      <button onClick={() => handleDeleteServer(server.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "sync" && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Import from GitHub</h2>
              <p className="text-sm text-muted-foreground">Select a repository to promote it to a project.</p>
            </div>
            <button
              onClick={handleSyncGithub}
              disabled={syncing || !(settings as any).hasPat}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Fetch Latest Repos
            </button>
          </div>
          <div className="divide-y">
            {githubRepos.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground italic">Click "Fetch Latest Repos" to begin.</div>
            ) : (
              githubRepos.map((repo) => (
                <div key={repo.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{repo.name}</span>
                      {repo.private && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border font-mono uppercase font-bold text-muted-foreground">Private</span>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{repo.description || "No description provided."}</p>
                  </div>
                  <button
                    onClick={() => handlePromoteRepo(repo)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground rounded-md text-xs font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Promote
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
