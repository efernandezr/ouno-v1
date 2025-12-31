/**
 * Voice DNA Profile Builder
 *
 * Orchestrates enthusiasm detection and linguistic analysis to build
 * and update a user's Voice DNA profile over time.
 *
 * The profile improves with each voice session through weighted merging.
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { voiceDNAProfiles } from "@/lib/schema";
import type { EnthusiasmAnalysis } from "@/types/session";
import type { WordTimestamp } from "@/types/voice";
import type { VoiceDNA, SpokenPatterns, TonalAttributes } from "@/types/voiceDNA";
import {
  detectEnthusiasm,
  extractEnthusiasticTopics,
} from "./enthusiasmDetector";
import { analyzeLinguistics } from "./linguisticAnalyzer";

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
 * Score increases with:
 * - Number of voice sessions analyzed
 * - Number of writing samples
 * - Calibration rounds completed
 * - Diversity of detected patterns
 */
function calculateCalibrationScore(
  voiceSessionsAnalyzed: number,
  writingSamplesAnalyzed: number,
  calibrationRoundsCompleted: number,
  voiceDNA: VoiceDNA
): number {
  let score = 0;

  // Voice sessions contribution (up to 40 points)
  // First session = 15 points, subsequent sessions add diminishing returns
  if (voiceSessionsAnalyzed >= 1) score += 15;
  if (voiceSessionsAnalyzed >= 2) score += 10;
  if (voiceSessionsAnalyzed >= 3) score += 8;
  if (voiceSessionsAnalyzed >= 5) score += 5;
  if (voiceSessionsAnalyzed >= 10) score += 2;

  // Writing samples contribution (up to 20 points)
  if (writingSamplesAnalyzed >= 1) score += 10;
  if (writingSamplesAnalyzed >= 2) score += 5;
  if (writingSamplesAnalyzed >= 3) score += 5;

  // Calibration rounds contribution (up to 30 points)
  score += Math.min(calibrationRoundsCompleted * 10, 30);

  // Pattern richness contribution (up to 10 points)
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

  // Step 5: Calculate new calibration score
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
    newVoiceDNA
  );

  newVoiceDNA.calibrationScore = newCalibrationScore;

  // Step 6: Persist to database
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
