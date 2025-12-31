/**
 * OpenAI Whisper Transcription Integration
 *
 * Handles audio transcription with word-level timestamps.
 */

import OpenAI from "openai";
import type { TranscribeResponse, WordTimestamp } from "@/types/voice";

// Lazy initialization of OpenAI client to avoid module-level errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperVerboseResponse {
  text: string;
  language: string;
  duration: number;
  words?: WhisperWord[];
}

/**
 * Transcribe audio using OpenAI Whisper API
 *
 * @param audioFile - The audio file to transcribe (as a File object)
 * @returns Transcription result with word-level timestamps
 */
export async function transcribeAudio(audioFile: File): Promise<TranscribeResponse> {
  const openai = getOpenAIClient();

  try {
    // Call Whisper API with verbose_json format for word timestamps
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
    });

    // Type assertion for verbose response
    const verboseResponse = response as unknown as WhisperVerboseResponse;

    // Parse word timestamps
    const wordTimestamps: WordTimestamp[] = (verboseResponse.words || []).map((word) => ({
      word: word.word.trim(),
      start: word.start,
      end: word.end,
      confidence: 1.0, // Whisper doesn't provide per-word confidence
    }));

    return {
      transcript: verboseResponse.text.trim(),
      durationSeconds: verboseResponse.duration,
      wordTimestamps,
      language: verboseResponse.language,
    };
  } catch (error: unknown) {
    console.error("Whisper transcription error:", error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error("Invalid OpenAI API key");
      }
      if (error.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      throw new Error(`Transcription failed: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Transcription failed: ${error.message}`);
    }

    throw new Error("Failed to transcribe audio. Please try again.");
  }
}

/**
 * Convert a Blob to a File object for the Whisper API
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Calculate words per second for a segment
 */
export function calculateWordsPerSecond(
  wordTimestamps: WordTimestamp[],
  startIndex: number,
  endIndex: number
): number {
  if (startIndex >= endIndex || endIndex > wordTimestamps.length) {
    return 0;
  }

  const startWord = wordTimestamps[startIndex];
  const endWord = wordTimestamps[endIndex - 1];

  if (!startWord || !endWord) {
    return 0;
  }

  const startTime = startWord.start;
  const endTime = endWord.end;
  const duration = endTime - startTime;
  const wordCount = endIndex - startIndex;

  return duration > 0 ? wordCount / duration : 0;
}
