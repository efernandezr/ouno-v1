/**
 * Voice Analysis API Route
 *
 * POST /api/voice/analyze
 *
 * Analyzes a transcript and updates the user's Voice DNA profile.
 * This is typically called after transcription completes.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  buildVoiceDNA,
  getVoiceDNASummary,
} from "@/lib/analysis/voiceDNABuilder";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { voiceSessions } from "@/lib/schema";
import type { WordTimestamp } from "@/types/voice";

interface AnalyzeRequest {
  sessionId: string;
  transcript?: string;
  wordTimestamps?: WordTimestamp[];
}

/**
 * POST /api/voice/analyze
 *
 * Request body:
 * - sessionId: UUID of the voice session to analyze
 * - transcript: (optional) Transcript text if not fetching from session
 * - wordTimestamps: (optional) Word timestamps if not fetching from session
 *
 * Response:
 * - voiceDNA: Updated Voice DNA profile
 * - summary: Human-readable summary
 * - enthusiasmAnalysis: Detected enthusiasm patterns
 * - calibrationScoreChange: How much calibration improved
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as AnalyzeRequest;
    const { sessionId, transcript: directTranscript, wordTimestamps: directTimestamps } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Fetch session data
    const [voiceSession] = await db
      .select()
      .from(voiceSessions)
      .where(eq(voiceSessions.id, sessionId))
      .limit(1);

    if (!voiceSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (voiceSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get transcript and timestamps from session or direct input
    const transcript = directTranscript || voiceSession.transcript;
    const wordTimestamps = directTimestamps || voiceSession.wordTimestamps;

    if (!transcript) {
      return NextResponse.json(
        { error: "No transcript available for analysis" },
        { status: 400 }
      );
    }

    // Update session status to analyzing
    await db
      .update(voiceSessions)
      .set({ status: "analyzing", updatedAt: new Date() })
      .where(eq(voiceSessions.id, sessionId));

    try {
      // Build/update Voice DNA
      const result = await buildVoiceDNA({
        userId: session.user.id,
        transcript,
        wordTimestamps: wordTimestamps || [],
        sessionId,
      });

      // Update session with enthusiasm analysis
      await db
        .update(voiceSessions)
        .set({
          enthusiasmAnalysis: result.enthusiasmAnalysis,
          status: "follow_ups", // Ready for follow-up questions
          updatedAt: new Date(),
        })
        .where(eq(voiceSessions.id, sessionId));

      const summary = getVoiceDNASummary(result.voiceDNA);

      return NextResponse.json({
        success: true,
        voiceDNA: result.voiceDNA,
        summary,
        enthusiasmAnalysis: result.enthusiasmAnalysis,
        isNewProfile: result.isNewProfile,
        calibrationScoreChange: result.calibrationScoreChange,
        sessionStatus: "follow_ups",
      });
    } catch (analysisError) {
      // Update session to error state
      await db
        .update(voiceSessions)
        .set({
          status: "error",
          errorMessage:
            analysisError instanceof Error
              ? analysisError.message
              : "Analysis failed",
          updatedAt: new Date(),
        })
        .where(eq(voiceSessions.id, sessionId));

      throw analysisError;
    }
  } catch (error) {
    console.error("Error analyzing voice:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze voice session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
