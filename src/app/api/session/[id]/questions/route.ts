/**
 * Follow-up Questions API Route
 *
 * POST /api/session/[id]/questions
 *
 * Generates follow-up questions based on the session's transcript
 * and enthusiasm analysis.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { generateFollowUpQuestions } from "@/lib/ai/prompts/followUp";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { voiceSessions } from "@/lib/schema";
import { isValidUUID } from "@/lib/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/session/[id]/questions
 *
 * Generates follow-up questions for a session.
 *
 * Request body: None required (uses session data)
 *
 * Response:
 * - questions: Array of FollowUpQuestion objects
 * - sessionStatus: Updated session status
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid session ID format" }, { status: 400 });
    }

    // Fetch session
    const [voiceSession] = await db
      .select()
      .from(voiceSessions)
      .where(eq(voiceSessions.id, id))
      .limit(1);

    if (!voiceSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify ownership
    if (voiceSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if transcript exists
    if (!voiceSession.transcript) {
      return NextResponse.json(
        { error: "Session has no transcript. Complete transcription first." },
        { status: 400 }
      );
    }

    // Check if questions already exist
    if (
      voiceSession.followUpQuestions &&
      voiceSession.followUpQuestions.length > 0
    ) {
      // Return existing questions instead of regenerating
      return NextResponse.json({
        success: true,
        questions: voiceSession.followUpQuestions,
        sessionStatus: voiceSession.status,
        message: "Returning existing follow-up questions",
      });
    }

    // Generate follow-up questions
    const questions = await generateFollowUpQuestions(
      voiceSession.transcript,
      voiceSession.enthusiasmAnalysis,
      voiceSession.mode
    );

    // Update session with questions and set status to follow_ups
    const [updatedSession] = await db
      .update(voiceSessions)
      .set({
        followUpQuestions: questions,
        status: "follow_ups",
        updatedAt: new Date(),
      })
      .where(eq(voiceSessions.id, id))
      .returning({
        status: voiceSessions.status,
        followUpQuestions: voiceSessions.followUpQuestions,
      });

    return NextResponse.json({
      success: true,
      questions: updatedSession?.followUpQuestions || questions,
      sessionStatus: updatedSession?.status || "follow_ups",
      questionsGenerated: questions.length,
    });
  } catch (error) {
    console.error("Error generating follow-up questions:", error);
    return NextResponse.json(
      {
        error: "Failed to generate follow-up questions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/session/[id]/questions
 *
 * Retrieves existing follow-up questions for a session.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid session ID format" }, { status: 400 });
    }

    // Fetch session
    const [voiceSession] = await db
      .select({
        followUpQuestions: voiceSessions.followUpQuestions,
        followUpResponses: voiceSessions.followUpResponses,
        status: voiceSessions.status,
        userId: voiceSessions.userId,
      })
      .from(voiceSessions)
      .where(eq(voiceSessions.id, id))
      .limit(1);

    if (!voiceSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify ownership
    if (voiceSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const questions = voiceSession.followUpQuestions || [];
    const responses = voiceSession.followUpResponses || [];
    const answeredIds = new Set(responses.map((r) => r.questionId));

    // Add answered status to each question
    const questionsWithStatus = questions.map((q) => ({
      ...q,
      answered: answeredIds.has(q.id),
      response: responses.find((r) => r.questionId === q.id) || null,
    }));

    return NextResponse.json({
      questions: questionsWithStatus,
      totalQuestions: questions.length,
      answeredCount: responses.length,
      sessionStatus: voiceSession.status,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch questions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
