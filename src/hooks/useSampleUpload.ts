"use client";

import { useState, useCallback } from "react";

export type UploadMode = "select" | "paste" | "url" | "file";

export interface UploadedSample {
  id: string;
  sourceType: "paste" | "url" | "file";
  preview: string;
  wordCount: number;
}

interface UseSampleUploadOptions {
  onSuccess?: (sample: UploadedSample) => void;
  onError?: (error: string) => void;
}

interface UseSampleUploadReturn {
  // State
  mode: UploadMode;
  pasteContent: string;
  urlInput: string;
  isUploading: boolean;
  error: string | null;

  // Setters
  setMode: (mode: UploadMode) => void;
  setPasteContent: (content: string) => void;
  setUrlInput: (url: string) => void;

  // Actions
  handlePasteSubmit: () => Promise<UploadedSample | null>;
  handleUrlSubmit: () => Promise<UploadedSample | null>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<UploadedSample | null>;
  reset: () => void;
  clearError: () => void;
}

/**
 * useSampleUpload Hook
 *
 * Reusable hook for handling writing sample uploads.
 * Used by both onboarding flow and settings dialog.
 */
export function useSampleUpload(options?: UseSampleUploadOptions): UseSampleUploadReturn {
  const [mode, setMode] = useState<UploadMode>("select");
  const [pasteContent, setPasteContent] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setMode("select");
    setPasteContent("");
    setUrlInput("");
    setError(null);
    setIsUploading(false);
  }, []);

  const handlePasteSubmit = useCallback(async (): Promise<UploadedSample | null> => {
    if (!pasteContent.trim() || pasteContent.trim().length < 100) {
      setError("Please enter at least 100 characters of content.");
      return null;
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

      const sample: UploadedSample = {
        id: result.sampleId,
        sourceType: "paste",
        preview: pasteContent.slice(0, 100) + "...",
        wordCount: result.wordCount,
      };

      setPasteContent("");
      setMode("select");
      options?.onSuccess?.(sample);

      return sample;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      options?.onError?.(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [pasteContent, options]);

  const handleUrlSubmit = useCallback(async (): Promise<UploadedSample | null> => {
    if (!urlInput.trim()) {
      setError("Please enter a URL.");
      return null;
    }

    // Basic URL validation
    try {
      new URL(urlInput.trim());
    } catch {
      setError("Please enter a valid URL.");
      return null;
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

      const sample: UploadedSample = {
        id: result.sampleId,
        sourceType: "url",
        preview: urlInput.trim(),
        wordCount: result.wordCount,
      };

      setUrlInput("");
      setMode("select");
      options?.onSuccess?.(sample);

      return sample;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch article";
      setError(message);
      options?.onError?.(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [urlInput, options]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<UploadedSample | null> => {
      const file = event.target.files?.[0];
      if (!file) return null;

      // Validate file type
      const allowedTypes = ["text/plain", "text/markdown", "application/markdown"];
      if (
        !allowedTypes.includes(file.type) &&
        !file.name.endsWith(".md") &&
        !file.name.endsWith(".txt")
      ) {
        setError("Please upload a .txt or .md file.");
        return null;
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

        const sample: UploadedSample = {
          id: result.sampleId,
          sourceType: "file",
          preview: file.name,
          wordCount: result.wordCount,
        };

        setMode("select");
        options?.onSuccess?.(sample);

        return sample;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to read file";
        setError(message);
        options?.onError?.(message);
        return null;
      } finally {
        setIsUploading(false);
        // Reset file input
        event.target.value = "";
      }
    },
    [options]
  );

  return {
    // State
    mode,
    pasteContent,
    urlInput,
    isUploading,
    error,

    // Setters
    setMode,
    setPasteContent,
    setUrlInput,

    // Actions
    handlePasteSubmit,
    handleUrlSubmit,
    handleFileChange,
    reset,
    clearError,
  };
}
