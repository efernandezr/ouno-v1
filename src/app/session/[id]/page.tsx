"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { FollowUpQuestion } from "@/components/session/FollowUpQuestion";
import { SessionProgress } from "@/components/session/SessionProgress";
import { TextResponse } from "@/components/session/TextResponse";
import { VoiceResponse } from "@/components/session/VoiceResponse";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type {
  FollowUpQuestion as FollowUpQuestionType,
  VoiceSession,
} from "@/types/session";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

type ResponseMode = "question" | "voice" | "text" | null;

interface SessionData extends VoiceSession {
  progress: {
    answeredQuestions: number;
    totalQuestions: number;
    currentQuestionIndex: number | null;
    hasTranscript: boolean;
    hasAnalysis: boolean;
    hasContent: boolean;
  };
}

/**
 * Session Page
 *
 * Handles the follow-up question flow after a voice recording session.
 * Displays questions, collects responses, and navigates to content generation.
 */
export default function SessionPage({ params }: SessionPageProps) {
  const { id: sessionId } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseMode, setResponseMode] = useState<ResponseMode>(null);
  const [currentQuestion, setCurrentQuestion] =
    useState<FollowUpQuestionType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch session data
  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch session");
      }
      const data = await response.json();
      setSession(data);
      setError(null);

      // If we're in follow_ups status, find the current question
      if (data.status === "follow_ups") {
        const answeredIds = new Set(
          (data.followUpResponses || []).map(
            (r: { questionId: string }) => r.questionId
          )
        );
        const nextQuestion = (data.followUpQuestions || []).find(
          (q: FollowUpQuestionType) => !answeredIds.has(q.id)
        );
        setCurrentQuestion(nextQuestion || null);
        setResponseMode("question");
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch session");
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Generate follow-up questions if needed
  const generateQuestions = useCallback(async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}/questions`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate questions");
      }
      // Refetch session to get updated data
      await fetchSession();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate questions"
      );
    }
  }, [sessionId, fetchSession]);

  // Initial fetch
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Generate questions when session reaches follow_ups status without questions
  useEffect(() => {
    if (
      session?.status === "follow_ups" &&
      (!session.followUpQuestions || session.followUpQuestions.length === 0)
    ) {
      generateQuestions();
    }
  }, [session?.status, session?.followUpQuestions, generateQuestions]);

  // Handle status changes
  useEffect(() => {
    if (session?.status === "complete" && session.generatedContentId) {
      router.push(`/content/${session.generatedContentId}`);
      return;
    }

    if (session?.status === "generating") {
      // Track mounted state to prevent state updates after unmount
      let mounted = true;
      let intervalId: NodeJS.Timeout | null = null;

      const pollForCompletion = async () => {
        if (!mounted) return;

        const data = await fetchSession();

        // Check if still mounted before processing result
        if (!mounted) return;

        if (data?.status === "complete" || data?.status === "error") {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      };

      // Start polling
      intervalId = setInterval(pollForCompletion, 2000);

      return () => {
        mounted = false;
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
    return;
  }, [session?.status, session?.generatedContentId, router, fetchSession]);

  // Submit a response to a question
  const submitResponse = async (
    questionId: string,
    responseType: "voice" | "text" | "skip",
    content?: string,
    durationSeconds?: number
  ) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/session/${sessionId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          responseType,
          content,
          durationSeconds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit response");
      }

      const data = await response.json();

      // Update local state
      if (data.allAnswered) {
        // All questions answered, session will move to generating
        setResponseMode(null);
        setCurrentQuestion(null);
      } else if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setResponseMode("question");
      }

      // Refetch session to update progress
      await fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle voice response completion
  const handleVoiceComplete = async (transcript: string, duration: number) => {
    if (!currentQuestion) return;
    await submitResponse(
      currentQuestion.id,
      "voice",
      transcript,
      duration
    );
  };

  // Handle text response completion
  const handleTextComplete = async (text: string) => {
    if (!currentQuestion) return;
    await submitResponse(currentQuestion.id, "text", text);
  };

  // Handle skip
  const handleSkip = async () => {
    if (!currentQuestion) return;
    await submitResponse(currentQuestion.id, "skip");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!session) return null;

  const questionsLength = session.followUpQuestions?.length || 0;
  const answeredLength = session.followUpResponses?.length || 0;
  const currentQuestionIndex =
    currentQuestion && session.followUpQuestions
      ? session.followUpQuestions.findIndex((q) => q.id === currentQuestion.id)
      : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <span className="text-sm text-muted-foreground">
              {session.mode === "quick" ? "Quick Capture" : "Guided Session"}
            </span>
          </div>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="container mx-auto px-4 py-6">
        <SessionProgress
          status={session.status}
          currentQuestionIndex={
            session.status === "follow_ups" ? currentQuestionIndex : null
          }
          totalQuestions={questionsLength}
        />
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 pb-8">
        {/* Error banner */}
        {error && (
          <Alert variant="destructive" className="mb-6 max-w-lg mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status-based content */}
        {session.status === "error" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <AlertCircle className="h-16 w-16 text-destructive" />
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {session.errorMessage ||
                "An error occurred while processing your session."}
            </p>
            <Button onClick={() => router.push("/record")}>
              Start a new session
            </Button>
          </div>
        )}

        {session.status === "recording" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Waiting for recording...</p>
          </div>
        )}

        {session.status === "transcribing" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Transcribing your audio...</p>
          </div>
        )}

        {session.status === "analyzing" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Analyzing your voice patterns...
            </p>
          </div>
        )}

        {session.status === "follow_ups" && (
          <>
            {responseMode === "question" && currentQuestion && (
              <FollowUpQuestion
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questionsLength}
                onVoiceResponse={() => setResponseMode("voice")}
                onTextResponse={() => setResponseMode("text")}
                onSkip={handleSkip}
                disabled={isSubmitting}
              />
            )}

            {responseMode === "voice" && currentQuestion && (
              <VoiceResponse
                question={currentQuestion}
                sessionId={sessionId}
                onComplete={handleVoiceComplete}
                onCancel={() => setResponseMode("question")}
              />
            )}

            {responseMode === "text" && currentQuestion && (
              <TextResponse
                question={currentQuestion}
                onComplete={handleTextComplete}
                onCancel={() => setResponseMode("question")}
              />
            )}

            {!currentQuestion &&
              questionsLength > 0 &&
              answeredLength >= questionsLength && (
                <div className="flex flex-col items-center gap-4 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">
                    All questions answered! Preparing to generate content...
                  </p>
                </div>
              )}
          </>
        )}

        {session.status === "generating" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Creating your content</h2>
            <p className="text-muted-foreground text-center max-w-md">
              We&apos;re using your voice patterns and responses to generate
              authentic content that sounds like you.
            </p>
          </div>
        )}

        {session.status === "complete" && !session.generatedContentId && (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">Session complete!</p>
            <Button onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
