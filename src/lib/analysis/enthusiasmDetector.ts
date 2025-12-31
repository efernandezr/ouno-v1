/**
 * Enthusiasm Detection Algorithm
 *
 * Analyzes voice transcripts with timestamps to detect high-energy segments
 * where the speaker shows excitement about topics.
 *
 * Detection signals:
 * - Pace increase (words per second > 3.0)
 * - Dense speech patterns (minimal pauses)
 * - Emphasis words (really, absolutely, incredible, etc.)
 * - Word repetition (consecutive repetition of words)
 */

import type {
  EnthusiasmAnalysis,
  EnthusiasmSegment,
  PeakMoment,
} from "@/types/session";
import type { WordTimestamp } from "@/types/voice";

// Words that indicate emphasis/excitement when used
const EMPHASIS_WORDS = new Set([
  "really",
  "absolutely",
  "incredible",
  "amazing",
  "crucial",
  "essential",
  "love",
  "hate",
  "brilliant",
  "terrible",
  "fantastic",
  "definitely",
  "exactly",
  "totally",
  "completely",
  "actually",
  "seriously",
  "literally",
  "honestly",
  "huge",
  "massive",
  "critical",
  "vital",
  "important",
  "fascinating",
  "exciting",
  "passionate",
]);

// Threshold constants
const EXCITED_PACE_THRESHOLD = 3.0; // words per second
const THOUGHTFUL_PACE_THRESHOLD = 2.0;
const MIN_SEGMENT_DURATION = 2.0; // seconds
const SEGMENT_WINDOW_SIZE = 5; // words to analyze together

interface SegmentAnalysis {
  startTime: number;
  endTime: number;
  words: WordTimestamp[];
  wordsPerSecond: number;
  emphasisCount: number;
  repetitionCount: number;
  text: string;
}

/**
 * Calculate words per second for a segment
 */
function calculatePace(words: WordTimestamp[]): number {
  if (words.length < 2) return 0;
  const firstWord = words[0];
  const lastWord = words[words.length - 1];
  if (!firstWord || !lastWord) return 0;
  const duration = lastWord.end - firstWord.start;
  if (duration <= 0) return 0;
  return words.length / duration;
}

/**
 * Count emphasis words in a segment
 */
function countEmphasisWords(words: WordTimestamp[]): number {
  return words.filter((w) =>
    EMPHASIS_WORDS.has(w.word.toLowerCase().replace(/[^\w]/g, ""))
  ).length;
}

/**
 * Detect repetition patterns (same word repeated within 3 words)
 */
function countRepetitions(words: WordTimestamp[]): number {
  let count = 0;
  const cleanWords = words.map((w) =>
    w.word.toLowerCase().replace(/[^\w]/g, "")
  );

  for (let i = 0; i < cleanWords.length; i++) {
    const currentWord = cleanWords[i];
    if (!currentWord) continue;

    for (let j = 1; j <= 3 && i + j < cleanWords.length; j++) {
      const compareWord = cleanWords[i + j];
      if (
        compareWord &&
        currentWord === compareWord &&
        currentWord.length > 2 // Ignore short words like "a", "to"
      ) {
        count++;
        break;
      }
    }
  }
  return count;
}

/**
 * Calculate energy score for a segment (0-1)
 */
function calculateEnergyScore(segment: SegmentAnalysis): number {
  let score = 0;

  // Pace contribution (0-0.4)
  if (segment.wordsPerSecond > EXCITED_PACE_THRESHOLD) {
    score += 0.4;
  } else if (segment.wordsPerSecond > THOUGHTFUL_PACE_THRESHOLD) {
    score +=
      0.2 *
      ((segment.wordsPerSecond - THOUGHTFUL_PACE_THRESHOLD) /
        (EXCITED_PACE_THRESHOLD - THOUGHTFUL_PACE_THRESHOLD));
  }

  // Emphasis words contribution (0-0.35)
  const emphasisRatio = segment.emphasisCount / segment.words.length;
  score += Math.min(emphasisRatio * 3.5, 0.35);

  // Repetition contribution (0-0.25)
  const repetitionRatio = segment.repetitionCount / segment.words.length;
  score += Math.min(repetitionRatio * 2.5, 0.25);

  return Math.min(score, 1);
}

/**
 * Determine which indicators are present in a segment
 */
function getIndicators(
  segment: SegmentAnalysis
): EnthusiasmSegment["indicators"] {
  const indicators: EnthusiasmSegment["indicators"] = [];

  if (segment.wordsPerSecond > EXCITED_PACE_THRESHOLD) {
    indicators.push("pace_increase");
  }

  // Dense speech = high pace with minimal pauses
  const avgWordDuration =
    segment.words.reduce((sum, w) => sum + (w.end - w.start), 0) /
    segment.words.length;
  const totalDuration = segment.endTime - segment.startTime;
  const speechDensity =
    (avgWordDuration * segment.words.length) / totalDuration;
  if (speechDensity > 0.7) {
    indicators.push("dense_speech");
  }

  if (segment.emphasisCount > 0) {
    indicators.push("emphasis_words");
  }

  if (segment.repetitionCount > 0) {
    indicators.push("repetition");
  }

  return indicators;
}

/**
 * Analyze word timestamps and create segment analyses
 */
function analyzeSegments(
  wordTimestamps: WordTimestamp[]
): SegmentAnalysis[] {
  const segments: SegmentAnalysis[] = [];

  for (let i = 0; i < wordTimestamps.length; i += SEGMENT_WINDOW_SIZE) {
    const endIndex = Math.min(i + SEGMENT_WINDOW_SIZE, wordTimestamps.length);
    const words = wordTimestamps.slice(i, endIndex);

    if (words.length < 2) continue;

    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    if (!firstWord || !lastWord) continue;

    const segment: SegmentAnalysis = {
      startTime: firstWord.start,
      endTime: lastWord.end,
      words,
      wordsPerSecond: calculatePace(words),
      emphasisCount: countEmphasisWords(words),
      repetitionCount: countRepetitions(words),
      text: words.map((w) => w.word).join(" "),
    };

    segments.push(segment);
  }

  return segments;
}

/**
 * Merge adjacent high-energy segments
 */
function mergeHighEnergySegments(
  segments: SegmentAnalysis[],
  threshold: number
): SegmentAnalysis[] {
  const highEnergy = segments.filter(
    (s) => calculateEnergyScore(s) >= threshold
  );
  if (highEnergy.length === 0) return [];

  const firstSegment = highEnergy[0];
  if (!firstSegment) return [];

  const merged: SegmentAnalysis[] = [];
  let current: SegmentAnalysis = { ...firstSegment };

  for (let i = 1; i < highEnergy.length; i++) {
    const next = highEnergy[i];
    if (!next) continue;

    // Merge if segments are close together (< 2 seconds gap)
    if (next.startTime - current.endTime < 2) {
      const mergedWords = [...current.words, ...next.words];
      current = {
        startTime: current.startTime,
        endTime: next.endTime,
        words: mergedWords,
        wordsPerSecond: calculatePace(mergedWords),
        emphasisCount: current.emphasisCount + next.emphasisCount,
        repetitionCount: current.repetitionCount + next.repetitionCount,
        text: current.text + " " + next.text,
      };
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);

  return merged.filter((s) => s.endTime - s.startTime >= MIN_SEGMENT_DURATION);
}

/**
 * Identify peak moments from high-energy segments
 */
function identifyPeakMoments(segments: SegmentAnalysis[]): PeakMoment[] {
  const moments: PeakMoment[] = [];

  // Sort by energy score to get the top moments
  const sortedSegments = [...segments].sort(
    (a, b) => calculateEnergyScore(b) - calculateEnergyScore(a)
  );

  // Take top 3-5 peak moments
  const topSegments = sortedSegments.slice(0, 5);

  topSegments.forEach((segment, index) => {
    const energyScore = calculateEnergyScore(segment);
    const indicators = getIndicators(segment);

    // Determine the reason for this being a peak
    let reason = "High energy detected";
    if (indicators.includes("pace_increase")) {
      reason = "Fast-paced, excited delivery";
    } else if (indicators.includes("emphasis_words")) {
      reason = "Strong emphasis and conviction";
    } else if (indicators.includes("repetition")) {
      reason = "Repeated emphasis on key points";
    }

    // Determine suggested use
    let useAs: PeakMoment["useAs"] = "key_point";
    if (index === 0 && energyScore > 0.7) {
      useAs = "hook"; // Highest energy = potential hook
    } else if (segment.text.includes("?")) {
      useAs = "quote";
    } else if (indicators.length >= 2) {
      useAs = "conclusion"; // Multiple indicators = strong statement
    }

    moments.push({
      timestamp: segment.startTime,
      text: segment.text,
      reason,
      useAs,
    });
  });

  return moments;
}

/**
 * Main enthusiasm detection function
 *
 * Analyzes word timestamps to identify:
 * - Overall energy level of the transcript
 * - High-enthusiasm segments with energy scores
 * - Peak moments that could be used as hooks, key points, etc.
 */
export function detectEnthusiasm(
  wordTimestamps: WordTimestamp[]
): EnthusiasmAnalysis {
  if (!wordTimestamps || wordTimestamps.length === 0) {
    return {
      overallEnergy: 0,
      segments: [],
      peakMoments: [],
    };
  }

  // Analyze all segments
  const allSegments = analyzeSegments(wordTimestamps);

  // Calculate overall energy (average of all segments)
  const energyScores = allSegments.map(calculateEnergyScore);
  const overallEnergy =
    energyScores.length > 0
      ? energyScores.reduce((sum, e) => sum + e, 0) / energyScores.length
      : 0;

  // Find high-energy threshold (segments above average)
  const threshold = Math.max(0.3, overallEnergy);

  // Merge adjacent high-energy segments
  const mergedSegments = mergeHighEnergySegments(allSegments, threshold);

  // Convert to EnthusiasmSegment format
  const enthusiasmSegments: EnthusiasmSegment[] = mergedSegments.map(
    (segment) => ({
      startTime: segment.startTime,
      endTime: segment.endTime,
      text: segment.text,
      energyScore: calculateEnergyScore(segment),
      indicators: getIndicators(segment),
    })
  );

  // Identify peak moments
  const peakMoments = identifyPeakMoments(mergedSegments);

  return {
    overallEnergy,
    segments: enthusiasmSegments,
    peakMoments,
  };
}

/**
 * Extract topics that generate enthusiasm based on peak moments
 */
export function extractEnthusiasticTopics(
  analysis: EnthusiasmAnalysis
): string[] {
  const topics: string[] = [];

  // Extract key nouns/phrases from peak moments
  analysis.peakMoments.forEach((moment) => {
    // Simple extraction: split by common delimiters and get significant words
    const words = moment.text
      .toLowerCase()
      .split(/[\s,.\-!?]+/)
      .filter((w) => w.length > 4 && !EMPHASIS_WORDS.has(w));

    words.slice(0, 2).forEach((word) => {
      if (!topics.includes(word)) {
        topics.push(word);
      }
    });
  });

  return topics.slice(0, 5);
}
