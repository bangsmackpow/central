import React, { useState, useEffect } from "react";
import { Save, Github, Cloud, Settings as SettingsIcon, RefreshCw, Plus, Check } from "lucide-react";
import { Settings } from "../../types";

export default function AdminPanel() {
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"config" | "sync">("config");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data);
    setLoading(false);
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Control Center</h1>
          <p className="text-muted-foreground">Manage your integrations and project synchronization.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("config")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "config" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            <SettingsIcon className="w-4 h-4 inline mr-2" />
            Configuration
          </button>
          <button
            onClick={() => setActiveTab("sync")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "sync" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Project Sync
          </button>
        </div>
      </div>

      {activeTab === "config" ? (
        <div className="grid gap-8">
          <section className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Github className="w-5 h-5" />
              GitHub Integration
            </h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">GitHub Username / Org</label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={settings.githubUsername || ""}
                  onChange={(e) => setSettings({ ...settings, githubUsername: e.target.value })}
                  placeholder="e.g. bangsmackpow"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Personal Access Token (PAT)</label>
                <input
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={settings.githubPat || ""}
                  onChange={(e) => setSettings({ ...settings, githubPat: e.target.value })}
                  placeholder={(settings as any).hasPat ? "••••••••••••••••" : "Paste your GitHub PAT here"}
                />
                <p className="text-xs text-muted-foreground">Requires `repo` scope to access private repositories.</p>
              </div>
              <div className="pt-4 border-t mt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-orange-500" />
                  Cloudflare Integration
                </h2>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Cloudflare Account ID</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={settings.cloudflareAccountId || ""}
                    onChange={(e) => setSettings({ ...settings, cloudflareAccountId: e.target.value })}
                    placeholder="Found in your Cloudflare dashboard URL"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </form>
          </section>

          <section className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold">Ready to sync?</h3>
              <p className="text-sm text-muted-foreground">Fetch your latest repositories and promote them to projects.</p>
            </div>
            <button
              onClick={handleSyncGithub}
              disabled={syncing || !(settings as any).hasPat}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
              Fetch Repositories
            </button>
          </section>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="font-bold">Available GitHub Repositories</h2>
          </div>
          <div className="divide-y">
            {githubRepos.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No repos fetched yet. Click "Fetch Repositories" to begin.
              </div>
            ) : (
              githubRepos.map((repo) => (
                <div key={repo.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{repo.name}</span>
                      {repo.private && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border font-mono">Private</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{repo.description || "No description"}</p>
                  </div>
                  <button
                    onClick={() => handlePromoteRepo(repo)}
                    className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    Promote to Project
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
