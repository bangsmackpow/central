import React, { useEffect, useState } from "react";
import { LogOut, Folder, Plus, Link as LinkIcon, ExternalLink, FileText } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import ProjectCard from "./ProjectCard";
import ProjectDetails from "./ProjectDetails";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  thumbnailUrl: string | null;
  quickLinks: Array<{ label: string; url: string }>;
  updatedAt: string;
}

export default function Dashboard({ user, onViewProject }: { user: any, onViewProject: (id: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
  };

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            Central
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <button
            onClick={() => setSelectedProject(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${!selectedProject ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted'}`}
          >
            Dashboard Overview
          </button>
          <div className="pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
            Projects
          </div>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${selectedProject?.id === p.id ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted'}`}
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              {p.name}
            </button>
          ))}
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted transition-colors mt-4">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </nav>
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {user.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {selectedProject ? (
          <ProjectDetails project={selectedProject} />
        ) : (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Welcome back, {user.name.split(' ')[0]}</h1>
              <p className="text-muted-foreground">Here is what's happening across your projects.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-48 rounded-lg border bg-card animate-pulse" />
                ))
              ) : projects.length === 0 ? (
                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">No projects found. Create your first one to get started.</p>
                </div>
              ) : (
                projects.map((p) => (
                  <ProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
