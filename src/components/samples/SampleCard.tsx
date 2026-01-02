"use client";

import { useState } from "react";
import {
  ClipboardPaste,
  Link as LinkIcon,
  FileText,
  Trash2,
  Loader2,
  Eye,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SampleViewDialog } from "./SampleViewDialog";

export interface Sample {
  id: string;
  sourceType: "paste" | "url" | "file";
  sourceUrl?: string | null;
  fileName?: string | null;
  preview: string;
  wordCount: number;
  analyzedAt?: Date | string | null;
  createdAt: Date | string;
}

interface FullSample {
  id: string;
  sourceType: "paste" | "url" | "file";
  sourceUrl?: string | null;
  fileName?: string | null;
  content: string;
  wordCount: number;
  createdAt: Date | string;
}

interface SampleCardProps {
  sample: Sample;
  onDelete: (id: string) => Promise<void>;
}

const sourceTypeIcons = {
  paste: ClipboardPaste,
  url: LinkIcon,
  file: FileText,
};

const sourceTypeLabels = {
  paste: "Pasted",
  url: "URL",
  file: "File",
};

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * SampleCard Component
 *
 * Displays a single writing sample with metadata and delete action.
 */
export function SampleCard({ sample, onDelete }: SampleCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [fullSample, setFullSample] = useState<FullSample | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const Icon = sourceTypeIcons[sample.sourceType];

  const handleView = async () => {
    setViewDialogOpen(true);

    // Only fetch if we don't have the content yet
    if (fullSample?.id === sample.id) return;

    setIsLoadingContent(true);
    try {
      const response = await fetch(`/api/samples/${sample.id}`);
      if (response.ok) {
        const data = await response.json();
        setFullSample(data.sample);
      }
    } catch (error) {
      console.error("Failed to fetch sample content:", error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(sample.id);
      setDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Determine display text based on source type
  const displayText =
    sample.sourceType === "file"
      ? sample.fileName || "Uploaded file"
      : sample.sourceType === "url"
        ? sample.sourceUrl || sample.preview
        : sample.preview;

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={displayText}>
          {displayText}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {sample.wordCount} words
          </Badge>
          <Badge variant="outline" className="text-xs">
            {sourceTypeLabels[sample.sourceType]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(sample.createdAt)}
          </span>
        </div>
      </div>

      {/* View button */}
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 text-muted-foreground hover:text-primary"
        onClick={handleView}
        disabled={isLoadingContent}
      >
        {isLoadingContent ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>

      {/* Delete button */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-muted-foreground hover:text-destructive"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Writing Sample</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this writing sample? This action
              cannot be undone and may affect your calibration score.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View dialog */}
      <SampleViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        sample={fullSample}
      />
    </div>
  );
}
