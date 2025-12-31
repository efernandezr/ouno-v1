/**
 * Session Status API Route
 *
 * GET /api/session/[id]
 * PATCH /api/session/[id]
 *
 * Retrieves or updates a voice session's details.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { voiceSessions } from "@/lib/schema";
import { isValidUUID } from "@/lib/validation";
import type { SessionStatus } from "@/types/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PatchRequest {
  status?: SessionStatus;
  title?: string;
  transcript?: string;
  errorMessage?: string;
}

/**
 * GET /api/session/[id]
 *
 * Response: Full session object with current status
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

    // Calculate progress info
    const answeredQuestions = voiceSession.followUpResponses?.length || 0;
    const totalQuestions = voiceSession.followUpQuestions?.length || 0;
    const currentQuestionIndex =
      voiceSession.status === "follow_ups" ? answeredQuestions : null;

    return NextResponse.json({
      id: voiceSession.id,
      userId: voiceSession.userId,
      mode: voiceSession.mode,
      status: voiceSession.status,
      title: voiceSession.title,
      transcript: voiceSession.transcript,
      durationSeconds: voiceSession.durationSeconds,
      enthusiasmAnalysis: voiceSession.enthusiasmAnalysis,
      contentOutline: voiceSession.contentOutline,
      followUpQuestions: voiceSession.followUpQuestions,
      followUpResponses: voiceSession.followUpResponses,
      generatedContentId: voiceSession.generatedContentId,
      errorMessage: voiceSession.errorMessage,
      createdAt: voiceSession.createdAt,
      updatedAt: voiceSession.updatedAt,
      // Progress info for UI
      progress: {
        answeredQuestions,
        totalQuestions,
        currentQuestionIndex,
        hasTranscript: !!voiceSession.transcript,
        hasAnalysis: !!voiceSession.enthusiasmAnalysis,
        hasContent: !!voiceSession.generatedContentId,
      },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/session/[id]
 *
 * Request body:
 * - status: (optional) New status
 * - title: (optional) Update title
 * - transcript: (optional) Update transcript
 * - errorMessage: (optional) Set error message
 *
 * Response: Updated session object
 */
export async function PATCH(request: Request, { params }: RouteParams) {
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

    const body = (await request.json()) as PatchRequest;

    // Fetch existing session
    const [existingSession] = await db
      .select()
      .from(voiceSessions)
      .where(eq(voiceSessions.id, id))
      .limit(1);

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify ownership
    if (existingSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update object
    const updateData: Partial<typeof voiceSessions.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.status) {
      const validStatuses: SessionStatus[] = [
        "recording",
        "transcribing",
        "analyzing",
        "follow_ups",
        "generating",
        "complete",
        "error",
      ];
      if (validStatuses.includes(body.status)) {
        updateData.status = body.status;
      }
    }

    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    if (body.transcript !== undefined) {
      updateData.transcript = body.transcript;
    }

    if (body.errorMessage !== undefined) {
      updateData.errorMessage = body.errorMessage;
    }

    // Update session
    const [updatedSession] = await db
      .update(voiceSessions)
      .set(updateData)
      .where(eq(voiceSessions.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      {
        error: "Failed to update session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
