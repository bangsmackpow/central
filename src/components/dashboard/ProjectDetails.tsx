import React, { useState } from "react";
import { Link as LinkIcon, ExternalLink, Layout } from "lucide-react";
import { Project } from "../../types";
import MarkdownEditor from "../editor/MarkdownEditor";

export default function ProjectDetails({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<"overview" | "docs">("overview");

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
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("docs")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "docs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Documentation
          </button>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === "overview" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  Quick Links
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(project.quickLinks || []).map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-muted">
                          <LinkIcon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{link.label}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  ))}
                  <button className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary transition-all">
                    <Plus className="w-4 h-4" />
                    Add Link
                  </button>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Project Meta</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-mono text-xs">{project.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <MarkdownEditor projectId={project.id} />
        )}
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}
