/**
 * Voice DNA Rebuild API
 *
 * POST /api/voice-dna/rebuild - Rebuild and recalculate Voice DNA profile
 *
 * This endpoint triggers a full rebuild of the user's Voice DNA profile,
 * merging all writing samples and recalculating the calibration score.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  rebuildVoiceDNA,
  getVoiceDNASummary,
} from "@/lib/analysis/voiceDNABuilder";
import { auth } from "@/lib/auth";

/**
 * POST /api/voice-dna/rebuild
 *
 * Rebuilds the Voice DNA profile from all available data:
 * - Merges all writing samples into writtenPatterns
 * - Recalculates calibration score
 * - Updates the profile in the database
 */
export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rebuild the profile
    const {
      profile,
      voiceSessionsAnalyzed,
      writingSamplesAnalyzed,
      calibrationRoundsCompleted,
      calibrationScore,
    } = await rebuildVoiceDNA(session.user.id);

    // Get human-readable summary
    const summary = profile ? getVoiceDNASummary(profile) : null;

    return NextResponse.json({
      success: true,
      hasProfile: !!profile,
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
    console.error("Error rebuilding Voice DNA:", error);
    return NextResponse.json(
      { error: "Failed to rebuild Voice DNA profile" },
      { status: 500 }
    );
  }
}
