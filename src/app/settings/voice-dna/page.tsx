"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lock,
  Mic,
  RefreshCw,
  ChevronLeft,
  AlertCircle,
  Trash2,
  FileText,
} from "lucide-react";
import { UserProfile } from "@/components/auth/user-profile";
import { WritingSamplesSection } from "@/components/samples";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalibrationFlow } from "@/components/voice-dna/CalibrationFlow";
import { StrengthIndicator } from "@/components/voice-dna/StrengthIndicator";
import { VoiceDNACard } from "@/components/voice-dna/VoiceDNACard";
import { useSessionContext } from "@/contexts/session-context";
import type { VoiceDNA, LearnedRule } from "@/types/voiceDNA";

interface VoiceDNAResponse {
  hasProfile: boolean;
  voiceDNA: VoiceDNA | null;
  summary: {
    strengths: string[];
    characteristics: string[];
    calibrationLevel: "low" | "medium" | "high";
  } | null;
  stats: {
    voiceSessionsAnalyzed: number;
    writingSamplesAnalyzed: number;
    calibrationRoundsCompleted: number;
    calibrationScore: number;
  };
}

export default function VoiceDNASettingsPage() {
  const { data: session, isPending: sessionPending } = useSessionContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCalibration, setShowCalibration] = useState(false);

  // Fetch Voice DNA profile with React Query
  const {
    data,
    isLoading: loading,
    error,
    refetch: fetchVoiceDNA,
  } = useQuery({
    queryKey: ["voice-dna", "full"],
    queryFn: async () => {
      const response = await fetch("/api/voice-dna");
      if (!response.ok) {
        throw new Error("Failed to fetch Ouno Core profile");
      }
      return response.json() as Promise<VoiceDNAResponse>;
    },
    enabled: !!session,
  });

  // Rebuild Voice DNA mutation
  const rebuildMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/voice-dna/rebuild", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to rebuild Ouno Core profile");
      }
      return response.json() as Promise<VoiceDNAResponse>;
    },
    onSuccess: () => {
      // Invalidate and refetch voice DNA data
      queryClient.invalidateQueries({ queryKey: ["voice-dna"] });
    },
  });

  if (sessionPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to access your Ouno Core settings
            </p>
          </div>
          <UserProfile />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => router.push("/dashboard")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Mic className="h-8 w-8 text-primary" />
                Ouno Core Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                View and manage your voice profile
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rebuildMutation.mutate()}
              disabled={loading || rebuildMutation.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${rebuildMutation.isPending ? "animate-spin" : ""}`}
              />
              {rebuildMutation.isPending ? "Rebuilding..." : "Rebuild"}
            </Button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Failed to load Ouno Core</p>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "An error occurred"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchVoiceDNA()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loading && !data && (
          <div className="space-y-6">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        )}

        {/* Content */}
        {data && (
          <div className="space-y-6">
            {/* Calibration Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Calibration Progress</CardTitle>
                <CardDescription>
                  Your Ouno Core improves with more recordings and calibration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <StrengthIndicator
                  score={data.stats.calibrationScore}
                  size="lg"
                />

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">
                      {data.stats.voiceSessionsAnalyzed}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Voice Sessions
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">
                      {data.stats.writingSamplesAnalyzed}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Writing Samples
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">
                      {data.stats.calibrationRoundsCompleted}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Calibration Rounds
                    </div>
                  </div>
                </div>

                {/* Tips for improvement */}
                {data.stats.calibrationScore < 70 && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-medium mb-2">
                      Tips to improve calibration:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {data.stats.voiceSessionsAnalyzed < 3 && (
                        <li>• Record more voice sessions (at least 3)</li>
                      )}
                      {data.stats.writingSamplesAnalyzed < 1 && (
                        <li>• Upload a writing sample for better style matching</li>
                      )}
                      {data.stats.calibrationRoundsCompleted < 3 && (
                        <li>
                          • Complete calibration rounds to fine-tune your profile
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calibration Rounds Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5" />
                      Calibration Rounds
                    </CardTitle>
                    <CardDescription>
                      Fine-tune your Ouno Core by reviewing AI-generated samples
                    </CardDescription>
                  </div>
                  {!showCalibration && (
                    <Button onClick={() => setShowCalibration(true)}>
                      {data.stats.calibrationRoundsCompleted > 0
                        ? `Continue (${data.stats.calibrationRoundsCompleted}/3)`
                        : "Start Calibration"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              {showCalibration && (
                <CardContent>
                  <CalibrationFlow
                    initialRound={Math.min(data.stats.calibrationRoundsCompleted + 1, 3)}
                    totalRounds={3}
                    onComplete={() => {
                      setShowCalibration(false);
                      rebuildMutation.mutate();
                    }}
                  />
                </CardContent>
              )}
              {!showCalibration && data.stats.calibrationRoundsCompleted > 0 && (
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    You&apos;ve completed {data.stats.calibrationRoundsCompleted} of 3 calibration rounds.
                    {data.stats.calibrationRoundsCompleted < 3 && (
                      <span> Complete more rounds to improve accuracy.</span>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Writing Samples Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Writing Samples
                </CardTitle>
                <CardDescription>
                  Add writing samples to improve how well generated content
                  matches your style
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WritingSamplesSection onSamplesChange={() => fetchVoiceDNA()} />
              </CardContent>
            </Card>

            {/* Voice DNA Profile */}
            <VoiceDNACard voiceDNA={data.voiceDNA} summary={data.summary} />

            {/* Learned Rules */}
            {data.voiceDNA?.learnedRules &&
              data.voiceDNA.learnedRules.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Learned Preferences</CardTitle>
                    <CardDescription>
                      Rules the system has learned from your feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.voiceDNA.learnedRules.map(
                        (rule: LearnedRule, index: number) => (
                          <div
                            key={index}
                            className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-start gap-3">
                              <Badge
                                variant={
                                  rule.type === "prefer"
                                    ? "default"
                                    : rule.type === "avoid"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="mt-0.5"
                              >
                                {rule.type}
                              </Badge>
                              <div>
                                <p className="text-sm">{rule.content}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Confidence: {Math.round(rule.confidence * 100)}%
                                  • From {rule.sourceCount} source
                                  {rule.sourceCount > 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* No profile state */}
            {!data.hasProfile && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Mic className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Ouno Core Profile Yet
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Start by recording your first Spark. The system will
                    analyze your speaking patterns to build your unique Ouno Core.
                  </p>
                  <Button onClick={() => router.push("/record")}>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
