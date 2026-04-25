import React from "react";
import { ExternalLink, Calendar, Cloud, Container } from "lucide-react";
import { Project } from "../../types";

export default function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  // Helper to normalize properties
  const getVal = (obj: any, key: string) => {
    const snake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return obj[key] !== undefined ? obj[key] : obj[snake];
  };

  const isCf = getVal(project, 'isCloudflareProject') || getVal(project, 'prodUrl')?.includes(".pages.dev");
  const isDocker = getVal(project, 'isDockerProject') || !!getVal(project, 'portainerStackName');

  return (
    <div
      onClick={onClick}
      className="group rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
    >
      <div className="aspect-video w-full bg-muted relative">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground italic text-sm">
            {project.name[0]}
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {isCf && <div className="px-2 py-1 rounded bg-orange-500/80 text-white text-[10px] font-bold uppercase flex items-center gap-1"><Cloud className="w-2 h-2" /> CF</div>}
          {isDocker && <div className="px-2 py-1 rounded bg-blue-500/80 text-white text-[10px] font-bold uppercase flex items-center gap-1"><Container className="w-2 h-2" /> Docker</div>}
        </div>
      </div>
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
            {project.name}
          </h3>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {project.description || "No description provided."}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 mt-auto">
          <Calendar className="w-3 h-3" />
          {new Date(getVal(project, 'updatedAt')).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
