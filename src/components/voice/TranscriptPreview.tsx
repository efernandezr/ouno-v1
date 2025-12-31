"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TranscriptPreviewProps {
  transcript: string;
  duration?: number; // seconds
  wordCount?: number;
  className?: string;
}

/**
 * TranscriptPreview Component
 *
 * Displays a transcribed text with copy functionality and metadata.
 */
export function TranscriptPreview({
  transcript,
  duration,
  wordCount,
  className,
}: TranscriptPreviewProps) {
  const [copied, setCopied] = useState(false);

  const calculatedWordCount = wordCount ?? transcript.split(/\s+/).filter(Boolean).length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Transcript</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metadata */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          {duration !== undefined && (
            <span>Duration: {formatDuration(duration)}</span>
          )}
          <span>{calculatedWordCount} words</span>
        </div>

        {/* Transcript Text */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {transcript || (
              <span className="text-muted-foreground italic">
                No transcript available
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
