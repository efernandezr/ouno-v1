"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Sparkles, MessageSquare, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VoiceRecorder, TranscriptPreview } from "@/components/voice";

type GuidedStage =
  | "intro"
  | "recording"
  | "uploading"
  | "transcribing"
  | "follow_up"
  | "complete";

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

interface RecordingRound {
  prompt: string;
  transcript: string;
  duration: number;
}

// Initial prompts to get the user started
const INITIAL_PROMPTS = [
  "What idea or topic is on your mind right now? Share it as if explaining to a curious friend.",
  "Tell me about something you've been thinking about lately. What makes it interesting to you?",
  "Describe a problem you've been working on or an insight you've had recently.",
];

// Follow-up prompts based on common content patterns
const FOLLOW_UP_PROMPTS = [
  "That's interesting! Can you give me a specific example or story that illustrates this?",
  "What's the bigger picture here? Why does this matter?",
  "What would you want your readers to take away from this?",
  "Is there anything that surprised you while exploring this idea?",
];

/**
 * Guided Session Page
 *
 * 5-minute structured recording with AI-guided prompts.
 * Multiple rounds of recording to develop ideas fully.
 */
export default function GuidedSessionPage() {
  const router = useRouter();
  const [stage, setStage] = useState<GuidedStage>("intro");
  const [error, setError] = useState<string | null>(null);
  const [rounds, setRounds] = useState<RecordingRound[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState<TranscriptionResult | null>(null);

  const maxRounds = 3;
  const currentRound = rounds.length + 1;

  // Get combined transcript from all rounds
  const fullTranscript = rounds.map((r) => r.transcript).join("\n\n");
  const totalDuration = rounds.reduce((sum, r) => sum + r.duration, 0);
  const totalWords = rounds.reduce(
    (sum, r) => sum + r.transcript.split(/\s+/).filter(Boolean).length,
    0
  );

  const startSession = useCallback(() => {
    // Pick a random initial prompt
    const randomIndex = Math.floor(Math.random() * INITIAL_PROMPTS.length);
    const prompt = INITIAL_PROMPTS[randomIndex];
    if (prompt) {
      setCurrentPrompt(prompt);
    }
    setStage("recording");
  }, []);

  const handleRecordingComplete = async (audioBlob: Blob, _duration: number) => {
    setError(null);
    setStage("uploading");

    try {
      // Step 1: Upload the audio file
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("mode", "guided");

      const uploadResponse = await fetch("/api/voice/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json();
        throw new Error(uploadError.error || "Failed to upload audio");
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
        const transcribeError = await transcribeResponse.json();
        throw new Error(transcribeError.error || "Failed to transcribe audio");
      }

      const transcriptionResult: TranscriptionResult = await transcribeResponse.json();
      setCurrentTranscript(transcriptionResult);

      // Add to rounds
      const newRound: RecordingRound = {
        prompt: currentPrompt,
        transcript: transcriptionResult.transcript,
        duration: transcriptionResult.durationSeconds,
      };
      setRounds((prev) => [...prev, newRound]);

      // Decide next step
      if (currentRound >= maxRounds) {
        setStage("complete");
      } else {
        setStage("follow_up");
      }
    } catch (err) {
      console.error("Recording processing error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setStage("recording");
    }
  };

  const handleContinue = () => {
    // Pick a follow-up prompt
    const randomIndex = Math.floor(Math.random() * FOLLOW_UP_PROMPTS.length);
    const prompt = FOLLOW_UP_PROMPTS[randomIndex];
    if (prompt) {
      setCurrentPrompt(prompt);
    }
    setCurrentTranscript(null);
    setStage("recording");
  };

  const handleFinishEarly = () => {
    setStage("complete");
  };

  const handleCancel = () => {
    if (rounds.length > 0) {
      // If we have recordings, confirm before leaving
      if (window.confirm("You have unsaved recordings. Are you sure you want to leave?")) {
        router.push("/record");
      }
    } else {
      router.push("/record");
    }
  };

  const handleStartOver = () => {
    setRounds([]);
    setCurrentTranscript(null);
    setError(null);
    setStage("intro");
  };

  const handleGenerateContent = async () => {
    setError(null);
    setStage("transcribing"); // Reuse processing state for visual feedback

    try {
      // Create a session with the full transcript data
      const response = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "guided",
          transcript: fullTranscript,
          durationSeconds: totalDuration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create session");
      }

      const { sessionId } = await response.json();

      // Navigate to session page for content generation
      router.push(`/session/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate content");
      setStage("complete");
    }
  };

  // Progress percentage
  const progressPercent = (rounds.length / maxRounds) * 100;

  // Intro screen
  if (stage === "intro") {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/record">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Guided Session</h1>
              <p className="text-muted-foreground">
                5 minutes to explore your idea in depth
              </p>
            </div>
          </div>

          {/* Intro Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle>How It Works</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                I'll guide you through a conversation about your idea. We'll do
                up to 3 rounds of recording, with prompts to help you explore
                different angles.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Share your initial idea or topic</li>
                <li>I'll ask follow-up questions to dig deeper</li>
                <li>We'll capture examples and key takeaways</li>
              </ol>
              <p className="text-sm text-muted-foreground">
                You can stop at any point if you feel you've captured enough.
              </p>
              <Button onClick={startSession} className="w-full gap-2">
                Begin Session
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Processing states
  if (stage === "uploading" || stage === "transcribing") {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center space-y-6 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">
                {stage === "uploading" ? "Uploading..." : "Transcribing..."}
              </h2>
              <p className="text-muted-foreground">
                {stage === "uploading"
                  ? "Uploading your recording"
                  : "Converting your voice to text"}
              </p>
            </div>
            <Progress value={progressPercent} className="w-64 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Round {currentRound} of {maxRounds}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Follow-up decision screen
  if (stage === "follow_up" && currentTranscript) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Round {rounds.length} of {maxRounds} complete
              </span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} />
          </div>

          {/* Last transcript preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What you just said</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {currentTranscript.transcript}
              </p>
            </CardContent>
          </Card>

          {/* Options */}
          <div className="space-y-3">
            <Button onClick={handleContinue} className="w-full gap-2">
              <MessageSquare className="h-4 w-4" />
              Continue with Follow-up
            </Button>
            <Button
              variant="outline"
              onClick={handleFinishEarly}
              className="w-full"
            >
              I'm Done - Generate Content
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Complete state
  if (stage === "complete") {
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
              <h1 className="text-2xl font-bold">Session Complete</h1>
              <p className="text-muted-foreground">
                {rounds.length} round{rounds.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
          </div>

          {/* Full Transcript Preview */}
          <TranscriptPreview
            transcript={fullTranscript}
            duration={totalDuration}
            wordCount={totalWords}
          />

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
              Start New Session
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
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Round {currentRound} of {maxRounds}
            </span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Voice Recorder with prompt */}
        <VoiceRecorder
          mode="guided"
          maxDuration={120} // 2 minutes per round, total 5-6 minutes
          prompt={currentPrompt}
          onComplete={handleRecordingComplete}
          onCancel={handleCancel}
        />
      </div>
    </main>
  );
}
