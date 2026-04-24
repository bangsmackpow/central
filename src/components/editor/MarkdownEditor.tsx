import React, { useState, useEffect } from "react";
import { Eye, Code, Save, Loader2 } from "lucide-react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";

export default function MarkdownEditor({ projectId }: { projectId: string }) {
  const [content, setContent] = useState("");
  const [html, setHtml] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/docs`)
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content);
        setLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    if (mode === "preview") {
      renderMarkdown(content);
    }
  }, [mode, content]);

  const renderMarkdown = async (md: string) => {
    const result = await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeHighlight)
      .use(rehypeStringify)
      .process(md);
    setHtml(String(result));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex bg-muted p-1 rounded-md">
          <button
            onClick={() => setMode("edit")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium transition-all ${mode === "edit" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Code className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setMode("preview")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium transition-all ${mode === "preview" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="flex-1 min-h-[500px] border rounded-lg overflow-hidden bg-card">
        {mode === "edit" ? (
          <textarea
            className="w-full h-full p-6 bg-transparent font-mono text-sm resize-none focus:outline-none"
            placeholder="Write your project documentation in Markdown..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        ) : (
          <div
            className="prose prose-sm dark:prose-invert max-w-none p-8 overflow-y-auto h-full markdown-preview"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
