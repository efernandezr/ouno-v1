"use client";

import {
  FileText,
  Link as LinkIcon,
  ClipboardPaste,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSampleUpload, type UploadedSample } from "@/hooks/useSampleUpload";

interface SampleUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (sample: UploadedSample) => void;
}

/**
 * SampleUploadDialog Component
 *
 * Dialog for uploading writing samples via paste, URL, or file.
 * Uses the shared useSampleUpload hook for logic.
 */
export function SampleUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: SampleUploadDialogProps) {
  const {
    mode,
    setMode,
    pasteContent,
    setPasteContent,
    urlInput,
    setUrlInput,
    isUploading,
    error,
    handlePasteSubmit,
    handleUrlSubmit,
    handleFileChange,
    reset,
    clearError,
  } = useSampleUpload({
    onSuccess: (sample) => {
      onSuccess(sample);
      reset();
      onOpenChange(false);
    },
  });

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
    }
    onOpenChange(isOpen);
  };

  // Select mode - show upload options
  if (mode === "select") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Add Writing Sample
            </DialogTitle>
            <DialogDescription>
              Add a sample of your existing writing to improve Voice DNA accuracy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Upload options */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => {
                  clearError();
                  setMode("paste");
                }}
              >
                <ClipboardPaste className="h-6 w-6 text-primary" />
                <span className="text-xs">Paste Text</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => {
                  clearError();
                  setMode("url");
                }}
              >
                <LinkIcon className="h-6 w-6 text-primary" />
                <span className="text-xs">From URL</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col h-auto py-4 gap-2 relative"
                asChild
              >
                <label>
                  <Plus className="h-6 w-6 text-primary" />
                  <span className="text-xs">Upload File</span>
                  <input
                    type="file"
                    accept=".txt,.md,text/plain,text/markdown"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
              </Button>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {/* Loading state for file upload */}
            {isUploading && mode === "select" && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing file...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Paste mode
  if (mode === "paste") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Paste Your Writing</DialogTitle>
            <DialogDescription>
              Paste a blog post, article, or any writing sample (minimum 100
              characters).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Paste your writing sample here..."
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              className="min-h-[180px]"
              autoFocus
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {pasteContent.split(/\s+/).filter(Boolean).length} words
              </span>
              {pasteContent.length < 100 && pasteContent.length > 0 && (
                <span className="text-destructive">
                  {100 - pasteContent.length} more characters needed
                </span>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setMode("select");
                  clearError();
                }}
                disabled={isUploading}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handlePasteSubmit}
                disabled={isUploading || pasteContent.length < 100}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Add Sample"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // URL mode
  if (mode === "url") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import from URL</DialogTitle>
            <DialogDescription>
              Enter the URL of a blog post or article you&apos;ve written.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              type="url"
              placeholder="https://example.com/your-article"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              autoFocus
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setMode("select");
                  clearError();
                }}
                disabled={isUploading}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleUrlSubmit}
                disabled={isUploading || !urlInput.trim()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Import Article"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
