"use client";

import { Mic, Square, Pause, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RecorderStatus } from "@/lib/voice/recorder";
import { formatDuration } from "@/lib/voice/recorder";

interface RecordingControlsProps {
  status: RecorderStatus | "processing";
  duration: number; // seconds
  maxDuration: number; // seconds
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  className?: string;
}

/**
 * RecordingControls Component
 *
 * Provides start/stop/pause controls for voice recording.
 * Mobile-first design with large touch targets.
 */
export function RecordingControls({
  status,
  duration,
  maxDuration,
  onStart,
  onPause,
  onResume,
  onStop,
  className,
}: RecordingControlsProps) {
  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const isProcessing = status === "processing";
  const isIdle = status === "idle" || status === "stopped";

  const progressPercent = Math.min(100, (duration / maxDuration) * 100);
  const remainingTime = maxDuration - duration;

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      {/* Duration Display */}
      <div className="text-center">
        <div className="text-4xl font-mono font-bold tabular-nums">
          {formatDuration(duration)}
        </div>
        <div className="text-sm text-muted-foreground">
          {remainingTime > 0 ? (
            <span>{formatDuration(remainingTime)} remaining</span>
          ) : (
            <span className="text-destructive">Time limit reached</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              progressPercent >= 90
                ? "bg-destructive"
                : progressPercent >= 70
                  ? "bg-yellow-500"
                  : "bg-primary"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        {isIdle && (
          <Button
            size="lg"
            className="h-20 w-20 rounded-full"
            onClick={onStart}
          >
            <Mic className="h-8 w-8" />
            <span className="sr-only">Start Recording</span>
          </Button>
        )}

        {isRecording && (
          <>
            <Button
              size="lg"
              variant="outline"
              className="h-16 w-16 rounded-full"
              onClick={onPause}
            >
              <Pause className="h-6 w-6" />
              <span className="sr-only">Pause</span>
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="h-20 w-20 rounded-full"
              onClick={onStop}
            >
              <Square className="h-8 w-8" />
              <span className="sr-only">Stop Recording</span>
            </Button>
          </>
        )}

        {isPaused && (
          <>
            <Button
              size="lg"
              variant="outline"
              className="h-16 w-16 rounded-full"
              onClick={onResume}
            >
              <Play className="h-6 w-6" />
              <span className="sr-only">Resume</span>
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="h-20 w-20 rounded-full"
              onClick={onStop}
            >
              <Square className="h-8 w-8" />
              <span className="sr-only">Stop Recording</span>
            </Button>
          </>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center gap-2">
            <div className="h-20 w-20 rounded-full border-4 border-primary/20 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Processing...</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      {isIdle && (
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Tap the microphone to start recording. Speak naturally about your topic.
        </p>
      )}

      {(isRecording || isPaused) && (
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {isRecording
            ? "Recording... Tap stop when you're done."
            : "Recording paused. Resume or stop to finish."}
        </p>
      )}
    </div>
  );
}
