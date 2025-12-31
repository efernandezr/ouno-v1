/**
 * Session Creation API Route
 *
 * POST /api/session/create
 *
 * Creates a new voice session for recording.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { voiceSessions } from "@/lib/schema";
import type { SessionMode } from "@/types/session";

interface CreateSessionRequest {
  mode: SessionMode;
  title?: string;
}

/**
 * POST /api/session/create
 *
 * Request body:
 * - mode: "quick" | "guided" - Recording mode
 * - title: (optional) Initial title for the session
 *
 * Response:
 * - sessionId: UUID of the created session
 * - mode: The session mode
 * - status: Initial status ("recording")
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateSessionRequest;
    const { mode, title } = body;

    // Validate mode
    if (!mode || !["quick", "guided"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'quick' or 'guided'" },
        { status: 400 }
      );
    }

    // Create the session
    const [newSession] = await db
      .insert(voiceSessions)
      .values({
        userId: session.user.id,
        mode,
        status: "recording",
        title: title || null,
        followUpQuestions: [],
        followUpResponses: [],
      })
      .returning({
        id: voiceSessions.id,
        mode: voiceSessions.mode,
        status: voiceSessions.status,
        createdAt: voiceSessions.createdAt,
      });

    return NextResponse.json({
      success: true,
      sessionId: newSession?.id,
      mode: newSession?.mode,
      status: newSession?.status,
      createdAt: newSession?.createdAt,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      {
        error: "Failed to create session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
