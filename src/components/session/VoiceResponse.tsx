"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import type { FollowUpQuestion } from "@/types/session";

interface VoiceResponseProps {
  question: FollowUpQuestion;
  sessionId: string;
  onComplete: (transcript: string, duration: number) => void;
  onCancel: () => void;
}

/**
 * VoiceResponse Component
 *
 * Wrapper around VoiceRecorder for follow-up voice responses.
 * Handles recording, transcription, and submitting the response.
 */
export function VoiceResponse({
  question,
  sessionId,
  onComplete,
  onCancel,
}: VoiceResponseProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecordingComplete = async (
    audioBlob: Blob,
    duration: number
  ) => {
    setIsTranscribing(true);
    setError(null);

    try {
      // Upload the audio
      const formData = new FormData();
      formData.append("audio", audioBlob, "response.webm");
      formData.append("sessionId", sessionId);
      formData.append("mode", "follow_up");

      const uploadResponse = await fetch("/api/voice/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload audio");
      }

      const { uploadId } = await uploadResponse.json();

      // Transcribe the audio
      const transcribeResponse = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, sessionId }),
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      const { transcript, durationSeconds } = await transcribeResponse.json();

      // Call the completion handler with the transcript
      onComplete(transcript, durationSeconds || duration);
    } catch (err) {
      console.error("Error processing voice response:", err);
      setError(
        err instanceof Error ? err.message : "Failed to process recording"
      );
      setIsTranscribing(false);
    }
  };

  if (isTranscribing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Transcribing your response...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => setError(null)}
          className="text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <VoiceRecorder
      mode="follow_up"
      maxDuration={60} // 60 seconds max for follow-up responses
      prompt={question.question}
      onComplete={handleRecordingComplete}
      onCancel={onCancel}
    />
  );
}
