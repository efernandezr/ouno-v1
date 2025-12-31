/**
 * Follow-up Response API Route
 *
 * POST /api/session/[id]/respond
 *
 * Submits a response to a follow-up question.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { voiceSessions } from "@/lib/schema";
import { isValidUUID } from "@/lib/validation";
import type { FollowUpResponse, ResponseType } from "@/types/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface RespondRequest {
  questionId: string;
  responseType: ResponseType;
  content?: string; // Required for voice/text, not for skip
  durationSeconds?: number; // For voice responses
}

/**
 * POST /api/session/[id]/respond
 *
 * Submit a response to a follow-up question.
 *
 * Request body:
 * - questionId: ID of the question being answered
 * - responseType: "voice" | "text" | "skip"
 * - content: Response content (transcript for voice, text for text)
 * - durationSeconds: Duration for voice responses
 *
 * Response:
 * - responseId: ID of the question that was answered
 * - nextQuestionId: ID of next unanswered question (if any)
 * - allAnswered: Whether all questions have been answered
 * - sessionStatus: Current session status
 */
export async function POST(request: Request, { params }: RouteParams) {
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

    const body = (await request.json()) as RespondRequest;
    const { questionId, responseType, content, durationSeconds } = body;

    // Validate input
    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    if (!responseType || !["voice", "text", "skip"].includes(responseType)) {
      return NextResponse.json(
        { error: "Invalid responseType. Must be 'voice', 'text', or 'skip'" },
        { status: 400 }
      );
    }

    // Content is required for voice and text responses
    if (responseType !== "skip" && !content) {
      return NextResponse.json(
        { error: "content is required for voice and text responses" },
        { status: 400 }
      );
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

    // Check if session is in the right status
    if (voiceSession.status !== "follow_ups") {
      return NextResponse.json(
        {
          error: "Session is not in follow_ups status",
          currentStatus: voiceSession.status,
        },
        { status: 400 }
      );
    }

    // Check if question exists
    const questions = voiceSession.followUpQuestions || [];
    const questionExists = questions.some((q) => q.id === questionId);
    if (!questionExists) {
      return NextResponse.json(
        { error: "Question not found in session" },
        { status: 404 }
      );
    }

    // Check if question already answered
    const existingResponses = voiceSession.followUpResponses || [];
    const alreadyAnswered = existingResponses.some(
      (r) => r.questionId === questionId
    );
    if (alreadyAnswered) {
      return NextResponse.json(
        { error: "Question has already been answered" },
        { status: 400 }
      );
    }

    // Create the response
    const response: FollowUpResponse = {
      questionId,
      responseType,
      content: content || "",
    };
    if (durationSeconds !== undefined) {
      response.durationSeconds = durationSeconds;
    }

    // Add response to session
    const updatedResponses = [...existingResponses, response];

    // Check if all questions are answered
    const allAnswered = updatedResponses.length >= questions.length;

    // Determine new status
    const newStatus = allAnswered ? "generating" : "follow_ups";

    // Update session
    await db
      .update(voiceSessions)
      .set({
        followUpResponses: updatedResponses,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(voiceSessions.id, id));

    // Find next unanswered question
    const answeredIds = new Set(updatedResponses.map((r) => r.questionId));
    const nextQuestion = questions.find((q) => !answeredIds.has(q.id));

    return NextResponse.json({
      success: true,
      responseId: questionId,
      nextQuestionId: nextQuestion?.id || null,
      nextQuestion: nextQuestion || null,
      allAnswered,
      answeredCount: updatedResponses.length,
      totalQuestions: questions.length,
      sessionStatus: newStatus,
    });
  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json(
      {
        error: "Failed to submit response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
