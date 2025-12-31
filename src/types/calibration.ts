/**
 * Calibration Types
 *
 * Types for the calibration system that helps improve Voice DNA accuracy
 * through user feedback on generated samples.
 */

import type { ResponseType } from "./session";

export interface CalibrationInsight {
  type: "style_preference" | "tone_adjustment" | "vocabulary" | "structure";
  insight: string;
  confidence: number; // 0-1
}

export interface CalibrationRound {
  id: string;
  userId: string;
  roundNumber: number;
  promptText: string;
  userResponseTranscript: string | null;
  userResponseType: ResponseType | null;
  generatedSample: string | null;
  rating: number | null; // 1-5
  feedbackTranscript: string | null;
  feedbackText: string | null;
  insightsExtracted: CalibrationInsight[] | null;
  createdAt: Date;
}

export type OnboardingStatus =
  | "not_started"
  | "voice_intro"
  | "follow_ups"
  | "samples"
  | "complete";
