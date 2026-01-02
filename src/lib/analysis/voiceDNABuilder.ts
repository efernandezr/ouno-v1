/**
 * Voice DNA Profile Builder
 *
 * Orchestrates enthusiasm detection and linguistic analysis to build
 * and update a user's Voice DNA profile over time.
 *
 * The profile improves with each voice session through weighted merging.
 */

import { eq, avg } from "drizzle-orm";
import { db } from "@/lib/db";
import { voiceDNAProfiles, writingSamples, calibrationRounds } from "@/lib/schema";
import type { EnthusiasmAnalysis } from "@/types/session";
import type { WordTimestamp } from "@/types/voice";
import type { VoiceDNA, SpokenPatterns, TonalAttributes, WrittenPatterns, ExtractedWritingPatterns } from "@/types/voiceDNA";
import {
  detectEnthusiasm,
  extractEnthusiasticTopics,
} from "./enthusiasmDetector";
import { analyzeLinguistics } from "./linguisticAnalyzer";
import { mergeWritingPatterns } from "./writingSampleAnalyzer";

interface BuildVoiceDNAInput {
  userId: string;
  transcript: string;
  wordTimestamps: WordTimestamp[];
  sessionId?: string;
}

interface BuildVoiceDNAResult {
  voiceDNA: VoiceDNA;
  enthusiasmAnalysis: EnthusiasmAnalysis;
  isNewProfile: boolean;
  calibrationScoreChange: number;
}

/**
 * Calculate calibration score based on amount of data collected
 *
 * Point allocation (totals 100):
 * - Voice sessions: up to 35 points
 * - Writing samples: up to 15 points
 * - Calibration rounds: up to 25 points (weighted by rating)
 * - Pattern richness (spoken): up to 10 points
 * - Written patterns: up to 8 points
 * - Learned rules: up to 5 points
 * - Quality bonus: up to 2 points
 *
 * Minimum thresholds prevent gaming:
 * - Score capped at 69 unless voiceSessions >= 3 AND (writingSamples >= 1 OR calibrationRounds >= 2)
 */
function calculateCalibrationScore(
  voiceSessionsAnalyzed: number,
  writingSamplesAnalyzed: number,
  calibrationRoundsCompleted: number,
  voiceDNA: VoiceDNA,
  averageCalibrationRating: number = 3 // Default to middle rating
): number {
  let score = 0;

  // Voice sessions contribution (up to 35 points, reduced from 40)
  // First session = 12 points, subsequent sessions add diminishing returns
  if (voiceSessionsAnalyzed >= 1) score += 12;
  if (voiceSessionsAnalyzed >= 2) score += 9;
  if (voiceSessionsAnalyzed >= 3) score += 7;
  if (voiceSessionsAnalyzed >= 5) score += 5;
  if (voiceSessionsAnalyzed >= 10) score += 2;

  // Writing samples contribution (up to 15 points, reduced from 20)
  if (writingSamplesAnalyzed >= 1) score += 8;
  if (writingSamplesAnalyzed >= 2) score += 4;
  if (writingSamplesAnalyzed >= 3) score += 3;

  // Calibration rounds contribution (up to 25 points, reduced from 30)
  // Weighted by average rating: base 6 pts + up to 2 pts bonus for high ratings
  const ratingBonus = averageCalibrationRating >= 4 ? 2 : averageCalibrationRating >= 3 ? 1 : 0;
  const pointsPerRound = 6 + ratingBonus;
  score += Math.min(calibrationRoundsCompleted * pointsPerRound, 25);

  // Pattern richness contribution - spoken (up to 10 points)
  if (voiceDNA.spokenPatterns) {
    const sp = voiceDNA.spokenPatterns;
    if (sp.vocabulary.frequentWords.length >= 5) score += 2;
    if (sp.vocabulary.uniquePhrases.length >= 3) score += 2;
    if (sp.enthusiasm.topicsThatExcite.length >= 3) score += 2;
    if (sp.rhetoric.usesQuestions || sp.rhetoric.usesAnalogies) score += 2;
  }
  if (voiceDNA.tonalAttributes) {
    // Has distinct tonal profile (not all 0.5s)
    const ta = voiceDNA.tonalAttributes;
    const variance =
      Math.abs(ta.warmth - 0.5) +
      Math.abs(ta.authority - 0.5) +
      Math.abs(ta.humor - 0.5) +
      Math.abs(ta.directness - 0.5) +
      Math.abs(ta.empathy - 0.5);
    if (variance > 1) score += 2;
  }

  // Written patterns contribution (up to 8 points) - NEW
  if (voiceDNA.writtenPatterns) {
    const wp = voiceDNA.writtenPatterns;
    // Base points for having written patterns
    score += 5;
    // Additional points for distinct preferences
    if (wp.structurePreference !== "linear") score += 1;
    if (wp.openingStyle !== "context") score += 1;
    if (wp.closingStyle !== "summary") score += 1;
  }

  // Learned rules contribution (up to 5 points) - NEW
  if (voiceDNA.learnedRules && voiceDNA.learnedRules.length > 0) {
    const rules = voiceDNA.learnedRules;
    // 1 point per rule, max 3
    score += Math.min(rules.length, 3);
    // +2 bonus if average confidence > 0.7
    const avgConfidence = rules.reduce((sum, r) => sum + r.confidence, 0) / rules.length;
    if (avgConfidence > 0.7) score += 2;
  }

  // Quality bonus (up to 2 points) - NEW
  // Awarded for having both voice AND writing data
  if (voiceSessionsAnalyzed >= 2 && writingSamplesAnalyzed >= 1) {
    score += 2;
  }

  // Apply minimum thresholds to prevent gaming
  const meetsHighThreshold =
    voiceSessionsAnalyzed >= 3 &&
    (writingSamplesAnalyzed >= 1 || calibrationRoundsCompleted >= 2);

  // Cap at 69 ("medium") if minimum data requirements not met
  if (score >= 70 && !meetsHighThreshold) {
    score = 69;
  }

  return Math.min(score, 100);
}

/**
 * Merge spoken patterns with weighted averaging
 */
function mergeSpokenPatterns(
  existing: SpokenPatterns | null,
  next: SpokenPatterns,
  weight: number = 0.3
): SpokenPatterns {
  if (!existing) return next;

  const mergeArrays = (arr1: string[], arr2: string[], max: number = 10) => {
    const merged = [...new Set([...arr2, ...arr1])];
    return merged.slice(0, max);
  };

  const weightedAvg = (a: number, b: number) => a * (1 - weight) + b * weight;

  return {
    vocabulary: {
      frequentWords: mergeArrays(
        existing.vocabulary.frequentWords,
        next.vocabulary.frequentWords
      ),
      uniquePhrases: mergeArrays(
        existing.vocabulary.uniquePhrases,
        next.vocabulary.uniquePhrases,
        5
      ),
      fillerWords: mergeArrays(
        existing.vocabulary.fillerWords,
        next.vocabulary.fillerWords,
        5
      ),
      preserveFillers:
        next.vocabulary.preserveFillers || existing.vocabulary.preserveFillers,
    },
    rhythm: {
      avgSentenceLength: next.rhythm.avgSentenceLength,
      paceVariation: next.rhythm.paceVariation,
      pausePatterns: next.rhythm.pausePatterns,
    },
    rhetoric: {
      usesQuestions:
        next.rhetoric.usesQuestions || existing.rhetoric.usesQuestions,
      usesAnalogies:
        next.rhetoric.usesAnalogies || existing.rhetoric.usesAnalogies,
      storytellingStyle: next.rhetoric.storytellingStyle,
    },
    enthusiasm: {
      topicsThatExcite: mergeArrays(
        existing.enthusiasm.topicsThatExcite,
        next.enthusiasm.topicsThatExcite,
        8
      ),
      emphasisPatterns: mergeArrays(
        existing.enthusiasm.emphasisPatterns,
        next.enthusiasm.emphasisPatterns,
        5
      ),
      energyBaseline: weightedAvg(
        existing.enthusiasm.energyBaseline,
        next.enthusiasm.energyBaseline
      ),
    },
  };
}

/**
 * Merge tonal attributes with weighted averaging
 */
function mergeTonalAttributes(
  existing: TonalAttributes | null,
  next: TonalAttributes,
  weight: number = 0.3
): TonalAttributes {
  if (!existing) return next;

  const weightedAvg = (a: number, b: number) => a * (1 - weight) + b * weight;

  return {
    warmth: weightedAvg(existing.warmth, next.warmth),
    authority: weightedAvg(existing.authority, next.authority),
    humor: weightedAvg(existing.humor, next.humor),
    directness: weightedAvg(existing.directness, next.directness),
    empathy: weightedAvg(existing.empathy, next.empathy),
  };
}

/**
 * Get existing Voice DNA profile for a user
 */
export async function getVoiceDNAProfile(userId: string): Promise<{
  profile: VoiceDNA | null;
  voiceSessionsAnalyzed: number;
  writingSamplesAnalyzed: number;
  calibrationRoundsCompleted: number;
  calibrationScore: number;
}> {
  const [existing] = await db
    .select()
    .from(voiceDNAProfiles)
    .where(eq(voiceDNAProfiles.userId, userId))
    .limit(1);

  if (!existing) {
    return {
      profile: null,
      voiceSessionsAnalyzed: 0,
      writingSamplesAnalyzed: 0,
      calibrationRoundsCompleted: 0,
      calibrationScore: 0,
    };
  }

  return {
    profile: {
      spokenPatterns: existing.spokenPatterns,
      writtenPatterns: existing.writtenPatterns,
      tonalAttributes: existing.tonalAttributes,
      referentInfluences: existing.referentInfluences,
      learnedRules: existing.learnedRules || [],
      calibrationScore: existing.calibrationScore || 0,
    },
    voiceSessionsAnalyzed: existing.voiceSessionsAnalyzed || 0,
    writingSamplesAnalyzed: existing.writingSamplesAnalyzed || 0,
    calibrationRoundsCompleted: existing.calibrationRoundsCompleted || 0,
    calibrationScore: existing.calibrationScore || 0,
  };
}

/**
 * Build or update Voice DNA profile from a transcript
 *
 * This is the main entry point for Voice DNA analysis.
 * It runs both enthusiasm detection and linguistic analysis,
 * then merges the results with any existing profile.
 */
export async function buildVoiceDNA(
  input: BuildVoiceDNAInput
): Promise<BuildVoiceDNAResult> {
  const { userId, transcript, wordTimestamps } = input;

  // Step 1: Run enthusiasm detection (fast, local)
  const enthusiasmAnalysis = detectEnthusiasm(wordTimestamps);
  const enthusiasticTopics = extractEnthusiasticTopics(enthusiasmAnalysis);

  // Step 2: Run linguistic analysis (uses LLM)
  const linguisticResult = await analyzeLinguistics(transcript);

  // Enhance linguistic result with enthusiasm data
  linguisticResult.spokenPatterns.enthusiasm.topicsThatExcite = [
    ...new Set([
      ...linguisticResult.spokenPatterns.enthusiasm.topicsThatExcite,
      ...enthusiasticTopics,
    ]),
  ].slice(0, 8);

  linguisticResult.spokenPatterns.enthusiasm.energyBaseline =
    (linguisticResult.spokenPatterns.enthusiasm.energyBaseline +
      enthusiasmAnalysis.overallEnergy) /
    2;

  // Step 3: Get existing profile
  const existingData = await getVoiceDNAProfile(userId);
  const isNewProfile = !existingData.profile;

  // Step 4: Merge with existing profile
  const mergedSpokenPatterns = mergeSpokenPatterns(
    existingData.profile?.spokenPatterns || null,
    linguisticResult.spokenPatterns,
    isNewProfile ? 1.0 : 0.3 // First session gets full weight
  );

  const mergedTonalAttributes = mergeTonalAttributes(
    existingData.profile?.tonalAttributes || null,
    linguisticResult.tonalAttributes,
    isNewProfile ? 1.0 : 0.3
  );

  // Step 5: Get average calibration rating
  const avgRating = await getAverageCalibrationRating(userId);

  // Step 6: Calculate new calibration score
  const newVoiceSessionsAnalyzed = existingData.voiceSessionsAnalyzed + 1;
  const newVoiceDNA: VoiceDNA = {
    spokenPatterns: mergedSpokenPatterns,
    writtenPatterns: existingData.profile?.writtenPatterns || null,
    tonalAttributes: mergedTonalAttributes,
    referentInfluences: existingData.profile?.referentInfluences || null,
    learnedRules: existingData.profile?.learnedRules || [],
    calibrationScore: 0, // Will be calculated below
  };

  const newCalibrationScore = calculateCalibrationScore(
    newVoiceSessionsAnalyzed,
    existingData.writingSamplesAnalyzed,
    existingData.calibrationRoundsCompleted,
    newVoiceDNA,
    avgRating
  );

  newVoiceDNA.calibrationScore = newCalibrationScore;

  // Step 7: Persist to database
  if (isNewProfile) {
    await db.insert(voiceDNAProfiles).values({
      userId,
      spokenPatterns: mergedSpokenPatterns,
      writtenPatterns: null,
      tonalAttributes: mergedTonalAttributes,
      referentInfluences: null,
      learnedRules: [],
      calibrationScore: newCalibrationScore,
      calibrationRoundsCompleted: 0,
      voiceSessionsAnalyzed: 1,
      writingSamplesAnalyzed: 0,
    });
  } else {
    await db
      .update(voiceDNAProfiles)
      .set({
        spokenPatterns: mergedSpokenPatterns,
        tonalAttributes: mergedTonalAttributes,
        calibrationScore: newCalibrationScore,
        voiceSessionsAnalyzed: newVoiceSessionsAnalyzed,
        updatedAt: new Date(),
      })
      .where(eq(voiceDNAProfiles.userId, userId));
  }

  return {
    voiceDNA: newVoiceDNA,
    enthusiasmAnalysis,
    isNewProfile,
    calibrationScoreChange: newCalibrationScore - existingData.calibrationScore,
  };
}

/**
 * Update Voice DNA referent influences
 */
export async function updateReferentInfluences(
  userId: string,
  referentInfluences: VoiceDNA["referentInfluences"]
): Promise<void> {
  const existingData = await getVoiceDNAProfile(userId);

  if (!existingData.profile) {
    // Create a new profile with just referent influences
    await db.insert(voiceDNAProfiles).values({
      userId,
      spokenPatterns: null,
      writtenPatterns: null,
      tonalAttributes: null,
      referentInfluences,
      learnedRules: [],
      calibrationScore: 0,
      calibrationRoundsCompleted: 0,
      voiceSessionsAnalyzed: 0,
      writingSamplesAnalyzed: 0,
    });
  } else {
    await db
      .update(voiceDNAProfiles)
      .set({
        referentInfluences,
        updatedAt: new Date(),
      })
      .where(eq(voiceDNAProfiles.userId, userId));
  }
}

/**
 * Add a learned rule to the Voice DNA profile
 */
export async function addLearnedRule(
  userId: string,
  rule: VoiceDNA["learnedRules"][0]
): Promise<void> {
  const existingData = await getVoiceDNAProfile(userId);
  const existingRules = existingData.profile?.learnedRules || [];

  // Check if similar rule already exists
  const existingIndex = existingRules.findIndex(
    (r) => r.type === rule.type && r.content === rule.content
  );

  let updatedRules: VoiceDNA["learnedRules"];

  if (existingIndex >= 0) {
    // Update existing rule's confidence and source count
    updatedRules = [...existingRules];
    const existingRule = updatedRules[existingIndex];
    if (existingRule) {
      updatedRules[existingIndex] = {
        ...existingRule,
        confidence: Math.min(1, existingRule.confidence + rule.confidence * 0.2),
        sourceCount: existingRule.sourceCount + 1,
      };
    }
  } else {
    // Add new rule (max 20 rules)
    updatedRules = [...existingRules, rule].slice(-20);
  }

  if (!existingData.profile) {
    await db.insert(voiceDNAProfiles).values({
      userId,
      spokenPatterns: null,
      writtenPatterns: null,
      tonalAttributes: null,
      referentInfluences: null,
      learnedRules: updatedRules,
      calibrationScore: 0,
      calibrationRoundsCompleted: 0,
      voiceSessionsAnalyzed: 0,
      writingSamplesAnalyzed: 0,
    });
  } else {
    await db
      .update(voiceDNAProfiles)
      .set({
        learnedRules: updatedRules,
        updatedAt: new Date(),
      })
      .where(eq(voiceDNAProfiles.userId, userId));
  }
}

/**
 * Merge follow-up responses into Voice DNA profile
 *
 * Used during onboarding to incorporate additional voice samples
 * from follow-up question responses.
 */
export async function mergeFollowUpResponses(params: {
  userId: string;
  responses: string[];
  introTranscript: string | null;
}): Promise<void> {
  const { userId, responses } = params;

  if (responses.length === 0) return;

  // Combine all responses into a single transcript for analysis
  const combinedTranscript = responses.join("\n\n");

  // Get additional linguistic insights from responses
  const linguisticResult = await analyzeLinguistics(combinedTranscript);

  // Get existing profile
  const existingData = await getVoiceDNAProfile(userId);

  if (!existingData.profile) return;

  // Merge with lower weight since this is supplementary data
  const mergedSpokenPatterns = mergeSpokenPatterns(
    existingData.profile.spokenPatterns,
    linguisticResult.spokenPatterns,
    0.2 // Lower weight for follow-up responses
  );

  const mergedTonalAttributes = mergeTonalAttributes(
    existingData.profile.tonalAttributes,
    linguisticResult.tonalAttributes,
    0.2
  );

  // Update profile
  await db
    .update(voiceDNAProfiles)
    .set({
      spokenPatterns: mergedSpokenPatterns,
      tonalAttributes: mergedTonalAttributes,
      updatedAt: new Date(),
    })
    .where(eq(voiceDNAProfiles.userId, userId));
}

/**
 * Get a summary of Voice DNA for display purposes
 */
export function getVoiceDNASummary(voiceDNA: VoiceDNA): {
  strengths: string[];
  characteristics: string[];
  calibrationLevel: "low" | "medium" | "high";
} {
  const strengths: string[] = [];
  const characteristics: string[] = [];

  if (voiceDNA.spokenPatterns) {
    const sp = voiceDNA.spokenPatterns;

    // Add rhetoric strengths
    if (sp.rhetoric.usesQuestions) {
      strengths.push("Engages with questions");
    }
    if (sp.rhetoric.usesAnalogies) {
      strengths.push("Uses analogies effectively");
    }

    // Add storytelling characteristic
    if (sp.rhetoric.storytellingStyle === "anecdotal") {
      characteristics.push("Anecdotal storyteller");
    } else if (sp.rhetoric.storytellingStyle === "personal") {
      characteristics.push("Personal narratives");
    }

    // Add rhythm characteristic
    if (sp.rhythm.paceVariation === "dynamic") {
      characteristics.push("Dynamic pacing");
    }

    // Add topics
    if (sp.enthusiasm.topicsThatExcite.length > 0) {
      characteristics.push(
        `Passionate about: ${sp.enthusiasm.topicsThatExcite.slice(0, 2).join(", ")}`
      );
    }
  }

  if (voiceDNA.tonalAttributes) {
    const ta = voiceDNA.tonalAttributes;

    if (ta.warmth > 0.7) strengths.push("Warm & approachable");
    if (ta.authority > 0.7) strengths.push("Confident & authoritative");
    if (ta.humor > 0.6) strengths.push("Good sense of humor");
    if (ta.directness > 0.7) strengths.push("Clear & direct");
    if (ta.empathy > 0.7) strengths.push("Empathetic");
  }

  let calibrationLevel: "low" | "medium" | "high" = "low";
  if (voiceDNA.calibrationScore >= 70) {
    calibrationLevel = "high";
  } else if (voiceDNA.calibrationScore >= 30) {
    calibrationLevel = "medium";
  }

  return {
    strengths: strengths.slice(0, 5),
    characteristics: characteristics.slice(0, 5),
    calibrationLevel,
  };
}

/**
 * Convert ExtractedWritingPatterns to WrittenPatterns
 * Maps the raw extraction format to the profile format
 */
function convertToWrittenPatterns(
  extracted: ExtractedWritingPatterns
): WrittenPatterns {
  // Determine structure preference based on key phrases
  let structurePreference: WrittenPatterns["structurePreference"] = "linear";
  if (extracted.keyPhrases.some(p => p.includes("story") || p.includes("narrative"))) {
    structurePreference = "narrative";
  } else if (extracted.keyPhrases.some(p => p.includes("numbered") || p.includes("structure"))) {
    structurePreference = "modular";
  }

  // Determine formality from tone indicators and vocabulary complexity
  let formality = 0.5;
  if (extracted.toneIndicators.includes("formal")) formality += 0.2;
  if (extracted.toneIndicators.includes("authoritative")) formality += 0.1;
  if (extracted.toneIndicators.includes("conversational")) formality -= 0.2;
  if (extracted.toneIndicators.includes("humorous")) formality -= 0.1;
  formality = Math.max(0, Math.min(1, formality + (extracted.vocabularyComplexity - 0.5) * 0.3));

  // Determine opening style from key phrases
  let openingStyle: WrittenPatterns["openingStyle"] = "context";
  if (extracted.keyPhrases.some(p => p.includes("question opening"))) {
    openingStyle = "question";
  } else if (extracted.keyPhrases.some(p => p.includes("story opening"))) {
    openingStyle = "story";
  } else if (extracted.keyPhrases.some(p => p.includes("direct opening"))) {
    openingStyle = "hook";
  }

  // Determine closing style from key phrases
  let closingStyle: WrittenPatterns["closingStyle"] = "summary";
  if (extracted.keyPhrases.some(p => p.includes("question closing"))) {
    closingStyle = "question";
  } else if (extracted.keyPhrases.some(p => p.includes("action closing"))) {
    closingStyle = "cta";
  } else if (extracted.toneIndicators.includes("empathetic")) {
    closingStyle = "reflection";
  }

  return {
    structurePreference,
    formality,
    paragraphLength: extracted.paragraphStructure,
    openingStyle,
    closingStyle,
  };
}

/**
 * Rebuild Voice DNA profile from all available data
 *
 * This function:
 * 1. Fetches all writing samples for the user
 * 2. Merges their extractedPatterns into unified writtenPatterns
 * 3. Recalculates the calibration score
 * 4. Updates the Voice DNA profile
 *
 * Call this after adding/removing writing samples to keep the profile in sync.
 */
export async function rebuildVoiceDNA(userId: string): Promise<{
  profile: VoiceDNA | null;
  voiceSessionsAnalyzed: number;
  writingSamplesAnalyzed: number;
  calibrationRoundsCompleted: number;
  calibrationScore: number;
}> {
  // Step 1: Get existing profile
  const existingData = await getVoiceDNAProfile(userId);

  // Step 2: Fetch all analyzed writing samples
  const samples = await db
    .select({
      extractedPatterns: writingSamples.extractedPatterns,
    })
    .from(writingSamples)
    .where(eq(writingSamples.userId, userId));

  const analyzedSamples = samples.filter(
    (s) => s.extractedPatterns !== null
  ) as { extractedPatterns: ExtractedWritingPatterns }[];

  const writingSamplesCount = analyzedSamples.length;

  // Step 3: Merge writing patterns if we have samples
  let writtenPatterns: WrittenPatterns | null = null;
  if (analyzedSamples.length > 0) {
    const mergedExtracted = mergeWritingPatterns(
      analyzedSamples.map((s) => s.extractedPatterns)
    );
    writtenPatterns = convertToWrittenPatterns(mergedExtracted);
  }

  // Step 4: Get average calibration rating
  const avgRating = await getAverageCalibrationRating(userId);

  // Step 5: Calculate new calibration score
  const newVoiceDNA: VoiceDNA = {
    spokenPatterns: existingData.profile?.spokenPatterns || null,
    writtenPatterns,
    tonalAttributes: existingData.profile?.tonalAttributes || null,
    referentInfluences: existingData.profile?.referentInfluences || null,
    learnedRules: existingData.profile?.learnedRules || [],
    calibrationScore: 0,
  };

  const newCalibrationScore = calculateCalibrationScore(
    existingData.voiceSessionsAnalyzed,
    writingSamplesCount,
    existingData.calibrationRoundsCompleted,
    newVoiceDNA,
    avgRating
  );

  newVoiceDNA.calibrationScore = newCalibrationScore;

  // Step 6: Update the database
  if (!existingData.profile) {
    // Create new profile if none exists
    await db.insert(voiceDNAProfiles).values({
      userId,
      spokenPatterns: null,
      writtenPatterns,
      tonalAttributes: null,
      referentInfluences: null,
      learnedRules: [],
      calibrationScore: newCalibrationScore,
      calibrationRoundsCompleted: 0,
      voiceSessionsAnalyzed: 0,
      writingSamplesAnalyzed: writingSamplesCount,
    });
  } else {
    // Update existing profile
    await db
      .update(voiceDNAProfiles)
      .set({
        writtenPatterns,
        calibrationScore: newCalibrationScore,
        writingSamplesAnalyzed: writingSamplesCount,
        updatedAt: new Date(),
      })
      .where(eq(voiceDNAProfiles.userId, userId));
  }

  return {
    profile: newVoiceDNA,
    voiceSessionsAnalyzed: existingData.voiceSessionsAnalyzed,
    writingSamplesAnalyzed: writingSamplesCount,
    calibrationRoundsCompleted: existingData.calibrationRoundsCompleted,
    calibrationScore: newCalibrationScore,
  };
}

/**
 * Get the average calibration rating for a user
 *
 * Fetches all calibration rounds with ratings and returns the average.
 * Returns 3 (middle value) if no ratings exist.
 */
async function getAverageCalibrationRating(userId: string): Promise<number> {
  const result = await db
    .select({ avgRating: avg(calibrationRounds.rating) })
    .from(calibrationRounds)
    .where(eq(calibrationRounds.userId, userId));

  const avgRating = result[0]?.avgRating;
  // avg() returns string | null, convert to number with fallback
  return avgRating ? parseFloat(avgRating) : 3;
}

/**
 * Recalculate calibration score for a user
 *
 * This is the canonical function for updating calibration scores.
 * It fetches all relevant data (profile, writing samples, calibration ratings)
 * and calculates a comprehensive score using all data sources.
 *
 * Call this after:
 * - Completing a calibration round
 * - Adding/removing writing samples
 * - Any operation that should update the calibration score
 */
export async function recalculateCalibrationScore(userId: string): Promise<number> {
  // Step 1: Get existing profile data
  const existingData = await getVoiceDNAProfile(userId);

  // Step 2: Fetch average calibration rating
  const avgRating = await getAverageCalibrationRating(userId);

  // Step 3: Build current VoiceDNA for scoring
  const currentVoiceDNA: VoiceDNA = {
    spokenPatterns: existingData.profile?.spokenPatterns || null,
    writtenPatterns: existingData.profile?.writtenPatterns || null,
    tonalAttributes: existingData.profile?.tonalAttributes || null,
    referentInfluences: existingData.profile?.referentInfluences || null,
    learnedRules: existingData.profile?.learnedRules || [],
    calibrationScore: 0,
  };

  // Step 4: Calculate new score with all data sources
  const newScore = calculateCalibrationScore(
    existingData.voiceSessionsAnalyzed,
    existingData.writingSamplesAnalyzed,
    existingData.calibrationRoundsCompleted,
    currentVoiceDNA,
    avgRating
  );

  // Step 5: Update the database
  await db
    .update(voiceDNAProfiles)
    .set({
      calibrationScore: newScore,
      updatedAt: new Date(),
    })
    .where(eq(voiceDNAProfiles.userId, userId));

  return newScore;
}
