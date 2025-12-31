"use client";

import {
  Mic,
  FileText,
  Brain,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionStatus } from "@/types/session";

interface SessionProgressProps {
  status: SessionStatus;
  currentQuestionIndex?: number | null;
  totalQuestions?: number;
  className?: string;
}

interface StepConfig {
  id: SessionStatus | "done";
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
}

const steps: StepConfig[] = [
  {
    id: "recording",
    label: "Recording",
    shortLabel: "Record",
    icon: Mic,
    description: "Capture your thoughts",
  },
  {
    id: "transcribing",
    label: "Transcribing",
    shortLabel: "Transcribe",
    icon: FileText,
    description: "Converting speech to text",
  },
  {
    id: "analyzing",
    label: "Analyzing",
    shortLabel: "Analyze",
    icon: Brain,
    description: "Understanding your voice",
  },
  {
    id: "follow_ups",
    label: "Follow-ups",
    shortLabel: "Questions",
    icon: MessageCircle,
    description: "Answer a few questions",
  },
  {
    id: "generating",
    label: "Generating",
    shortLabel: "Generate",
    icon: Sparkles,
    description: "Creating your content",
  },
  {
    id: "done",
    label: "Complete",
    shortLabel: "Done",
    icon: CheckCircle2,
    description: "Content ready",
  },
];

const statusOrder: Record<SessionStatus | "done", number> = {
  recording: 0,
  transcribing: 1,
  analyzing: 2,
  follow_ups: 3,
  generating: 4,
  complete: 5,
  done: 5,
  error: -1,
};

/**
 * SessionProgress Component
 *
 * Visual indicator showing the current stage of a voice session.
 * Displays as a horizontal stepper on desktop and vertical on mobile.
 */
export function SessionProgress({
  status,
  currentQuestionIndex,
  totalQuestions,
  className,
}: SessionProgressProps) {
  const currentOrder = statusOrder[status];
  const isError = status === "error";

  // Map 'complete' to 'done' for display
  const displayStatus = status === "complete" ? "done" : status;

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop view - horizontal stepper */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const stepOrder = statusOrder[step.id as SessionStatus];
          const isActive = step.id === displayStatus;
          const isCompleted = !isError && currentOrder > stepOrder;
          const isPending = !isError && currentOrder < stepOrder;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isActive &&
                      !isError &&
                      "border-primary bg-primary text-primary-foreground",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isPending &&
                      "border-muted-foreground/30 text-muted-foreground/50",
                    isError &&
                      isActive &&
                      "border-destructive bg-destructive text-destructive-foreground"
                  )}
                >
                  {isActive && !isError && !isCompleted ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isError && isActive ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isActive && "text-primary",
                    isCompleted && "text-primary",
                    isPending && "text-muted-foreground/50"
                  )}
                >
                  {step.shortLabel}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile view - current step only */}
      <div className="sm:hidden">
        {steps.map((step) => {
          if (step.id !== displayStatus && step.id !== "done") return null;

          const StepIcon = step.icon;
          const isError = status === "error";

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg",
                isError ? "bg-destructive/10" : "bg-primary/10"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isError
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {isError ? (
                  <AlertCircle className="h-6 w-6" />
                ) : step.id === displayStatus && step.id !== "done" ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <StepIcon className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium",
                    isError ? "text-destructive" : "text-primary"
                  )}
                >
                  {step.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}

        {/* Follow-up progress indicator */}
        {status === "follow_ups" &&
          typeof currentQuestionIndex === "number" &&
          totalQuestions && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {currentQuestionIndex + 1} / {totalQuestions}
              </span>
            </div>
          )}
      </div>
    </div>
  );
}
