"use client";

import {
  ClipboardPaste,
  Link as LinkIcon,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SampleViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sample: {
    id: string;
    sourceType: "paste" | "url" | "file";
    sourceUrl?: string | null;
    fileName?: string | null;
    content: string;
    wordCount: number;
    createdAt: Date | string;
  } | null;
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
 * SampleViewDialog Component
 *
 * Dialog for viewing the full content of a writing sample.
 */
export function SampleViewDialog({
  open,
  onOpenChange,
  sample,
}: SampleViewDialogProps) {
  if (!sample) return null;

  const Icon = sourceTypeIcons[sample.sourceType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            Sample Content
          </DialogTitle>
        </DialogHeader>

        {/* Metadata */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {sample.wordCount} words
          </Badge>
          <Badge variant="outline" className="text-xs">
            {sourceTypeLabels[sample.sourceType]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Added {formatDate(sample.createdAt)}
          </span>
        </div>

        {/* Source URL or filename */}
        {sample.sourceUrl && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LinkIcon className="h-4 w-4 flex-shrink-0" />
            <a
              href={sample.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-primary hover:underline flex items-center gap-1"
            >
              {sample.sourceUrl}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>
        )}
        {sample.fileName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{sample.fileName}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 mt-2">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {sample.content}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
