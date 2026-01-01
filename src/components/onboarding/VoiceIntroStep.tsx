"use client";

import { useState, useCallback } from "react";
import { Mic, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TranscriptPreview } from "@/components/voice/TranscriptPreview";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";

interface VoiceIntroStepProps {
  userName: string;
  onComplete: (transcript: string, followUpQuestions: string[]) => void;
  isProcessing: boolean;
}

type StepState =
  | "intro"
  | "recording"
  | "uploading"
  | "transcribing"
  | "analyzing"
  | "generating"
  | "complete"
  | "error";

/**
 * VoiceIntroStep Component
 *
 * First step of onboarding where users introduce themselves via voice.
 * This recording creates their initial Ouno Core profile.
 */
export function VoiceIntroStep({
  userName,
  onComplete,
  isProcessing,
}: VoiceIntroStepProps) {
  const [state, setState] = useState<StepState>("intro");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob, duration: number) => {
      setError(null);

      try {
        // Step 1: Upload
        setState("uploading");
        const formData = new FormData();
        formData.append("audio", audioBlob, "intro.webm");
        formData.append("mode", "guided");

        const uploadRes = await fetch("/api/voice/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          throw new Error(error.error || "Upload failed");
        }

        const { uploadId, url } = await uploadRes.json();

        // Step 2: Transcribe
        setState("transcribing");
        const transcribeRes = await fetch("/api/voice/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, audioUrl: url }),
        });

        if (!transcribeRes.ok) {
          const error = await transcribeRes.json();
          throw new Error(error.error || "Transcription failed");
        }

        const transcription = await transcribeRes.json();
        setTranscript(transcription.transcript);

        // Step 3: Create session and analyze
        setState("analyzing");

        // Create a voice session for the onboarding intro
        const sessionRes = await fetch("/api/onboarding/intro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: transcription.transcript,
            wordTimestamps: transcription.wordTimestamps,
            durationSeconds: duration,
          }),
        });

        if (!sessionRes.ok) {
          const error = await sessionRes.json();
          throw new Error(error.error || "Analysis failed");
        }

        const { followUpQuestions } = await sessionRes.json();

        // Step 4: Generate follow-up questions
        setState("generating");

        setState("complete");

        // Short delay to show completion state
        setTimeout(() => {
          onComplete(transcription.transcript, followUpQuestions);
        }, 1000);
      } catch (err) {
        console.error("Onboarding intro error:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
        setState("error");
      }
    },
    [onComplete]
  );

  const handleStartRecording = () => {
    setState("recording");
    setError(null);
  };

  const handleCancelRecording = () => {
    setState("intro");
  };

  const handleRetry = () => {
    setState("intro");
    setError(null);
    setTranscript(null);
  };

  // Processing states display
  const getProcessingContent = () => {
    const steps = [
      { key: "uploading", label: "Uploading recording..." },
      { key: "transcribing", label: "Transcribing your voice..." },
      { key: "analyzing", label: "Analyzing your speaking patterns..." },
      { key: "generating", label: "Preparing follow-up questions..." },
      { key: "complete", label: "Ouno Core profile created!" },
    ];

    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6 py-8">
            {state === "complete" ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}

            <div className="space-y-2 text-center">
              {steps.map((step) => (
                <p
                  key={step.key}
                  className={`text-sm transition-opacity ${
                    state === step.key
                      ? "text-foreground font-medium"
                      : steps.findIndex((s) => s.key === state) >
                          steps.findIndex((s) => s.key === step.key)
                        ? "text-muted-foreground line-through"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {step.label}
                </p>
              ))}
            </div>

            {transcript && (
              <div className="w-full max-w-md">
                <TranscriptPreview
                  transcript={transcript.slice(0, 200) + (transcript.length > 200 ? "..." : "")}
                  className="text-sm"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Intro screen
  if (state === "intro") {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mic className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Hi {userName}! Let&apos;s hear your voice
          </CardTitle>
          <CardDescription className="text-base">
            Tell us about yourself and what you write about. This helps us
            understand your unique voice and speaking style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <p className="font-medium">Suggested talking points:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• What topics are you passionate about?</li>
              <li>• What kind of content do you want to create?</li>
              <li>• Who is your ideal audience?</li>
              <li>• What makes your perspective unique?</li>
            </ul>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>🎙️ Aim for 2-3 minutes • Speak naturally • No script needed</p>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleStartRecording}
            disabled={isProcessing}
          >
            <Mic className="mr-2 h-5 w-5" />
            Start Recording
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Recording screen
  if (state === "recording") {
    return (
      <VoiceRecorder
        mode="guided"
        maxDuration={180} // 3 minutes for intro
        prompt="Tell us about yourself, what you write about, and what makes your perspective unique."
        onComplete={handleRecordingComplete}
        onCancel={handleCancelRecording}
      />
    );
  }

  // Error screen
  if (state === "error") {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6 py-8">
            <AlertCircle className="h-16 w-16 text-destructive" />

            <div className="text-center space-y-2">
              <p className="font-medium">Something went wrong</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>

            <Button onClick={handleRetry}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Processing screens (uploading, transcribing, analyzing, generating, complete)
  return getProcessingContent();
}
