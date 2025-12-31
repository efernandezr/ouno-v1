/**
 * Onboarding Intro API
 *
 * POST - Process the voice introduction:
 * 1. Create a voice session for tracking
 * 2. Analyze transcript to build initial Voice DNA
 * 3. Generate follow-up questions
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { generateFollowUpQuestions } from "@/lib/analysis/questionGenerator";
import { buildVoiceDNA } from "@/lib/analysis/voiceDNABuilder";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateUserOnboardingStatus } from "@/lib/db/users";
import { voiceSessions } from "@/lib/schema";
import type { WordTimestamp } from "@/types/voice";

interface IntroRequest {
  transcript: string;
  wordTimestamps: WordTimestamp[];
  durationSeconds: number;
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as IntroRequest;
    const { transcript, wordTimestamps, durationSeconds } = body;

    if (!transcript || transcript.length < 50) {
      return NextResponse.json(
        { error: "Transcript is too short. Please record at least 30 seconds." },
        { status: 400 }
      );
    }

    // Create a voice session for the onboarding intro
    const [voiceSession] = await db
      .insert(voiceSessions)
      .values({
        userId: session.user.id,
        mode: "guided",
        status: "analyzing",
        transcript,
        wordTimestamps,
        durationSeconds,
        title: "Onboarding Introduction",
      })
      .returning();

    if (!voiceSession) {
      throw new Error("Failed to create voice session");
    }

    try {
      // Build initial Voice DNA from the intro
      const analysisResult = await buildVoiceDNA({
        userId: session.user.id,
        transcript,
        wordTimestamps: wordTimestamps || [],
        sessionId: voiceSession.id,
      });

      // Generate follow-up questions based on the transcript and enthusiasm analysis
      const followUpQuestions = await generateFollowUpQuestions({
        transcript,
        enthusiasmAnalysis: analysisResult.enthusiasmAnalysis,
        context: "onboarding",
      });

      // Update session with analysis results
      await db
        .update(voiceSessions)
        .set({
          status: "follow_ups",
          enthusiasmAnalysis: analysisResult.enthusiasmAnalysis,
          followUpQuestions: followUpQuestions.map((q, i) => ({
            id: `q-${i}`,
            question: q,
            questionType: "expand" as const,
            context: "Generated during onboarding introduction",
          })),
          updatedAt: new Date(),
        })
        .where(eq(voiceSessions.id, voiceSession.id));

      // Update user onboarding status
      await updateUserOnboardingStatus(session.user.id, "voice_intro");

      return NextResponse.json({
        success: true,
        sessionId: voiceSession.id,
        followUpQuestions,
        voiceDNA: analysisResult.voiceDNA,
        isNewProfile: analysisResult.isNewProfile,
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
        .where(eq(voiceSessions.id, voiceSession.id));

      throw analysisError;
    }
  } catch (error) {
    console.error("Onboarding intro error:", error);
    return NextResponse.json(
      {
        error: "Failed to process introduction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
