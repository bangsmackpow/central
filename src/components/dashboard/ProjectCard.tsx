import React from "react";
import { ExternalLink, Calendar, Cloud, Container, Github, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { Project } from "../../types";

interface PulseData {
  github?: string;
  cloudflare?: string;
  docker?: string;
}

export default function ProjectCard({ project, pulse, onClick }: { project: Project; pulse?: PulseData; onClick: () => void }) {
  const getVal = (obj: any, key: string) => {
    const snake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return obj[key] !== undefined ? obj[key] : obj[snake];
  };

  const isCf = getVal(project, 'isCloudflareProject') || getVal(project, 'prodUrl')?.includes(".pages.dev");
  const isDocker = getVal(project, 'isDockerProject') || !!getVal(project, 'portainerStackName');
  const githubRepo = getVal(project, 'githubRepoFullName');

  const StatusIcon = ({ status, type }: { status?: string, type: 'github' | 'cloudflare' | 'docker' }) => {
    if (!status || status === 'unknown') return <AlertCircle className="w-3 h-3 text-muted-foreground/40" />;
    
    // GitHub conclusions: success, failure, neutral, cancelled, timed_out, action_required, stale
    // Cloudflare statuses: success, failure, active, inactive
    const isSuccess = ['success', 'active', 'completed'].includes(status);
    const isFailure = ['failure', 'inactive', 'failed', 'timed_out'].includes(status);
    const isPending = ['in_progress', 'queued', 'waiting', 'pending'].includes(status);

    if (isSuccess) return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    if (isFailure) return <XCircle className="w-3 h-3 text-destructive" />;
    if (isPending) return <Clock className="w-3 h-3 text-blue-500 animate-pulse" />;
    return <AlertCircle className="w-3 h-3 text-orange-500" />;
  };

  return (
    <div
      onClick={onClick}
      className="group rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-full"
    >
      <div className="aspect-video w-full bg-muted relative">
        {project.thumbnailUrl ? (
          <img src={project.thumbnailUrl} alt={project.name} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground/20 bg-gradient-to-br from-muted to-muted/50">
            {project.name[0]}
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {isCf && <div className="px-2 py-1 rounded bg-orange-500/90 text-white text-[9px] font-bold uppercase flex items-center gap-1 shadow-sm"><Cloud className="w-2.5 h-2.5" /> CF</div>}
          {isDocker && <div className="px-2 py-1 rounded bg-blue-500/90 text-white text-[9px] font-bold uppercase flex items-center gap-1 shadow-sm"><Container className="w-2.5 h-2.5" /> Docker</div>}
        </div>
      </div>
      
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
            {project.name}
          </h3>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {project.description || "No description provided."}
        </p>

        {/* Pulse Row */}
        <div className="flex items-center gap-4 pt-2 border-t mt-auto">
          {githubRepo && (
            <div className="flex items-center gap-1.5" title={`GitHub: ${pulse?.github || 'Unknown'}`}>
              <Github className="w-3.5 h-3.5 text-muted-foreground" />
              <StatusIcon status={pulse?.github} type="github" />
            </div>
          )}
          {isCf && (
            <div className="flex items-center gap-1.5" title={`Cloudflare: ${pulse?.cloudflare || 'Unknown'}`}>
              <Cloud className="w-3.5 h-3.5 text-muted-foreground" />
              <StatusIcon status={pulse?.cloudflare} type="cloudflare" />
            </div>
          )}
          {isDocker && (
             <div className="flex items-center gap-1.5" title="Docker Status">
               <Container className="w-3.5 h-3.5 text-muted-foreground" />
               <div className="w-2 h-2 rounded-full bg-blue-400 opacity-50" />
             </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
          <Calendar className="w-3 h-3" />
          {new Date(getVal(project, 'updatedAt')).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
