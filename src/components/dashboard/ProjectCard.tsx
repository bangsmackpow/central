import React from "react";
import { ExternalLink, Calendar } from "lucide-react";
import { Project } from "../../types";

export default function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
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
            No thumbnail
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 text-white text-[10px] font-bold uppercase">
          {project.status}
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {project.description || "No description provided."}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <Calendar className="w-3 h-3" />
          Updated {new Date(project.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
