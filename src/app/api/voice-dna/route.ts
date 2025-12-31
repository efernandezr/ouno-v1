/**
 * Voice DNA API Routes
 *
 * GET /api/voice-dna - Get current user's Voice DNA profile
 * PATCH /api/voice-dna - Update Voice DNA settings (referent selections, learned rules)
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getVoiceDNAProfile,
  getVoiceDNASummary,
  updateReferentInfluences,
  addLearnedRule,
} from "@/lib/analysis/voiceDNABuilder";
import { auth } from "@/lib/auth";
import type { ReferentInfluences, LearnedRule } from "@/types/voiceDNA";

/**
 * GET /api/voice-dna
 *
 * Returns the current user's Voice DNA profile with summary
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      profile,
      voiceSessionsAnalyzed,
      writingSamplesAnalyzed,
      calibrationRoundsCompleted,
      calibrationScore,
    } = await getVoiceDNAProfile(session.user.id);

    // If no profile exists, return empty state
    if (!profile) {
      return NextResponse.json({
        hasProfile: false,
        voiceDNA: null,
        summary: null,
        stats: {
          voiceSessionsAnalyzed: 0,
          writingSamplesAnalyzed: 0,
          calibrationRoundsCompleted: 0,
          calibrationScore: 0,
        },
      });
    }

    // Get human-readable summary
    const summary = getVoiceDNASummary(profile);

    return NextResponse.json({
      hasProfile: true,
      voiceDNA: profile,
      summary,
      stats: {
        voiceSessionsAnalyzed,
        writingSamplesAnalyzed,
        calibrationRoundsCompleted,
        calibrationScore,
      },
    });
  } catch (error) {
    console.error("Error fetching Voice DNA:", error);
    return NextResponse.json(
      { error: "Failed to fetch Voice DNA profile" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/voice-dna
 *
 * Update Voice DNA settings:
 * - referentInfluences: Update selected referents and weights
 * - learnedRule: Add a new learned rule
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { referentInfluences, learnedRule } = body as {
      referentInfluences?: ReferentInfluences;
      learnedRule?: LearnedRule;
    };

    // Update referent influences if provided
    if (referentInfluences) {
      // Validate referent influences
      if (typeof referentInfluences.userWeight !== "number") {
        return NextResponse.json(
          { error: "userWeight must be a number" },
          { status: 400 }
        );
      }

      if (referentInfluences.userWeight < 50) {
        return NextResponse.json(
          { error: "userWeight must be at least 50" },
          { status: 400 }
        );
      }

      if (!Array.isArray(referentInfluences.referents)) {
        return NextResponse.json(
          { error: "referents must be an array" },
          { status: 400 }
        );
      }

      // Ensure total weight equals 100
      const totalWeight =
        referentInfluences.userWeight +
        referentInfluences.referents.reduce((sum, r) => sum + r.weight, 0);

      if (Math.abs(totalWeight - 100) > 0.01) {
        return NextResponse.json(
          { error: "Total weight must equal 100" },
          { status: 400 }
        );
      }

      await updateReferentInfluences(session.user.id, referentInfluences);
    }

    // Add learned rule if provided
    if (learnedRule) {
      // Validate learned rule
      if (!["prefer", "avoid", "adjust"].includes(learnedRule.type)) {
        return NextResponse.json(
          { error: "Invalid rule type" },
          { status: 400 }
        );
      }

      if (
        typeof learnedRule.content !== "string" ||
        !learnedRule.content.trim()
      ) {
        return NextResponse.json(
          { error: "Rule content is required" },
          { status: 400 }
        );
      }

      if (
        typeof learnedRule.confidence !== "number" ||
        learnedRule.confidence < 0 ||
        learnedRule.confidence > 1
      ) {
        return NextResponse.json(
          { error: "Confidence must be between 0 and 1" },
          { status: 400 }
        );
      }

      await addLearnedRule(session.user.id, {
        ...learnedRule,
        sourceCount: learnedRule.sourceCount || 1,
      });
    }

    // Return updated profile
    const {
      profile,
      voiceSessionsAnalyzed,
      writingSamplesAnalyzed,
      calibrationRoundsCompleted,
      calibrationScore,
    } = await getVoiceDNAProfile(session.user.id);

    const summary = profile ? getVoiceDNASummary(profile) : null;

    return NextResponse.json({
      success: true,
      voiceDNA: profile,
      summary,
      stats: {
        voiceSessionsAnalyzed,
        writingSamplesAnalyzed,
        calibrationRoundsCompleted,
        calibrationScore,
      },
    });
  } catch (error) {
    console.error("Error updating Voice DNA:", error);
    return NextResponse.json(
      { error: "Failed to update Voice DNA profile" },
      { status: 500 }
    );
  }
}
