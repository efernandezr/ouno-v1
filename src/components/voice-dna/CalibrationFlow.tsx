"use client";

import { useState, useCallback } from "react";
import {
  Mic,
  MessageSquare,
  Star,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { cn } from "@/lib/utils";

interface CalibrationFlowProps {
  onComplete?: () => void;
  totalRounds?: number;
  initialRound?: number;
}

type CalibrationPhase =
  | "intro"
  | "prompt"
  | "recording"
  | "processing"
  | "sample"
  | "rating"
  | "feedback"
  | "submitting"
  | "round_complete"
  | "complete";

interface RoundData {
  promptText: string;
  userResponse: string | null;
  generatedSample: string | null;
  rating: number | null;
  feedback: string;
}

const TOTAL_ROUNDS = 3;

/**
 * CalibrationFlow Component
 *
 * Multi-round calibration system where users:
 * 1. Respond to a prompt
 * 2. Review AI-generated content based on their Voice DNA
 * 3. Rate and provide feedback
 * 4. Help refine their Voice DNA profile
 */
export function CalibrationFlow({
  onComplete,
  totalRounds = TOTAL_ROUNDS,
  initialRound = 1,
}: CalibrationFlowProps) {
  const [phase, setPhase] = useState<CalibrationPhase>("intro");
  const [currentRound, setCurrentRound] = useState(initialRound);
  const [roundData, setRoundData] = useState<RoundData>({
    promptText: "",
    userResponse: null,
    generatedSample: null,
    rating: null,
    feedback: "",
  });
  const [responseMode, setResponseMode] = useState<"voice" | "text">("voice");
  const [textResponse, setTextResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);

  // Start a new calibration round
  const startRound = useCallback(async () => {
    setPhase("processing");
    setError(null);

    try {
      const response = await fetch("/api/calibration/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundNumber: currentRound }),
      });

      if (!response.ok) {
        throw new Error("Failed to start calibration round");
      }

      const data = await response.json();
      setRoundData({
        promptText: data.promptText,
        userResponse: null,
        generatedSample: null,
        rating: null,
        feedback: "",
      });
      setPhase("prompt");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("intro");
    }
  }, [currentRound]);

  // Generate sample based on user's response
  const generateSample = useCallback(
    async (userResponse: string) => {
      try {
        const response = await fetch("/api/calibration/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roundNumber: currentRound,
            promptText: roundData.promptText,
            userResponse,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to generate sample");
        }

        const data = await response.json();

        // Validate that we got actual content
        if (!data.generatedSample || data.generatedSample.trim() === "") {
          throw new Error("Generated content was empty. Please try again.");
        }

        setRoundData((prev) => ({
          ...prev,
          userResponse,
          generatedSample: data.generatedSample,
        }));
        setPhase("sample");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setPhase("prompt");
      }
    },
    [currentRound, roundData.promptText]
  );

  // Handle voice recording completion
  const handleVoiceRecordingComplete = useCallback(
    async (blob: Blob) => {
      setShowRecorder(false);
      setPhase("processing");

      try {
        // Upload and transcribe
        const formData = new FormData();
        formData.append("audio", blob, "calibration-response.webm");
        formData.append("sessionType", "calibration");

        const uploadResponse = await fetch("/api/voice/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to upload recording");
        }

        const { uploadId, url } = await uploadResponse.json();

        // Transcribe
        const transcribeResponse = await fetch("/api/voice/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, audioUrl: url }),
        });

        if (!transcribeResponse.ok) {
          const errorData = await transcribeResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to transcribe recording");
        }

        const { transcript } = await transcribeResponse.json();

        // Generate sample based on response
        await generateSample(transcript);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setPhase("prompt");
      }
    },
    [generateSample]
  );

  // Handle text response submission
  const handleTextResponseSubmit = useCallback(async () => {
    if (!textResponse.trim()) {
      setError("Please enter a response");
      return;
    }

    setPhase("processing");
    await generateSample(textResponse.trim());
  }, [textResponse, generateSample]);

  // Handle rating selection
  const handleRating = useCallback((rating: number) => {
    setRoundData((prev) => ({ ...prev, rating }));
    setPhase("feedback");
  }, []);

  // Submit round feedback
  const submitRound = useCallback(async () => {
    setPhase("submitting");

    try {
      const response = await fetch("/api/calibration/respond", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundNumber: currentRound,
          rating: roundData.rating,
          feedback: roundData.feedback,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setPhase("round_complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("feedback");
    }
  }, [currentRound, roundData.rating, roundData.feedback]);

  // Move to next round or complete
  const handleNextRound = useCallback(() => {
    if (currentRound >= totalRounds) {
      setPhase("complete");
      onComplete?.();
    } else {
      setCurrentRound((prev) => prev + 1);
      setTextResponse("");
      setPhase("intro");
    }
  }, [currentRound, totalRounds, onComplete]);

  // Progress percentage
  const progressPercent = ((currentRound - 1) / totalRounds) * 100;

  // Intro phase
  if (phase === "intro") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <Badge variant="outline" className="w-fit mx-auto mb-4">
            Round {currentRound} of {totalRounds}
          </Badge>
          <CardTitle className="text-2xl">Voice DNA Calibration</CardTitle>
          <CardDescription className="text-base">
            Help us fine-tune your Voice DNA by responding to prompts and rating
            the AI-generated content. Each round improves accuracy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={progressPercent} className="h-2" />

          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">How it works:</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>We'll give you a creative prompt</li>
              <li>Respond in your natural voice or type</li>
              <li>See AI content generated using your Voice DNA</li>
              <li>Rate how well it matches your style</li>
            </ol>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button className="w-full" onClick={startRound}>
            Start Round {currentRound}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Processing phase
  if (phase === "processing" || phase === "submitting") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              {phase === "submitting"
                ? "Saving your feedback..."
                : "Processing your response..."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prompt phase - show prompt and response options
  if (phase === "prompt") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">Round {currentRound}</Badge>
            <Progress value={progressPercent} className="w-24 h-2" />
          </div>
          <CardTitle className="text-lg mt-4">Your Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <p className="text-lg">{roundData.promptText}</p>
          </div>

          {/* Response mode selector */}
          <div className="flex gap-2">
            <Button
              variant={responseMode === "voice" ? "default" : "outline"}
              onClick={() => setResponseMode("voice")}
              className="flex-1"
            >
              <Mic className="mr-2 h-4 w-4" />
              Voice
            </Button>
            <Button
              variant={responseMode === "text" ? "default" : "outline"}
              onClick={() => setResponseMode("text")}
              className="flex-1"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Text
            </Button>
          </div>

          {/* Voice recorder */}
          {responseMode === "voice" && !showRecorder && (
            <Button
              className="w-full"
              onClick={() => setShowRecorder(true)}
            >
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          )}

          {responseMode === "voice" && showRecorder && (
            <VoiceRecorder
              mode="calibration"
              maxDuration={120}
              prompt="Share your thoughts on the prompt..."
              onComplete={handleVoiceRecordingComplete}
              onCancel={() => setShowRecorder(false)}
            />
          )}

          {/* Text response */}
          {responseMode === "text" && (
            <>
              <Textarea
                placeholder="Type your response here..."
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                className="min-h-[150px]"
              />
              <Button
                className="w-full"
                onClick={handleTextResponseSubmit}
                disabled={!textResponse.trim()}
              >
                Submit Response
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Sample phase - show generated content
  if (phase === "sample") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">Round {currentRound}</Badge>
            <Badge variant="secondary">Generated Content</Badge>
          </div>
          <CardTitle className="text-lg mt-4">
            Here's content written in your voice:
          </CardTitle>
          <CardDescription>
            This was generated using your current Voice DNA profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-6">
            <p className="whitespace-pre-wrap">{roundData.generatedSample}</p>
          </div>

          <Button className="w-full" onClick={() => setPhase("rating")}>
            Rate This Content
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Rating phase
  if (phase === "rating") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>How well does this match your voice?</CardTitle>
          <CardDescription>
            Rate from 1 (not at all) to 5 (perfectly)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={roundData.rating === rating ? "default" : "outline"}
                size="lg"
                className={cn(
                  "w-14 h-14",
                  roundData.rating === rating && "ring-2 ring-primary"
                )}
                onClick={() => handleRating(rating)}
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    roundData.rating && rating <= roundData.rating
                      ? "fill-primary"
                      : "fill-none"
                  )}
                />
              </Button>
            ))}
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Not my voice</span>
            <span>Exactly my voice</span>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setPhase("sample")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to content
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Feedback phase
  if (phase === "feedback") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>What would make it better?</CardTitle>
          <CardDescription>
            Your feedback helps us refine your Voice DNA. Be specific about what
            felt right or wrong.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm">Your rating:</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((r) => (
                <Star
                  key={r}
                  className={cn(
                    "h-4 w-4",
                    r <= (roundData.rating || 0)
                      ? "fill-primary text-primary"
                      : "fill-none text-muted-foreground"
                  )}
                />
              ))}
            </div>
          </div>

          <Textarea
            placeholder="e.g., 'The tone was too formal' or 'My sentences are usually shorter'..."
            value={roundData.feedback}
            onChange={(e) =>
              setRoundData((prev) => ({ ...prev, feedback: e.target.value }))
            }
            className="min-h-[120px]"
          />

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPhase("rating")}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={submitRound}
              disabled={!roundData.feedback.trim()}
            >
              Submit Feedback
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={submitRound}
          >
            Skip feedback
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Round complete phase
  if (phase === "round_complete") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Round {currentRound} Complete!</h2>
            <p className="text-muted-foreground mt-2">
              Your feedback has been recorded and your Voice DNA is being updated.
            </p>

            <Progress
              value={(currentRound / totalRounds) * 100}
              className="w-full max-w-xs h-2 mt-6"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {currentRound} of {totalRounds} rounds complete
            </p>

            <Button className="mt-6" onClick={handleNextRound}>
              {currentRound >= totalRounds ? "Finish Calibration" : "Next Round"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Complete phase
  if (phase === "complete") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Calibration Complete!</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Your Voice DNA has been refined based on your feedback.
              The AI will now generate content that better matches your unique style.
            </p>

            <div className="flex items-center gap-2 mt-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-primary"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              All {totalRounds} rounds completed
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
