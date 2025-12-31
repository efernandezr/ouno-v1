"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Link as LinkIcon,
  ClipboardPaste,
  Loader2,
  X,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SampleUploadStepProps {
  onComplete: () => void;
  onSkip: () => void;
  isProcessing: boolean;
}

type UploadMode = "select" | "paste" | "url" | "file";

interface UploadedSample {
  id: string;
  sourceType: "paste" | "url" | "file";
  preview: string;
  wordCount: number;
}

/**
 * SampleUploadStep Component
 *
 * Optional step where users can upload writing samples to improve
 * the written patterns aspect of their Voice DNA.
 */
export function SampleUploadStep({
  onComplete,
  onSkip,
  isProcessing,
}: SampleUploadStepProps) {
  const [mode, setMode] = useState<UploadMode>("select");
  const [pasteContent, setPasteContent] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [samples, setSamples] = useState<UploadedSample[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasteSubmit = useCallback(async () => {
    if (!pasteContent.trim() || pasteContent.trim().length < 100) {
      setError("Please enter at least 100 characters of content.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch("/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "paste",
          content: pasteContent.trim(),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to upload sample");
      }

      const result = await response.json();

      setSamples([
        ...samples,
        {
          id: result.sampleId,
          sourceType: "paste",
          preview: pasteContent.slice(0, 100) + "...",
          wordCount: result.wordCount,
        },
      ]);

      setPasteContent("");
      setMode("select");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsUploading(false);
    }
  }, [pasteContent, samples]);

  const handleUrlSubmit = useCallback(async () => {
    if (!urlInput.trim()) {
      setError("Please enter a URL.");
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput.trim());
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch("/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "url",
          sourceUrl: urlInput.trim(),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch article");
      }

      const result = await response.json();

      setSamples([
        ...samples,
        {
          id: result.sampleId,
          sourceType: "url",
          preview: urlInput.trim(),
          wordCount: result.wordCount,
        },
      ]);

      setUrlInput("");
      setMode("select");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch article");
    } finally {
      setIsUploading(false);
    }
  }, [urlInput, samples]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = [
        "text/plain",
        "text/markdown",
        "application/markdown",
      ];
      if (
        !allowedTypes.includes(file.type) &&
        !file.name.endsWith(".md") &&
        !file.name.endsWith(".txt")
      ) {
        setError("Please upload a .txt or .md file.");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const content = await file.text();

        if (content.length < 100) {
          throw new Error("File content is too short (minimum 100 characters)");
        }

        const response = await fetch("/api/samples", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: "file",
            content,
            fileName: file.name,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to upload file");
        }

        const result = await response.json();

        setSamples([
          ...samples,
          {
            id: result.sampleId,
            sourceType: "file",
            preview: file.name,
            wordCount: result.wordCount,
          },
        ]);

        setMode("select");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read file");
      } finally {
        setIsUploading(false);
        // Reset file input
        event.target.value = "";
      }
    },
    [samples]
  );

  const removeSample = useCallback(
    (id: string) => {
      setSamples(samples.filter((s) => s.id !== id));
    },
    [samples]
  );

  const handleComplete = useCallback(async () => {
    // Update onboarding status via the parent onComplete
    onComplete();
  }, [onComplete]);

  // Main selection view
  if (mode === "select") {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Add Writing Samples</CardTitle>
          <CardDescription className="text-base">
            Share examples of your existing writing to enhance your Voice DNA
            profile. This step is optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Uploaded samples list */}
          {samples.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Uploaded ({samples.length} sample{samples.length > 1 ? "s" : ""})
              </p>
              <div className="space-y-2">
                {samples.map((sample) => (
                  <div
                    key={sample.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{sample.preview}</p>
                      <p className="text-xs text-muted-foreground">
                        {sample.wordCount} words • {sample.sourceType}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSample(sample.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload options */}
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {samples.length > 0 ? "Add another sample" : "Add a sample"}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => setMode("paste")}
              >
                <ClipboardPaste className="h-6 w-6 text-primary" />
                <span className="text-xs">Paste Text</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => setMode("url")}
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
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onSkip}
              disabled={isProcessing}
            >
              Skip for now
            </Button>
            <Button
              className="flex-1"
              onClick={handleComplete}
              disabled={isProcessing || samples.length === 0}
            >
              {samples.length > 0 ? "Continue" : "Add a sample to continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Paste mode
  if (mode === "paste") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Paste Your Writing</CardTitle>
          <CardDescription>
            Paste a blog post, article, or any writing sample (at least 100
            characters)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your writing sample here..."
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            className="min-h-[200px]"
            autoFocus
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {pasteContent.split(/\s+/).filter(Boolean).length} words
            </span>
            {pasteContent.length < 100 && (
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
                setError(null);
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
        </CardContent>
      </Card>
    );
  }

  // URL mode
  if (mode === "url") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Import from URL</CardTitle>
          <CardDescription>
            Enter the URL of a blog post or article you&apos;ve written
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                setError(null);
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
        </CardContent>
      </Card>
    );
  }

  // File mode is handled via the hidden input
  return null;
}
