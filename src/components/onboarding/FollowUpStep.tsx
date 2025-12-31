"use client";

import { useState, useCallback } from "react";
import {
  Mic,
  Type,
  SkipForward,
  Loader2,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { cn } from "@/lib/utils";

interface FollowUpStepProps {
  questions: string[];
  introTranscript: string | null;
  onComplete: () => void;
  isProcessing: boolean;
}

type ResponseMode = "select" | "voice" | "text";

interface QuestionResponse {
  questionIndex: number;
  responseType: "voice" | "text" | "skip";
  response: string | null;
}

/**
 * FollowUpStep Component
 *
 * Displays follow-up questions generated from the voice intro.
 * Users can respond via voice, text, or skip each question.
 */
export function FollowUpStep({
  questions,
  introTranscript,
  onComplete,
  isProcessing,
}: FollowUpStepProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responseMode, setResponseMode] = useState<ResponseMode>("select");
  const [textResponse, setTextResponse] = useState("");
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const submitResponse = useCallback(
    async (responseType: "voice" | "text" | "skip", response: string | null) => {
      const newResponse: QuestionResponse = {
        questionIndex: currentQuestionIndex,
        responseType,
        response,
      };

      const updatedResponses = [...responses, newResponse];
      setResponses(updatedResponses);

      // Move to next question or complete
      if (isLastQuestion) {
        setIsSubmitting(true);

        try {
          // Submit all responses to server
          await fetch("/api/onboarding/follow-ups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              responses: updatedResponses,
              introTranscript,
            }),
          });

          onComplete();
        } catch (error) {
          console.error("Error submitting responses:", error);
          setIsSubmitting(false);
        }
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setResponseMode("select");
        setTextResponse("");
      }
    },
    [currentQuestionIndex, isLastQuestion, responses, introTranscript, onComplete]
  );

  const handleVoiceComplete = useCallback(
    async (audioBlob: Blob) => {
      setIsSubmitting(true);

      try {
        // Upload audio
        const formData = new FormData();
        formData.append("audio", audioBlob, "follow-up.webm");
        formData.append("mode", "follow_up");

        const uploadRes = await fetch("/api/voice/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Upload failed");

        const { uploadId, url } = await uploadRes.json();

        // Transcribe
        const transcribeRes = await fetch("/api/voice/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, audioUrl: url }),
        });

        if (!transcribeRes.ok) throw new Error("Transcription failed");

        const { transcript } = await transcribeRes.json();

        setIsSubmitting(false);
        await submitResponse("voice", transcript);
      } catch (error) {
        console.error("Error processing voice response:", error);
        setIsSubmitting(false);
        setResponseMode("select");
      }
    },
    [submitResponse]
  );

  const handleTextSubmit = useCallback(async () => {
    if (!textResponse.trim()) return;
    await submitResponse("text", textResponse.trim());
  }, [textResponse, submitResponse]);

  const handleSkip = useCallback(async () => {
    await submitResponse("skip", null);
  }, [submitResponse]);

  // If no questions, show empty state
  if (questions.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Great start!</p>
            <p className="text-muted-foreground">
              We&apos;ve learned enough to continue.
            </p>
            <Button className="mt-4" onClick={onComplete} disabled={isProcessing}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Voice recording mode
  if (responseMode === "voice") {
    return (
      <VoiceRecorder
        mode="follow_up"
        maxDuration={60}
        prompt={currentQuestion ?? "Please respond to the question..."}
        onComplete={handleVoiceComplete}
        onCancel={() => setResponseMode("select")}
      />
    );
  }

  // Main question card
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-lg font-medium">{currentQuestion}</p>
        </div>

        {/* Response mode selection */}
        {responseMode === "select" && !isSubmitting && (
          <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              How would you like to respond?
            </p>

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => setResponseMode("voice")}
              >
                <Mic className="h-6 w-6 text-primary" />
                <span className="text-xs">Voice</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => setResponseMode("text")}
              >
                <Type className="h-6 w-6 text-primary" />
                <span className="text-xs">Text</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col h-auto py-4 gap-2"
                onClick={handleSkip}
              >
                <SkipForward className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs">Skip</span>
              </Button>
            </div>
          </div>
        )}

        {/* Text response mode */}
        {responseMode === "text" && !isSubmitting && (
          <div className="space-y-4">
            <Textarea
              placeholder="Type your response..."
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              className="min-h-[120px]"
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setResponseMode("select");
                  setTextResponse("");
                }}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleTextSubmit}
                disabled={!textResponse.trim()}
              >
                Submit Response
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Submitting state */}
        {isSubmitting && (
          <div className="flex flex-col items-center py-8 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {isLastQuestion ? "Processing responses..." : "Processing..."}
            </p>
          </div>
        )}

        {/* Previous responses indicator */}
        {responses.length > 0 && (
          <div className="flex justify-center gap-2 pt-4">
            {questions.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index < responses.length
                    ? responses[index]?.responseType === "skip"
                      ? "bg-muted-foreground/50"
                      : "bg-primary"
                    : index === currentQuestionIndex
                      ? "bg-primary/50"
                      : "bg-muted"
                )}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
