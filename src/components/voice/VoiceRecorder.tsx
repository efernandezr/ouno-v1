"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceRecorder as Recorder, isRecordingSupported } from "@/lib/voice/recorder";
import type { RecorderStatus } from "@/lib/voice/recorder";
import type { RecordingMode } from "@/types/voice";
import { AudioVisualizer } from "./AudioVisualizer";
import { RecordingControls } from "./RecordingControls";

// Client-side only check using useSyncExternalStore (hydration-safe)
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // Client value
    () => false  // Server value
  );
}

interface VoiceRecorderProps {
  mode: RecordingMode;
  maxDuration: number; // seconds
  prompt?: string;
  onComplete: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

/**
 * VoiceRecorder Component
 *
 * Main voice recording component that combines the visualizer and controls.
 * Handles the full recording lifecycle including duration limits.
 */
export function VoiceRecorder({
  mode,
  maxDuration,
  prompt,
  onComplete,
  onCancel,
}: VoiceRecorderProps) {
  const [status, setStatus] = useState<RecorderStatus | "processing">("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<Recorder | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const onStopRef = useRef<(() => void) | null>(null);

  // Hydration-safe mounted check
  const mounted = useIsMounted();

  // Check browser support - only check after mount to avoid hydration mismatch
  const isSupported = mounted && isRecordingSupported();

  const stopDurationTracking = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Handle duration tracking - must be defined after stopDurationTracking
  const startDurationTracking = useCallback(() => {
    startTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const totalDuration = pausedDurationRef.current + elapsed;
      setDuration(totalDuration);

      // Auto-stop at max duration using ref to avoid stale closure
      if (totalDuration >= maxDuration) {
        onStopRef.current?.();
      }
    }, 100);
  }, [maxDuration]);

  // Initialize recorder
  useEffect(() => {
    if (!isSupported) {
      // Early return - the component will render the unsupported browser message
      return;
    }

    recorderRef.current = new Recorder({
      onAudioLevel: setAudioLevel,
      onStatusChange: (newStatus) => {
        if (newStatus !== "stopped") {
          setStatus(newStatus);
        }
      },
      onError: (err) => {
        setError(err.message);
        setStatus("idle");
      },
    });

    return () => {
      recorderRef.current?.destroy();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isSupported]);

  // Recording controls
  const handleStart = async () => {
    try {
      setError(null);
      await recorderRef.current?.start();
      startDurationTracking();
    } catch {
      setError("Failed to start recording. Please check microphone permissions.");
    }
  };

  const handlePause = () => {
    recorderRef.current?.pause();
    pausedDurationRef.current = duration;
    stopDurationTracking();
  };

  const handleResume = () => {
    recorderRef.current?.resume();
    startDurationTracking();
  };

  const handleStop = useCallback(async () => {
    stopDurationTracking();
    setStatus("processing");

    try {
      const audioBlob = await recorderRef.current?.stop();
      if (audioBlob && audioBlob.size > 0) {
        onComplete(audioBlob, duration);
      } else {
        setError("No audio was recorded. Please try again.");
        setStatus("idle");
      }
    } catch {
      setError("Failed to process recording. Please try again.");
      setStatus("idle");
    }
  }, [duration, onComplete, stopDurationTracking]);

  // Keep ref up to date for interval callback
  useEffect(() => {
    onStopRef.current = handleStop;
  }, [handleStop]);

  const handleCancel = () => {
    recorderRef.current?.destroy();
    stopDurationTracking();
    onCancel();
  };

  // Show loading state until mounted (avoids hydration mismatch)
  if (!mounted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="relative">
          <CardTitle className="text-center">
            {mode === "quick" && "Thought Stream"}
            {mode === "guided" && "Deep Dive"}
            {mode === "follow_up" && "Follow-up Response"}
            {mode === "calibration" && "Calibration"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-24 rounded-lg border bg-background animate-pulse" />
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your browser doesn&apos;t support audio recording. Please use Chrome, Firefox, Safari, or Edge.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={handleCancel}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cancel</span>
        </Button>
        <CardTitle className="text-center">
          {mode === "quick" && "Quick Capture"}
          {mode === "guided" && "Guided Session"}
          {mode === "follow_up" && "Follow-up Response"}
          {mode === "calibration" && "Calibration"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prompt */}
        {prompt && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-center">{prompt}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Audio Visualizer */}
        <div className="h-24 rounded-lg border bg-background">
          <AudioVisualizer
            audioLevel={audioLevel}
            isRecording={status === "recording"}
            className="w-full h-full"
          />
        </div>

        {/* Recording Controls */}
        <RecordingControls
          status={status}
          duration={duration}
          maxDuration={maxDuration}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
        />
      </CardContent>
    </Card>
  );
}
