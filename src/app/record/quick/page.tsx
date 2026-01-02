"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { TemplateSelector } from "@/components/content/TemplateSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VoiceRecorder, TranscriptPreview } from "@/components/voice";
import type { ContentTemplate } from "@/types/content";

type RecordingStage = "recording" | "uploading" | "transcribing" | "complete" | "creating_session" | "generating";

/**
 * Safely parse JSON from a Response, returning null if parsing fails.
 * Handles cases where server returns HTML error pages instead of JSON.
 */
async function safeParseJSON(response: Response): Promise<{ error?: string; details?: string; hint?: string } | null> {
  try {
    const text = await response.text();
    // Check if response looks like HTML (error page)
    if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
      console.error("Received HTML instead of JSON:", text.substring(0, 200));
      return null;
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

interface TranscriptionResult {
  transcript: string;
  durationSeconds: number;
  wordTimestamps: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  language?: string;
}

/**
 * Thought Stream Page
 *
 * 2-minute maximum spontaneous recording for capturing immediate thoughts.
 * No prompts, just pure voice capture and transcription.
 */
export default function ThoughtStreamPage() {
  const router = useRouter();
  const [stage, setStage] = useState<RecordingStage>("recording");
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate>("blog_post");

  const handleRecordingComplete = async (audioBlob: Blob, _duration: number) => {
    setError(null);
    setStage("uploading");

    try {
      // Step 1: Upload the audio file
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("mode", "quick");

      const uploadResponse = await fetch("/api/voice/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await safeParseJSON(uploadResponse);
        throw new Error(errorData?.error || `Upload failed (${uploadResponse.status})`);
      }

      const uploadResult = await uploadResponse.json();

      // Step 2: Transcribe the audio
      setStage("transcribing");

      const transcribeResponse = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadId: uploadResult.uploadId,
          audioUrl: uploadResult.url,
        }),
      });

      if (!transcribeResponse.ok) {
        const errorData = await safeParseJSON(transcribeResponse);
        throw new Error(errorData?.error || `Transcription failed (${transcribeResponse.status})`);
      }

      const transcriptionResult: TranscriptionResult = await transcribeResponse.json();
      setTranscription(transcriptionResult);
      setStage("complete");
    } catch (err) {
      console.error("Recording processing error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setStage("recording");
    }
  };

  const handleCancel = () => {
    router.push("/record");
  };

  const handleStartOver = () => {
    setTranscription(null);
    setError(null);
    setStage("recording");
  };

  const handleGenerateContent = async () => {
    if (!transcription) return;

    setError(null);
    setStage("creating_session");

    try {
      // Step 1: Create a session with the transcript
      const sessionResponse = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "quick",
          transcript: transcription.transcript,
          durationSeconds: transcription.durationSeconds,
          wordTimestamps: transcription.wordTimestamps,
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await safeParseJSON(sessionResponse);
        const errorDetails = errorData?.details ? `: ${errorData.details}` : "";
        const errorHint = errorData?.hint ? ` (${errorData.hint})` : "";
        throw new Error((errorData?.error || "Failed to create session") + errorDetails + errorHint);
      }

      const sessionData = await sessionResponse.json();
      const sessionId = sessionData.sessionId;

      // Step 2: Generate content from the session
      setStage("generating");

      const generateResponse = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, template: selectedTemplate }),
      });

      if (!generateResponse.ok) {
        const errorData = await safeParseJSON(generateResponse);
        throw new Error(errorData?.error || "Failed to generate content");
      }

      const contentData = await generateResponse.json();

      // Navigate to the generated content
      router.push(`/content/${contentData.contentId}`);
    } catch (err) {
      console.error("Content generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate content");
      setStage("complete"); // Return to complete state so user can retry
    }
  };

  // Processing states
  if (stage === "uploading" || stage === "transcribing" || stage === "creating_session" || stage === "generating") {
    const messages: Record<string, { title: string; description: string }> = {
      uploading: {
        title: "Uploading...",
        description: "Uploading your recording to the cloud",
      },
      transcribing: {
        title: "Transcribing...",
        description: "Converting your voice to text with AI",
      },
      creating_session: {
        title: "Preparing...",
        description: "Setting up your content session",
      },
      generating: {
        title: "Synthesizing...",
        description: "Creating your article using your Ouno Core",
      },
    };

    const message = messages[stage as keyof typeof messages];

    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center space-y-6 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{message?.title ?? "Processing..."}</h2>
              <p className="text-muted-foreground">{message?.description ?? "Please wait"}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Complete state with transcript
  if (stage === "complete" && transcription) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/record">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Thought Stream Complete</h1>
              <p className="text-muted-foreground">
                Your thoughts have been captured and transcribed
              </p>
            </div>
          </div>

          {/* Transcript Preview */}
          <TranscriptPreview
            transcript={transcription.transcript}
            duration={transcription.durationSeconds}
            wordCount={transcription.wordTimestamps.length}
          />

          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Choose a format</Label>
            <TemplateSelector
              value={selectedTemplate}
              onChange={setSelectedTemplate}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleGenerateContent} className="flex-1 gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Content
            </Button>
            <Button
              variant="outline"
              onClick={handleStartOver}
              className="flex-1"
            >
              Record Again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Recording state
  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Thought Stream</h1>
          <p className="text-muted-foreground">
            Speak your thoughts freely. Up to 2 minutes.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Voice Recorder */}
        <VoiceRecorder
          mode="quick"
          maxDuration={120} // 2 minutes
          onComplete={handleRecordingComplete}
          onCancel={handleCancel}
        />

        {/* Tips */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Tip: Speak naturally as if explaining to a friend.</p>
        </div>
      </div>
    </main>
  );
}
