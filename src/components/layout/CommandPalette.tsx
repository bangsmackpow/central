import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { 
  Search, 
  Folder, 
  Github, 
  Cloud, 
  Container, 
  Settings, 
  Activity, 
  Terminal,
  ExternalLink,
  Code
} from "lucide-react";
import { Project } from "../../types";

interface CommandPaletteProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onNavigateAdmin: () => void;
}

export default function CommandPalette({ projects, onSelectProject, onNavigateAdmin }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen} 
      label="Global Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="w-full max-w-[640px] bg-card border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="w-5 h-5 mr-3 text-muted-foreground" />
          <Command.Input 
            autoFocus
            placeholder="Search projects, links, or actions..." 
            className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">ESC</span>
          </kbd>
        </div>

        <Command.List className="max-h-[350px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          <Command.Group heading="Projects" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {projects.map((p) => (
              <Command.Item
                key={p.id}
                onSelect={() => runCommand(() => onSelectProject(p))}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground transition-colors group"
              >
                <Folder className="w-4 h-4" />
                <span className="flex-1 font-medium">{p.name}</span>
                <span className="text-[10px] opacity-50 group-aria-selected:opacity-100">{p.status}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Infrastructure Quick Links" className="px-2 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Command.Item
              onSelect={() => runCommand(() => onNavigateAdmin())}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground transition-colors"
            >
              <Settings className="w-4 h-4" />
              Go to Admin Panel
            </Command.Item>
            
            {projects.filter(p => p.githubRepoFullName).slice(0, 5).map(p => (
              <Command.Item
                key={`gh-${p.id}`}
                onSelect={() => runCommand(() => window.open(`https://github.com/${p.githubRepoFullName}`, '_blank'))}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground transition-colors"
              >
                <Github className="w-4 h-4 text-muted-foreground group-aria-selected:text-primary-foreground" />
                <span>Open {p.name} on GitHub</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-30" />
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="System Actions" className="px-2 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t mt-2 pt-4">
             <Command.Item
              onSelect={() => runCommand(() => window.open('https://dash.cloudflare.com', '_blank'))}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground transition-colors"
            >
              <Cloud className="w-4 h-4 text-orange-500" />
              Cloudflare Dashboard
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => window.location.reload())}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Force Refresh Data
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-between border-t bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><kbd className="border bg-background px-1 rounded">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="border bg-background px-1 rounded">Enter</kbd> Select</span>
          </div>
          <span className="opacity-50">Press <kbd className="border bg-background px-1 rounded">ESC</kbd> to close</span>
        </div>
      </div>
    </Command.Dialog>
  );
}

function RefreshCw({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
  );
}
