/**
 * Voice Session Types
 *
 * Types for managing voice recording sessions and follow-up interactions.
 */

import type { WordTimestamp } from "./voice";

export type SessionMode = "quick" | "guided";

export type SessionStatus =
  | "recording"
  | "transcribing"
  | "analyzing"
  | "follow_ups"
  | "generating"
  | "complete"
  | "error";

export interface EnthusiasmSegment {
  startTime: number;
  endTime: number;
  text: string;
  energyScore: number; // 0-1
  indicators: ("pace_increase" | "dense_speech" | "emphasis_words" | "repetition")[];
}

export interface PeakMoment {
  timestamp: number;
  text: string;
  reason: string;
  useAs: "hook" | "key_point" | "conclusion" | "quote";
}

export interface EnthusiasmAnalysis {
  overallEnergy: number; // 0-1
  segments: EnthusiasmSegment[];
  peakMoments: PeakMoment[];
}

export interface ContentOutlineSection {
  type: "intro" | "main_point" | "example" | "conclusion";
  title: string;
  sourceTimestamps: { start: number; end: number }[];
  keyQuotes: string[];
}

export interface ContentOutline {
  suggestedTitle: string;
  sections: ContentOutlineSection[];
  estimatedWordCount: number;
}

export interface FollowUpQuestion {
  id: string;
  questionType: "clarify" | "expand" | "example" | "challenge";
  question: string;
  context: string; // Why this question was generated
  relatedTranscriptSegment?: string;
}

export type ResponseType = "voice" | "text" | "skip";

export interface FollowUpResponse {
  questionId: string;
  responseType: ResponseType;
  content: string; // Transcript or text
  durationSeconds?: number; // For voice responses
}

export interface VoiceSession {
  id: string;
  userId: string;
  mode: SessionMode;
  status: SessionStatus;
  transcript: string | null;
  durationSeconds: number | null;
  wordTimestamps: WordTimestamp[] | null;
  enthusiasmAnalysis: EnthusiasmAnalysis | null;
  contentOutline: ContentOutline | null;
  followUpQuestions: FollowUpQuestion[];
  followUpResponses: FollowUpResponse[];
  generatedContentId: string | null;
  title: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
