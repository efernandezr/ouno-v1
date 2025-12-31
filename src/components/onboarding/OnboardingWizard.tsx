"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, Mic, MessageSquare, FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { FollowUpStep } from "./FollowUpStep";
import { ReferentSelectStep } from "./ReferentSelectStep";
import { SampleUploadStep } from "./SampleUploadStep";
import { VoiceIntroStep } from "./VoiceIntroStep";

interface OnboardingWizardProps {
  userId: string;
  initialStep: number;
  userName: string;
}

const STEPS = [
  {
    id: "voice_intro",
    title: "Voice Introduction",
    description: "Tell us about yourself",
    icon: Mic,
  },
  {
    id: "follow_ups",
    title: "Follow-up Questions",
    description: "Share more details",
    icon: MessageSquare,
  },
  {
    id: "samples",
    title: "Writing Samples",
    description: "Optional - add samples",
    icon: FileText,
  },
  {
    id: "referents",
    title: "Style Influences",
    description: "Choose writing inspirations",
    icon: Users,
  },
];

/**
 * OnboardingWizard Component
 *
 * Manages the multi-step onboarding flow with step indicators and navigation.
 */
export function OnboardingWizard({
  userId: _userId,
  initialStep,
  userName,
}: OnboardingWizardProps) {
  // Note: userId is available for future use (e.g., direct API calls)
  void _userId;
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data collected during onboarding
  const [introTranscript, setIntroTranscript] = useState<string | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);

  const handleStepComplete = useCallback(
    async (nextStatus: string) => {
      setIsProcessing(true);

      try {
        // Update onboarding status on server
        const response = await fetch("/api/onboarding/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });

        if (!response.ok) {
          throw new Error("Failed to update status");
        }

        // Move to next step or complete
        if (currentStep < STEPS.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          // Onboarding complete
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error updating onboarding status:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [currentStep, router]
  );

  const handleIntroComplete = useCallback(
    (transcript: string, questions: string[]) => {
      setIntroTranscript(transcript);
      setFollowUpQuestions(questions);
      handleStepComplete("follow_ups");
    },
    [handleStepComplete]
  );

  const handleFollowUpsComplete = useCallback(() => {
    handleStepComplete("samples");
  }, [handleStepComplete]);

  const handleSamplesComplete = useCallback(() => {
    handleStepComplete("complete");
  }, [handleStepComplete]);

  const handleReferentsComplete = useCallback(() => {
    handleStepComplete("complete");
  }, [handleStepComplete]);

  const handleSkipSamples = useCallback(() => {
    setCurrentStep(currentStep + 1);
  }, [currentStep]);

  return (
    <div className="space-y-8">
      {/* Step Progress Indicator */}
      <nav aria-label="Progress" className="px-4">
        <ol className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <li key={step.id} className="relative flex flex-col items-center">
                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-[calc(50%+20px)] top-5 h-0.5 w-[calc(100%-40px)]",
                      "hidden sm:block",
                      isComplete ? "bg-primary" : "bg-muted"
                    )}
                    style={{ width: "calc(100vw / 5)" }}
                  />
                )}

                {/* Step indicator */}
                <div
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isComplete
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>

                {/* Step label - hidden on mobile */}
                <div className="mt-2 text-center hidden sm:block">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Current Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && (
          <VoiceIntroStep
            userName={userName}
            onComplete={handleIntroComplete}
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 1 && (
          <FollowUpStep
            questions={followUpQuestions}
            introTranscript={introTranscript}
            onComplete={handleFollowUpsComplete}
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 2 && (
          <SampleUploadStep
            onComplete={handleSamplesComplete}
            onSkip={handleSkipSamples}
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 3 && (
          <ReferentSelectStep
            onComplete={handleReferentsComplete}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  );
}
