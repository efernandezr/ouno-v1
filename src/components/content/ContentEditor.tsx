"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Eye, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ContentStatus } from "@/types/content";
import { ContentViewer } from "./ContentViewer";

interface ContentEditorProps {
  contentId: string;
  initialTitle: string;
  initialContent: string;
  wordCount: number;
  readTimeMinutes: number;
  status: ContentStatus;
  createdAt: Date;
  version?: number;
  onSave: (title: string, content: string) => Promise<void>;
}

export function ContentEditor({
  initialTitle,
  initialContent,
  wordCount,
  readTimeMinutes,
  status,
  createdAt,
  version,
  onSave,
}: ContentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track changes
  useEffect(() => {
    const titleChanged = title !== initialTitle;
    const contentChanged = content !== initialContent;
    setHasChanges(titleChanged || contentChanged);
  }, [title, content, initialTitle, initialContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content, isEditing]);

  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(title, content);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
      // Could show a toast notification here
    } finally {
      setIsSaving(false);
    }
  }, [title, content, hasChanges, onSave]);

  const handleCancel = useCallback(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    setIsEditing(false);
  }, [initialTitle, initialContent]);

  // Calculate live word count in edit mode
  const liveWordCount = content
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  if (!isEditing) {
    return (
      <div className="relative">
        <div className="absolute top-0 right-0 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        </div>
        <ContentViewer
          title={title}
          content={content}
          wordCount={wordCount}
          readTimeMinutes={readTimeMinutes}
          status={status}
          createdAt={createdAt}
          {...(version !== undefined && { version })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Edit toolbar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <Edit2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Editing • {liveWordCount.toLocaleString()} words
            {hasChanges && (
              <span className="ml-2 text-amber-500">(unsaved changes)</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Title input */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter title..."
        className="text-2xl font-bold h-auto py-3 border-none shadow-none focus-visible:ring-0 px-0"
      />

      {/* Content textarea */}
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing..."
        className="min-h-[500px] resize-none font-mono text-sm leading-relaxed border-none shadow-none focus-visible:ring-0 px-0"
      />

      {/* Editor help text */}
      <div className="text-xs text-muted-foreground">
        <p>
          <strong>Tip:</strong> Use Markdown formatting • # Heading 1 • ##
          Heading 2 • **bold** • *italic* • {">"} blockquote
        </p>
      </div>
    </div>
  );
}
