#!/usr/bin/env npx tsx
/**
 * Migration script to recalculate all calibration scores.
 *
 * This script:
 * 1. Fetches all voice DNA profiles
 * 2. Recalculates each score using the canonical calculateCalibrationScore function
 * 3. Logs before/after scores for auditing
 *
 * Usage: npx tsx scripts/recalculate-calibration-scores.ts
 *
 * This script is safe to run multiple times - it will always recalculate
 * based on current data and the latest scoring algorithm.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, avg } from "drizzle-orm";
import {
  voiceDNAProfiles,
  writingSamples,
  calibrationRounds,
} from "../src/lib/schema";
import type { VoiceDNA } from "../src/types/voiceDNA";

interface ScoreChange {
  userId: string;
  oldScore: number;
  newScore: number;
  change: number;
}

/**
 * Calculate calibration score - mirrors the production function
 */
function calculateCalibrationScore(
  voiceSessionsAnalyzed: number,
  writingSamplesAnalyzed: number,
  calibrationRoundsCompleted: number,
  voiceDNA: VoiceDNA,
  averageCalibrationRating: number = 3
): number {
  let score = 0;

  // Voice sessions contribution (up to 35 points)
  if (voiceSessionsAnalyzed >= 1) score += 12;
  if (voiceSessionsAnalyzed >= 2) score += 9;
  if (voiceSessionsAnalyzed >= 3) score += 7;
  if (voiceSessionsAnalyzed >= 5) score += 5;
  if (voiceSessionsAnalyzed >= 10) score += 2;

  // Writing samples contribution (up to 15 points)
  if (writingSamplesAnalyzed >= 1) score += 8;
  if (writingSamplesAnalyzed >= 2) score += 4;
  if (writingSamplesAnalyzed >= 3) score += 3;

  // Calibration rounds contribution (up to 25 points)
  const ratingBonus =
    averageCalibrationRating >= 4 ? 2 : averageCalibrationRating >= 3 ? 1 : 0;
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
    const ta = voiceDNA.tonalAttributes;
    const variance =
      Math.abs(ta.warmth - 0.5) +
      Math.abs(ta.authority - 0.5) +
      Math.abs(ta.humor - 0.5) +
      Math.abs(ta.directness - 0.5) +
      Math.abs(ta.empathy - 0.5);
    if (variance > 1) score += 2;
  }

  // Written patterns contribution (up to 8 points)
  if (voiceDNA.writtenPatterns) {
    const wp = voiceDNA.writtenPatterns;
    score += 5;
    if (wp.structurePreference !== "linear") score += 1;
    if (wp.openingStyle !== "context") score += 1;
    if (wp.closingStyle !== "summary") score += 1;
  }

  // Learned rules contribution (up to 5 points)
  if (voiceDNA.learnedRules && voiceDNA.learnedRules.length > 0) {
    const rules = voiceDNA.learnedRules;
    score += Math.min(rules.length, 3);
    const avgConfidence =
      rules.reduce((sum, r) => sum + r.confidence, 0) / rules.length;
    if (avgConfidence > 0.7) score += 2;
  }

  // Quality bonus (up to 2 points)
  if (voiceSessionsAnalyzed >= 2 && writingSamplesAnalyzed >= 1) {
    score += 2;
  }

  // Apply minimum thresholds
  const meetsHighThreshold =
    voiceSessionsAnalyzed >= 3 &&
    (writingSamplesAnalyzed >= 1 || calibrationRoundsCompleted >= 2);

  if (score >= 70 && !meetsHighThreshold) {
    score = 69;
  }

  return Math.min(score, 100);
}

async function recalculateAllScores() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error("❌ POSTGRES_URL environment variable is not set");
    process.exit(1);
  }

  console.log("🔄 Starting calibration score recalculation...\n");

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Fetch all profiles
    const profiles = await db.select().from(voiceDNAProfiles);

    console.log(`📊 Found ${profiles.length} voice DNA profile(s) to process\n`);

    if (profiles.length === 0) {
      console.log("✅ No profiles to update.");
      await client.end();
      return;
    }

    const changes: ScoreChange[] = [];
    let updated = 0;
    let unchanged = 0;

    for (const profile of profiles) {
      // Get average rating for this user
      const ratingResult = await db
        .select({ avgRating: avg(calibrationRounds.rating) })
        .from(calibrationRounds)
        .where(eq(calibrationRounds.userId, profile.userId));

      const avgRating = ratingResult[0]?.avgRating
        ? parseFloat(ratingResult[0].avgRating)
        : 3;

      // Get writing samples count
      const samplesResult = await db
        .select()
        .from(writingSamples)
        .where(eq(writingSamples.userId, profile.userId));

      const writingSamplesCount = samplesResult.filter(
        (s) => s.extractedPatterns !== null
      ).length;

      // Build VoiceDNA for scoring
      const voiceDNA: VoiceDNA = {
        spokenPatterns: profile.spokenPatterns,
        writtenPatterns: profile.writtenPatterns,
        tonalAttributes: profile.tonalAttributes,
        referentInfluences: profile.referentInfluences,
        learnedRules: profile.learnedRules || [],
        calibrationScore: 0,
      };

      // Calculate new score
      const newScore = calculateCalibrationScore(
        profile.voiceSessionsAnalyzed || 0,
        writingSamplesCount,
        profile.calibrationRoundsCompleted || 0,
        voiceDNA,
        avgRating
      );

      const oldScore = profile.calibrationScore || 0;
      const change = newScore - oldScore;

      if (change !== 0) {
        // Update the profile
        await db
          .update(voiceDNAProfiles)
          .set({
            calibrationScore: newScore,
            writingSamplesAnalyzed: writingSamplesCount,
            updatedAt: new Date(),
          })
          .where(eq(voiceDNAProfiles.userId, profile.userId));

        changes.push({
          userId: profile.userId,
          oldScore,
          newScore,
          change,
        });

        updated++;
      } else {
        unchanged++;
      }
    }

    // Summary
    console.log("=" .repeat(60));
    console.log("📊 RECALCULATION SUMMARY");
    console.log("=" .repeat(60));
    console.log(`Total profiles:    ${profiles.length}`);
    console.log(`Updated:           ${updated}`);
    console.log(`Unchanged:         ${unchanged}`);
    console.log("");

    if (changes.length > 0) {
      console.log("📝 SCORE CHANGES:");
      console.log("-".repeat(60));
      console.log(
        "User ID".padEnd(40) +
          "Old".padStart(6) +
          "New".padStart(6) +
          "Change".padStart(8)
      );
      console.log("-".repeat(60));

      for (const c of changes) {
        const changeStr =
          c.change > 0 ? `+${c.change}` : c.change.toString();
        console.log(
          c.userId.substring(0, 38).padEnd(40) +
            c.oldScore.toString().padStart(6) +
            c.newScore.toString().padStart(6) +
            changeStr.padStart(8)
        );
      }
      console.log("-".repeat(60));

      // Stats
      const increases = changes.filter((c) => c.change > 0);
      const decreases = changes.filter((c) => c.change < 0);
      const avgChange =
        changes.reduce((sum, c) => sum + c.change, 0) / changes.length;

      console.log(`\nScore increases: ${increases.length}`);
      console.log(`Score decreases: ${decreases.length}`);
      console.log(`Average change:  ${avgChange.toFixed(1)}`);
    }

    console.log("\n✅ Recalculation complete!");
  } catch (error) {
    console.error("❌ Error during recalculation:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

recalculateAllScores();
