/**
 * Calibration Start API
 *
 * POST - Start a new calibration round
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { generateCalibrationPrompt } from "@/lib/analysis/questionGenerator";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calibrationRounds } from "@/lib/schema";

interface StartRequest {
  roundNumber: number;
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as StartRequest;
    const { roundNumber } = body;

    if (!roundNumber || roundNumber < 1) {
      return NextResponse.json(
        { error: "Invalid round number" },
        { status: 400 }
      );
    }

    // Check if user has completed previous rounds
    if (roundNumber > 1) {
      const previousRound = await db
        .select()
        .from(calibrationRounds)
        .where(
          and(
            eq(calibrationRounds.userId, session.user.id),
            eq(calibrationRounds.roundNumber, roundNumber - 1)
          )
        )
        .limit(1);

      if (previousRound.length === 0 || !previousRound[0] || previousRound[0].rating === null) {
        return NextResponse.json(
          { error: "Please complete the previous round first" },
          { status: 400 }
        );
      }
    }

    // Check if this round already exists
    const existingRound = await db
      .select()
      .from(calibrationRounds)
      .where(
        and(
          eq(calibrationRounds.userId, session.user.id),
          eq(calibrationRounds.roundNumber, roundNumber)
        )
      )
      .limit(1);

    if (existingRound.length > 0 && existingRound[0]) {
      // Return existing round if not completed
      if (existingRound[0].rating === null) {
        return NextResponse.json({
          roundId: existingRound[0].id,
          roundNumber: existingRound[0].roundNumber,
          promptText: existingRound[0].promptText,
          isExisting: true,
        });
      }

      // If completed, don't allow restart
      return NextResponse.json(
        { error: "This round has already been completed" },
        { status: 400 }
      );
    }

    // Get user's previous topics for dynamic prompt generation
    const previousRounds = await db
      .select({ transcript: calibrationRounds.userResponseTranscript })
      .from(calibrationRounds)
      .where(eq(calibrationRounds.userId, session.user.id))
      .orderBy(desc(calibrationRounds.roundNumber));

    const previousTopics = previousRounds
      .map((r) => r.transcript)
      .filter((t): t is string => t !== null)
      .map((t) => t.slice(0, 100)); // Use first 100 chars as topic summary

    // Generate calibration prompt
    const promptText = await generateCalibrationPrompt(roundNumber, previousTopics);

    // Create new calibration round
    const [round] = await db
      .insert(calibrationRounds)
      .values({
        userId: session.user.id,
        roundNumber,
        promptText,
      })
      .returning();

    if (!round) {
      throw new Error("Failed to create calibration round");
    }

    return NextResponse.json({
      roundId: round.id,
      roundNumber: round.roundNumber,
      promptText: round.promptText,
      isExisting: false,
    });
  } catch (error) {
    console.error("Calibration start error:", error);
    return NextResponse.json(
      {
        error: "Failed to start calibration round",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
