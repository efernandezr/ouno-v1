"use client";

import { useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { FollowUpQuestion } from "@/types/session";

interface TextResponseProps {
  question: FollowUpQuestion;
  onComplete: (text: string) => void;
  onCancel: () => void;
}

const MIN_CHARACTERS = 20;
const MAX_CHARACTERS = 2000;

/**
 * TextResponse Component
 *
 * Provides a textarea for typed responses to follow-up questions.
 * Includes character count and validation.
 */
export function TextResponse({
  question,
  onComplete,
  onCancel,
}: TextResponseProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterCount = text.length;
  const isValid =
    characterCount >= MIN_CHARACTERS && characterCount <= MAX_CHARACTERS;
  const remainingToMin = Math.max(0, MIN_CHARACTERS - characterCount);

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      onComplete(text.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Your Response</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
            <span className="sr-only">Cancel</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{question.question}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        <Textarea
          placeholder="Type your response here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[150px] resize-none"
          maxLength={MAX_CHARACTERS}
          disabled={isSubmitting}
          autoFocus
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {remainingToMin > 0 ? (
              <span className="text-amber-500">
                {remainingToMin} more characters needed
              </span>
            ) : (
              <span className="text-green-500">Ready to submit</span>
            )}
          </span>
          <span
            className={
              characterCount > MAX_CHARACTERS * 0.9
                ? "text-amber-500"
                : undefined
            }
          >
            {characterCount} / {MAX_CHARACTERS}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
        >
          <Send className="h-4 w-4 mr-2" />
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}
