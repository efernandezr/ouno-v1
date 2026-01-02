"use client";

import { useState, useCallback } from "react";
import { Mic, MicOff, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";

interface VoiceRefineProps {
  contentId: string;
  onRefineComplete: (result: {
    contentId: string;
    content: string;
    changes: string[];
  }) => void;
  disabled?: boolean;
}

type RefineStatus = "idle" | "recording" | "transcribing" | "refining";

export function VoiceRefine({
  contentId,
  onRefineComplete,
  disabled = false,
}: VoiceRefineProps) {
  const [status, setStatus] = useState<RefineStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob) => {
      setStatus("transcribing");
      setError(null);

      try {
        // First, upload and transcribe the audio
        const formData = new FormData();
        formData.append("audio", audioBlob, "refinement.webm");

        const uploadResponse = await fetch("/api/voice/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload audio");
        }

        const { uploadId, url } = await uploadResponse.json();

        // Transcribe
        const transcribeResponse = await fetch("/api/voice/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, audioUrl: url }),
        });

        if (!transcribeResponse.ok) {
          throw new Error("Failed to transcribe audio");
        }

        const { transcript } = await transcribeResponse.json();

        if (!transcript || transcript.trim().length === 0) {
          throw new Error("No speech detected. Please try again.");
        }

        // Now refine the content
        setStatus("refining");

        const refineResponse = await fetch(`/api/content/${contentId}/refine`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refinementType: "voice",
            instruction: transcript,
          }),
        });

        if (!refineResponse.ok) {
          const errorData = await refineResponse.json();
          throw new Error(errorData.error || "Failed to refine content");
        }

        const result = await refineResponse.json();

        onRefineComplete({
          contentId: result.contentId,
          content: result.content,
          changes: result.changes,
        });

        setStatus("idle");
      } catch (err) {
        console.error("Voice refine error:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStatus("idle");
      }
    },
    [contentId, onRefineComplete]
  );

  const handleCancel = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  if (status === "recording") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-red-500 animate-pulse" />
            Recording Your Feedback
          </CardTitle>
          <CardDescription>
            Describe what changes you&apos;d like to make to the content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoiceRecorder
            mode="follow_up"
            maxDuration={60}
            prompt="What changes would you like to make?"
            onComplete={handleRecordingComplete}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    );
  }

  if (status === "transcribing" || status === "refining") {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {status === "transcribing"
                ? "Transcribing your feedback..."
                : "Refining your content..."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Voice Refine
        </CardTitle>
        <CardDescription>
          Speak your refinement instructions naturally
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Examples:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>&quot;Make the opening more punchy&quot;</li>
            <li>&quot;Add more detail to the second section&quot;</li>
            <li>&quot;Make it sound more casual&quot;</li>
            <li>&quot;Shorten the conclusion&quot;</li>
          </ul>
        </div>

        <Button
          onClick={() => setStatus("recording")}
          disabled={disabled}
          className="w-full gap-2"
          size="lg"
        >
          {disabled ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
          {disabled ? "Microphone Unavailable" : "Start Recording"}
        </Button>
      </CardContent>
    </Card>
  );
}
