"use client";

import { Mic, Sparkles, MessageSquare, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { VoiceDNA, TonalAttributes } from "@/types/voiceDNA";

interface VoiceDNACardProps {
  voiceDNA: VoiceDNA | null;
  summary?: {
    strengths: string[];
    characteristics: string[];
    calibrationLevel: "low" | "medium" | "high";
  } | null | undefined;
  className?: string | undefined;
  compact?: boolean;
}

/**
 * TonalBar - Display a single tonal attribute as a progress bar
 */
function TonalBar({
  label,
  value,
  leftLabel,
  rightLabel,
}: {
  label: string;
  value: number;
  leftLabel: string;
  rightLabel: string;
}) {
  const percentage = Math.round(value * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{leftLabel}</span>
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{rightLabel}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

/**
 * TonalAttributes display - Shows all tonal bars
 */
function TonalAttributesDisplay({
  tonalAttributes,
}: {
  tonalAttributes: TonalAttributes;
}) {
  return (
    <div className="space-y-3">
      <TonalBar
        label="Warmth"
        value={tonalAttributes.warmth}
        leftLabel="Reserved"
        rightLabel="Warm"
      />
      <TonalBar
        label="Authority"
        value={tonalAttributes.authority}
        leftLabel="Tentative"
        rightLabel="Confident"
      />
      <TonalBar
        label="Humor"
        value={tonalAttributes.humor}
        leftLabel="Serious"
        rightLabel="Playful"
      />
      <TonalBar
        label="Directness"
        value={tonalAttributes.directness}
        leftLabel="Nuanced"
        rightLabel="Direct"
      />
      <TonalBar
        label="Empathy"
        value={tonalAttributes.empathy}
        leftLabel="Analytical"
        rightLabel="Empathetic"
      />
    </div>
  );
}

/**
 * Compact version of the card for dashboard display
 */
function CompactVoiceDNACard({
  voiceDNA,
  summary,
  className,
}: VoiceDNACardProps) {
  if (!voiceDNA || !voiceDNA.tonalAttributes) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Ouno Core</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start recording to build your voice profile
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Ouno Core</CardTitle>
          </div>
          <Badge
            variant={
              summary?.calibrationLevel === "high"
                ? "default"
                : summary?.calibrationLevel === "medium"
                  ? "secondary"
                  : "outline"
            }
          >
            {voiceDNA.calibrationScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Key strengths */}
        {summary?.strengths && summary.strengths.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {summary.strengths.slice(0, 3).map((strength) => (
              <Badge key={strength} variant="secondary" className="text-xs">
                {strength}
              </Badge>
            ))}
          </div>
        )}

        {/* Top tonal attributes - show only strongest */}
        {voiceDNA.tonalAttributes && (
          <div className="space-y-2">
            <TonalBar
              label="Top trait"
              value={Math.max(
                voiceDNA.tonalAttributes.warmth,
                voiceDNA.tonalAttributes.authority,
                voiceDNA.tonalAttributes.directness
              )}
              leftLabel=""
              rightLabel=""
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Full VoiceDNACard component
 *
 * Displays the user's voice profile including:
 * - Tonal attributes as bars
 * - Unique phrases
 * - Enthusiastic topics
 * - Calibration score
 */
export function VoiceDNACard({
  voiceDNA,
  summary,
  className,
  compact = false,
}: VoiceDNACardProps) {
  if (compact) {
    return (
      <CompactVoiceDNACard
        voiceDNA={voiceDNA}
        summary={summary}
        className={className}
      />
    );
  }

  if (!voiceDNA) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Ouno Core Profile</CardTitle>
          </div>
          <CardDescription>
            Your unique voice fingerprint that powers content generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Mic className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-2">No voice profile yet</p>
            <p className="text-sm text-muted-foreground">
              Start recording to build your Ouno Core
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            <CardTitle>Ouno Core Profile</CardTitle>
          </div>
          <Badge
            variant={
              summary?.calibrationLevel === "high"
                ? "default"
                : summary?.calibrationLevel === "medium"
                  ? "secondary"
                  : "outline"
            }
            className="text-sm"
          >
            {voiceDNA.calibrationScore}% Calibrated
          </Badge>
        </div>
        <CardDescription>
          Your unique voice fingerprint that powers content generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tonal Attributes */}
        {voiceDNA.tonalAttributes && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Tonal Attributes
            </div>
            <TonalAttributesDisplay tonalAttributes={voiceDNA.tonalAttributes} />
          </div>
        )}

        {/* Unique Phrases */}
        {voiceDNA.spokenPatterns?.vocabulary.uniquePhrases &&
          voiceDNA.spokenPatterns.vocabulary.uniquePhrases.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4 text-primary" />
                Your Signature Phrases
              </div>
              <div className="flex flex-wrap gap-2">
                {voiceDNA.spokenPatterns.vocabulary.uniquePhrases.map(
                  (phrase) => (
                    <Badge key={phrase} variant="outline" className="text-xs">
                      &quot;{phrase}&quot;
                    </Badge>
                  )
                )}
              </div>
            </div>
          )}

        {/* Topics that excite */}
        {voiceDNA.spokenPatterns?.enthusiasm.topicsThatExcite &&
          voiceDNA.spokenPatterns.enthusiasm.topicsThatExcite.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4 text-primary" />
                Topics You&apos;re Passionate About
              </div>
              <div className="flex flex-wrap gap-2">
                {voiceDNA.spokenPatterns.enthusiasm.topicsThatExcite.map(
                  (topic) => (
                    <Badge key={topic} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  )
                )}
              </div>
            </div>
          )}

        {/* Strengths from summary */}
        {summary?.strengths && summary.strengths.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Your Strengths</div>
            <div className="flex flex-wrap gap-2">
              {summary.strengths.map((strength) => (
                <Badge key={strength} className="text-xs">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Rhetoric style */}
        {voiceDNA.spokenPatterns?.rhetoric && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Style: </span>
              <span className="capitalize">
                {voiceDNA.spokenPatterns.rhetoric.storytellingStyle}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Pace: </span>
              <span className="capitalize">
                {voiceDNA.spokenPatterns.rhythm?.paceVariation || "Varied"}
              </span>
            </div>
            {voiceDNA.spokenPatterns.rhetoric.usesQuestions && (
              <div className="col-span-2">
                <Badge variant="outline" className="text-xs">
                  Uses rhetorical questions
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
