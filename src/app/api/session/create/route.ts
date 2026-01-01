/**
 * Session Creation API Route
 *
 * POST /api/session/create
 *
 * Creates a new voice session for recording.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SessionMode, SessionStatus } from "@/types/session";

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface CreateSessionRequest {
  mode: SessionMode;
  title?: string;
  // Optional: Pass transcript data directly (for quick capture flow)
  transcript?: string;
  durationSeconds?: number;
  wordTimestamps?: WordTimestamp[];
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
    const { mode, title: _title, transcript, durationSeconds, wordTimestamps } = body;

    // Validate mode
    if (!mode || !["quick", "guided"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'quick' or 'guided'" },
        { status: 400 }
      );
    }

    // Determine initial status based on whether transcript is provided
    // If transcript is provided (quick capture), skip to generating status
    const hasTranscript = !!transcript && transcript.trim().length > 0;
    const initialStatus: SessionStatus = hasTranscript ? "generating" : "recording";

    // Use raw SQL for better control over JSONB serialization
    // This avoids issues with how postgres.js/Drizzle serialize complex objects
    let newSession;
    try {
      const wordTimestampsJson = Array.isArray(wordTimestamps) && wordTimestamps.length > 0
        ? JSON.stringify(wordTimestamps)
        : null;

      const result = await db.execute<{
        id: string;
        mode: string;
        status: string;
        created_at: Date;
      }>(sql`
        INSERT INTO voice_sessions (
          user_id,
          mode,
          status,
          transcript,
          duration_seconds,
          word_timestamps
        ) VALUES (
          ${session.user.id},
          ${mode}::"session_mode",
          ${initialStatus}::"session_status",
          ${transcript ?? null},
          ${typeof durationSeconds === "number" ? Math.round(durationSeconds) : null},
          ${wordTimestampsJson}::jsonb
        )
        RETURNING id, mode, status, created_at
      `);

      // Extract the first row from the result (it's an array-like object)
      const firstRow = result[0];

      if (firstRow) {
        newSession = {
          id: firstRow.id,
          mode: firstRow.mode as SessionMode,
          status: firstRow.status as SessionStatus,
          createdAt: firstRow.created_at,
        };
      }

    } catch (dbError) {
      console.error("Database insert error:", {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : "Unknown",
        code: (dbError as { code?: string })?.code,
        // Include full error object for debugging
        fullError: JSON.stringify(dbError, Object.getOwnPropertyNames(dbError as object)),
      });
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      sessionId: newSession?.id,
      mode: newSession?.mode,
      status: newSession?.status,
      createdAt: newSession?.createdAt,
    });
  } catch (error) {
    // Log full error details for debugging
    console.error("Error creating session:", {
      error,
      message: error instanceof Error ? error.message : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    // Check for specific database errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isDbError = errorMessage.includes("relation") ||
                      errorMessage.includes("column") ||
                      errorMessage.includes("type") ||
                      errorMessage.includes("constraint");

    return NextResponse.json(
      {
        error: "Failed to create session",
        details: errorMessage,
        hint: isDbError ? "Database schema may need migration. Run: pnpm db:push" : undefined,
      },
      { status: 500 }
    );
  }
}
