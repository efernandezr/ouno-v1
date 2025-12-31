"use client";

import { useState } from "react";
import {
  Mic,
  MessageSquare,
  SkipForward,
  HelpCircle,
  Lightbulb,
  BookOpen,
  Target,
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
import type { FollowUpQuestion as FollowUpQuestionType } from "@/types/session";

interface FollowUpQuestionProps {
  question: FollowUpQuestionType;
  questionNumber: number;
  totalQuestions: number;
  onVoiceResponse: () => void;
  onTextResponse: () => void;
  onSkip: () => void;
  disabled?: boolean;
}

const questionTypeConfig = {
  clarify: {
    icon: HelpCircle,
    label: "Clarify",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    description: "Help us understand better",
  },
  expand: {
    icon: Lightbulb,
    label: "Expand",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    description: "Tell us more about this",
  },
  example: {
    icon: BookOpen,
    label: "Example",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    description: "Share a specific story",
  },
  challenge: {
    icon: Target,
    label: "Challenge",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    description: "Strengthen your argument",
  },
};

/**
 * FollowUpQuestion Component
 *
 * Displays a follow-up question with options to respond via voice, text, or skip.
 * Shows the question type badge and context for why the question is being asked.
 */
export function FollowUpQuestion({
  question,
  questionNumber,
  totalQuestions,
  onVoiceResponse,
  onTextResponse,
  onSkip,
  disabled = false,
}: FollowUpQuestionProps) {
  const [showContext, setShowContext] = useState(false);
  const config = questionTypeConfig[question.questionType];
  const TypeIcon = config.icon;

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className={config.color}>
            <TypeIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {questionNumber} of {totalQuestions}
          </span>
        </div>
        <CardTitle className="text-xl leading-relaxed">
          {question.question}
        </CardTitle>
        {question.context && (
          <CardDescription
            className="cursor-pointer hover:text-foreground transition-colors"
            onClick={() => setShowContext(!showContext)}
          >
            {showContext ? (
              question.context
            ) : (
              <span className="text-muted-foreground text-sm">
                Tap to see why we&apos;re asking...
              </span>
            )}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Related transcript segment if available */}
        {question.relatedTranscriptSegment && (
          <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-xs text-muted-foreground mb-1">
              Related to what you said:
            </p>
            <p className="text-sm italic">
              &quot;{question.relatedTranscriptSegment}&quot;
            </p>
          </div>
        )}

        {/* Response buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="default"
            size="lg"
            className="flex-col h-20 gap-1"
            onClick={onVoiceResponse}
            disabled={disabled}
          >
            <Mic className="h-5 w-5" />
            <span className="text-xs">Voice</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-col h-20 gap-1"
            onClick={onTextResponse}
            disabled={disabled}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">Text</span>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="flex-col h-20 gap-1 text-muted-foreground hover:text-foreground"
            onClick={onSkip}
            disabled={disabled}
          >
            <SkipForward className="h-5 w-5" />
            <span className="text-xs">Skip</span>
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Voice responses are recommended for the best content generation
        </p>
      </CardContent>
    </Card>
  );
}
