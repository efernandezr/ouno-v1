/**
 * Voice Recording and Transcription Types
 */

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscribeResponse {
  transcript: string;
  durationSeconds: number;
  wordTimestamps: WordTimestamp[];
  language: string;
}

export interface RecordingState {
  status: "idle" | "recording" | "paused" | "processing";
  duration: number;
  audioLevel: number; // 0-100
  error: string | null;
}

export type RecordingMode = "quick" | "guided" | "follow_up" | "calibration";

export interface VoiceRecorderProps {
  mode: RecordingMode;
  maxDuration: number; // seconds
  prompt?: string;
  onComplete: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}
