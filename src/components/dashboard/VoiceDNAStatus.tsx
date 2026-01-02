"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Mic, Sparkles, ChevronRight, Settings, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StrengthIndicator } from "@/components/voice-dna/StrengthIndicator";
import { cn } from "@/lib/utils";

interface VoiceDNAStats {
  hasProfile: boolean;
  calibrationScore: number;
  voiceSessionsAnalyzed: number;
  writingSamplesAnalyzed: number;
  calibrationRoundsCompleted: number;
  calibrationLevel: "low" | "medium" | "high";
  strengths: string[];
}

/**
 * VoiceDNAStatus Component
 *
 * Dashboard widget showing Ouno Core calibration status
 * with quick stats and CTA for improvement.
 * Uses React Query for automatic caching and background refetching.
 */
export function VoiceDNAStatus() {
  const {
    data: stats,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["voice-dna", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/voice-dna");
      if (!response.ok) throw new Error("Failed to fetch Ouno Core");

      const data = await response.json();
      return {
        hasProfile: data.hasProfile,
        calibrationScore: data.stats?.calibrationScore ?? 0,
        voiceSessionsAnalyzed: data.stats?.voiceSessionsAnalyzed ?? 0,
        writingSamplesAnalyzed: data.stats?.writingSamplesAnalyzed ?? 0,
        calibrationRoundsCompleted: data.stats?.calibrationRoundsCompleted ?? 0,
        calibrationLevel: data.summary?.calibrationLevel ?? "low",
        strengths: data.summary?.strengths ?? [],
      } as VoiceDNAStats;
    },
  });

  if (loading) {
    return (
      <div className="p-6 rounded-xl border bg-card space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24 mt-1" />
          </div>
        </div>
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border bg-card">
        <div className="flex items-center gap-3 text-sm text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load Ouno Core status</span>
        </div>
      </div>
    );
  }

  if (!stats?.hasProfile) {
    return (
      <div className="p-6 rounded-xl border border-dashed bg-muted/30">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mic className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Build Your Ouno Core</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complete your first recording to start building your unique voice profile.
            </p>
            <Link href="/record/guided">
              <Button size="sm" className="mt-3">
                <Sparkles className="h-4 w-4 mr-2" />
                Start Setup
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const needsImprovement = stats.calibrationScore < 70;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Ouno Core</h3>
            <CalibrationBadge level={stats.calibrationLevel} />
          </div>
        </div>
        <Link
          href="/settings/voice-dna"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Ouno Core settings"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      {/* Calibration Progress */}
      <div className="p-4 space-y-4">
        <StrengthIndicator score={stats.calibrationScore} size="sm" />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <StatBox value={stats.voiceSessionsAnalyzed} label="Sessions" />
          <StatBox value={stats.writingSamplesAnalyzed} label="Samples" />
          <StatBox value={stats.calibrationRoundsCompleted} label="Calibrations" />
        </div>

        {/* Strengths */}
        {stats.strengths.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">Your strengths:</p>
            <div className="flex flex-wrap gap-1">
              {stats.strengths.slice(0, 3).map((strength) => (
                <Badge key={strength} variant="secondary" className="text-xs">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Improvement CTA */}
        {needsImprovement && (
          <Link
            href="/settings/voice-dna"
            className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              "bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Improve calibration</span>
            </div>
            <ChevronRight className="h-4 w-4 text-primary" />
          </Link>
        )}
      </div>
    </div>
  );
}

function CalibrationBadge({ level }: { level: "low" | "medium" | "high" }) {
  const config = {
    low: { label: "Building", className: "text-warning bg-warning/10" },
    medium: { label: "Learning", className: "text-info bg-info/10" },
    high: { label: "Calibrated", className: "text-success bg-success/10" },
  };

  const { label, className } = config[level];

  return (
    <Badge variant="outline" className={cn("text-xs", className)}>
      {label}
    </Badge>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="p-2 rounded-lg bg-muted/50">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
