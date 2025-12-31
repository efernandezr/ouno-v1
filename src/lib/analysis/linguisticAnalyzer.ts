/**
 * Linguistic Analyzer
 *
 * Uses LLM (Claude via OpenRouter) to analyze transcript for:
 * - Vocabulary complexity and unique phrases
 * - Sentence structure patterns
 * - Rhetorical devices (questions, analogies)
 * - Storytelling patterns
 * - Tonal attributes
 */

import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { SpokenPatterns, TonalAttributes } from "@/types/voiceDNA";

// Get model from environment or use default
const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";

interface LinguisticAnalysisResult {
  spokenPatterns: SpokenPatterns;
  tonalAttributes: TonalAttributes;
  suggestedTopics: string[];
}

const ANALYSIS_PROMPT = `You are a linguistic analyst specializing in voice pattern extraction. Analyze the following transcript to extract the speaker's unique linguistic patterns.

TRANSCRIPT:
"""
{transcript}
"""

Analyze the transcript and return a JSON object with the following structure:

{
  "spokenPatterns": {
    "vocabulary": {
      "frequentWords": ["array of 5-10 distinctive words they use often"],
      "uniquePhrases": ["array of 3-5 unique phrases or expressions they use"],
      "fillerWords": ["array of filler words like 'um', 'like', 'you know'"],
      "preserveFillers": boolean // true if fillers add authenticity to their style
    },
    "rhythm": {
      "avgSentenceLength": "short" | "medium" | "long",
      "paceVariation": "consistent" | "varied" | "dynamic",
      "pausePatterns": "frequent" | "moderate" | "rare"
    },
    "rhetoric": {
      "usesQuestions": boolean, // Do they ask rhetorical questions?
      "usesAnalogies": boolean, // Do they use comparisons/analogies?
      "storytellingStyle": "anecdotal" | "hypothetical" | "personal" | "mixed"
    },
    "enthusiasm": {
      "topicsThatExcite": ["array of topics they seem passionate about"],
      "emphasisPatterns": ["phrases they use to emphasize points"],
      "energyBaseline": number // 0-1, their baseline energy level
    }
  },
  "tonalAttributes": {
    "warmth": number, // 0-1, how warm/friendly vs. professional
    "authority": number, // 0-1, how authoritative/confident
    "humor": number, // 0-1, how humorous their style is
    "directness": number, // 0-1, how direct vs. indirect
    "empathy": number // 0-1, how empathetic/understanding
  },
  "suggestedTopics": ["array of 3-5 topics they seem most knowledgeable about"]
}

Important guidelines:
- Base all analysis on actual patterns in the transcript
- If the transcript is short, make reasonable inferences but note lower confidence
- For numerical values, use decimals (e.g., 0.7, not 70)
- Focus on distinctive patterns, not generic observations
- The frequentWords should exclude common words (the, a, is, etc.)

Return ONLY the JSON object, no additional text.`;

/**
 * Analyze transcript for linguistic patterns using Claude
 */
export async function analyzeLinguistics(
  transcript: string
): Promise<LinguisticAnalysisResult> {
  if (!transcript || transcript.trim().length < 50) {
    return getDefaultAnalysis();
  }

  try {
    const prompt = ANALYSIS_PROMPT.replace("{transcript}", transcript);

    const { text } = await generateText({
      model: openrouter(MODEL),
      prompt,
      maxOutputTokens: 1500,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from response:", text);
      return getDefaultAnalysis();
    }

    // Safely parse JSON with error handling
    let result: LinguisticAnalysisResult;
    try {
      result = JSON.parse(jsonMatch[0]) as LinguisticAnalysisResult;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      console.error("Raw JSON:", jsonMatch[0].substring(0, 500));
      return getDefaultAnalysis();
    }

    // Validate and sanitize the result
    return sanitizeAnalysisResult(result);
  } catch (error) {
    console.error("Linguistic analysis failed:", error);
    return getDefaultAnalysis();
  }
}

/**
 * Analyze transcript for specific vocabulary patterns (non-LLM)
 * This can be used as a fallback or supplement
 */
export function analyzeVocabularyBasic(transcript: string): {
  wordCount: number;
  uniqueWordCount: number;
  avgWordLength: number;
  sentenceCount: number;
  avgSentenceLength: "short" | "medium" | "long";
} {
  const words = transcript.toLowerCase().match(/\b\w+\b/g) || [];
  const uniqueWords = new Set(words);
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim());

  const avgWordLength =
    words.length > 0
      ? words.reduce((sum, w) => sum + w.length, 0) / words.length
      : 0;

  const avgWordsPerSentence =
    sentences.length > 0 ? words.length / sentences.length : 0;

  let avgSentenceLength: "short" | "medium" | "long" = "medium";
  if (avgWordsPerSentence < 10) {
    avgSentenceLength = "short";
  } else if (avgWordsPerSentence > 20) {
    avgSentenceLength = "long";
  }

  return {
    wordCount: words.length,
    uniqueWordCount: uniqueWords.size,
    avgWordLength,
    sentenceCount: sentences.length,
    avgSentenceLength,
  };
}

/**
 * Extract filler words from transcript (non-LLM)
 */
export function extractFillerWords(transcript: string): string[] {
  const commonFillers = [
    "um",
    "uh",
    "like",
    "you know",
    "basically",
    "actually",
    "literally",
    "sort of",
    "kind of",
    "i mean",
    "right",
    "so",
    "well",
    "anyway",
    "honestly",
  ];

  const lowerTranscript = transcript.toLowerCase();
  const foundFillers: string[] = [];

  for (const filler of commonFillers) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    const matches = lowerTranscript.match(regex);
    if (matches && matches.length >= 2) {
      foundFillers.push(filler);
    }
  }

  return foundFillers;
}

/**
 * Detect rhetorical questions (non-LLM)
 */
export function detectRhetoricalQuestions(transcript: string): boolean {
  const questionPatterns = [
    /\?[^.!?]*\./g, // Question followed by statement
    /(?:right|isn't it|don't you think|wouldn't you|you know)\?/gi,
    /(?:what if|how can we|why do we)\s+[^?]*\?/gi,
  ];

  for (const pattern of questionPatterns) {
    if (pattern.test(transcript)) {
      return true;
    }
  }

  return false;
}

/**
 * Get default analysis when LLM fails or transcript is too short
 */
function getDefaultAnalysis(): LinguisticAnalysisResult {
  return {
    spokenPatterns: {
      vocabulary: {
        frequentWords: [],
        uniquePhrases: [],
        fillerWords: [],
        preserveFillers: false,
      },
      rhythm: {
        avgSentenceLength: "medium",
        paceVariation: "consistent",
        pausePatterns: "moderate",
      },
      rhetoric: {
        usesQuestions: false,
        usesAnalogies: false,
        storytellingStyle: "mixed",
      },
      enthusiasm: {
        topicsThatExcite: [],
        emphasisPatterns: [],
        energyBaseline: 0.5,
      },
    },
    tonalAttributes: {
      warmth: 0.5,
      authority: 0.5,
      humor: 0.3,
      directness: 0.5,
      empathy: 0.5,
    },
    suggestedTopics: [],
  };
}

/**
 * Sanitize and validate the analysis result
 */
function sanitizeAnalysisResult(
  result: Partial<LinguisticAnalysisResult>
): LinguisticAnalysisResult {
  const defaults = getDefaultAnalysis();

  // Helper to clamp number between 0 and 1
  const clamp = (value: unknown, defaultValue: number): number => {
    if (typeof value !== "number" || isNaN(value)) return defaultValue;
    return Math.max(0, Math.min(1, value));
  };

  // Helper to ensure array
  const ensureArray = (value: unknown, defaultValue: string[]): string[] => {
    if (!Array.isArray(value)) return defaultValue;
    return value.filter((v): v is string => typeof v === "string");
  };

  // Helper to ensure valid enum value
  const ensureEnum = <T extends string>(
    value: unknown,
    validValues: T[],
    defaultValue: T
  ): T => {
    if (typeof value === "string" && validValues.includes(value as T)) {
      return value as T;
    }
    return defaultValue;
  };

  const sp = result.spokenPatterns || defaults.spokenPatterns;
  const ta = result.tonalAttributes || defaults.tonalAttributes;

  return {
    spokenPatterns: {
      vocabulary: {
        frequentWords: ensureArray(
          sp.vocabulary?.frequentWords,
          defaults.spokenPatterns.vocabulary.frequentWords
        ),
        uniquePhrases: ensureArray(
          sp.vocabulary?.uniquePhrases,
          defaults.spokenPatterns.vocabulary.uniquePhrases
        ),
        fillerWords: ensureArray(
          sp.vocabulary?.fillerWords,
          defaults.spokenPatterns.vocabulary.fillerWords
        ),
        preserveFillers:
          typeof sp.vocabulary?.preserveFillers === "boolean"
            ? sp.vocabulary.preserveFillers
            : defaults.spokenPatterns.vocabulary.preserveFillers,
      },
      rhythm: {
        avgSentenceLength: ensureEnum(
          sp.rhythm?.avgSentenceLength,
          ["short", "medium", "long"],
          defaults.spokenPatterns.rhythm.avgSentenceLength
        ),
        paceVariation: ensureEnum(
          sp.rhythm?.paceVariation,
          ["consistent", "varied", "dynamic"],
          defaults.spokenPatterns.rhythm.paceVariation
        ),
        pausePatterns: ensureEnum(
          sp.rhythm?.pausePatterns,
          ["frequent", "moderate", "rare"],
          defaults.spokenPatterns.rhythm.pausePatterns
        ),
      },
      rhetoric: {
        usesQuestions:
          typeof sp.rhetoric?.usesQuestions === "boolean"
            ? sp.rhetoric.usesQuestions
            : defaults.spokenPatterns.rhetoric.usesQuestions,
        usesAnalogies:
          typeof sp.rhetoric?.usesAnalogies === "boolean"
            ? sp.rhetoric.usesAnalogies
            : defaults.spokenPatterns.rhetoric.usesAnalogies,
        storytellingStyle: ensureEnum(
          sp.rhetoric?.storytellingStyle,
          ["anecdotal", "hypothetical", "personal", "mixed"],
          defaults.spokenPatterns.rhetoric.storytellingStyle
        ),
      },
      enthusiasm: {
        topicsThatExcite: ensureArray(
          sp.enthusiasm?.topicsThatExcite,
          defaults.spokenPatterns.enthusiasm.topicsThatExcite
        ),
        emphasisPatterns: ensureArray(
          sp.enthusiasm?.emphasisPatterns,
          defaults.spokenPatterns.enthusiasm.emphasisPatterns
        ),
        energyBaseline: clamp(
          sp.enthusiasm?.energyBaseline,
          defaults.spokenPatterns.enthusiasm.energyBaseline
        ),
      },
    },
    tonalAttributes: {
      warmth: clamp(ta.warmth, defaults.tonalAttributes.warmth),
      authority: clamp(ta.authority, defaults.tonalAttributes.authority),
      humor: clamp(ta.humor, defaults.tonalAttributes.humor),
      directness: clamp(ta.directness, defaults.tonalAttributes.directness),
      empathy: clamp(ta.empathy, defaults.tonalAttributes.empathy),
    },
    suggestedTopics: ensureArray(result.suggestedTopics, []),
  };
}

/**
 * Combine multiple analysis results (for building Voice DNA over time)
 */
export function mergeAnalysisResults(
  existing: LinguisticAnalysisResult | null,
  newAnalysis: LinguisticAnalysisResult,
  newWeight: number = 0.3 // Weight of new analysis vs existing
): LinguisticAnalysisResult {
  if (!existing) return newAnalysis;

  // Helper to merge arrays (union with limited size)
  const mergeArrays = (
    arr1: string[],
    arr2: string[],
    maxSize: number = 10
  ): string[] => {
    const merged = [...new Set([...arr2, ...arr1])];
    return merged.slice(0, maxSize);
  };

  // Helper to weighted average numbers
  const weightedAvg = (old: number, next: number): number => {
    return old * (1 - newWeight) + next * newWeight;
  };

  return {
    spokenPatterns: {
      vocabulary: {
        frequentWords: mergeArrays(
          existing.spokenPatterns.vocabulary.frequentWords,
          newAnalysis.spokenPatterns.vocabulary.frequentWords
        ),
        uniquePhrases: mergeArrays(
          existing.spokenPatterns.vocabulary.uniquePhrases,
          newAnalysis.spokenPatterns.vocabulary.uniquePhrases,
          5
        ),
        fillerWords: mergeArrays(
          existing.spokenPatterns.vocabulary.fillerWords,
          newAnalysis.spokenPatterns.vocabulary.fillerWords,
          5
        ),
        preserveFillers:
          newAnalysis.spokenPatterns.vocabulary.preserveFillers ||
          existing.spokenPatterns.vocabulary.preserveFillers,
      },
      rhythm: {
        // For categorical values, prefer the newer analysis if consistently different
        avgSentenceLength: newAnalysis.spokenPatterns.rhythm.avgSentenceLength,
        paceVariation: newAnalysis.spokenPatterns.rhythm.paceVariation,
        pausePatterns: newAnalysis.spokenPatterns.rhythm.pausePatterns,
      },
      rhetoric: {
        usesQuestions:
          newAnalysis.spokenPatterns.rhetoric.usesQuestions ||
          existing.spokenPatterns.rhetoric.usesQuestions,
        usesAnalogies:
          newAnalysis.spokenPatterns.rhetoric.usesAnalogies ||
          existing.spokenPatterns.rhetoric.usesAnalogies,
        storytellingStyle: newAnalysis.spokenPatterns.rhetoric.storytellingStyle,
      },
      enthusiasm: {
        topicsThatExcite: mergeArrays(
          existing.spokenPatterns.enthusiasm.topicsThatExcite,
          newAnalysis.spokenPatterns.enthusiasm.topicsThatExcite,
          8
        ),
        emphasisPatterns: mergeArrays(
          existing.spokenPatterns.enthusiasm.emphasisPatterns,
          newAnalysis.spokenPatterns.enthusiasm.emphasisPatterns,
          5
        ),
        energyBaseline: weightedAvg(
          existing.spokenPatterns.enthusiasm.energyBaseline,
          newAnalysis.spokenPatterns.enthusiasm.energyBaseline
        ),
      },
    },
    tonalAttributes: {
      warmth: weightedAvg(
        existing.tonalAttributes.warmth,
        newAnalysis.tonalAttributes.warmth
      ),
      authority: weightedAvg(
        existing.tonalAttributes.authority,
        newAnalysis.tonalAttributes.authority
      ),
      humor: weightedAvg(
        existing.tonalAttributes.humor,
        newAnalysis.tonalAttributes.humor
      ),
      directness: weightedAvg(
        existing.tonalAttributes.directness,
        newAnalysis.tonalAttributes.directness
      ),
      empathy: weightedAvg(
        existing.tonalAttributes.empathy,
        newAnalysis.tonalAttributes.empathy
      ),
    },
    suggestedTopics: mergeArrays(
      existing.suggestedTopics,
      newAnalysis.suggestedTopics,
      5
    ),
  };
}
