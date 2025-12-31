/**
 * Onboarding Follow-ups API
 *
 * POST - Submit follow-up question responses and update Voice DNA
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { mergeFollowUpResponses } from "@/lib/analysis/voiceDNABuilder";
import { auth } from "@/lib/auth";
import { updateUserOnboardingStatus } from "@/lib/db/users";

interface QuestionResponse {
  questionIndex: number;
  responseType: "voice" | "text" | "skip";
  response: string | null;
}

interface FollowUpsRequest {
  responses: QuestionResponse[];
  introTranscript: string | null;
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as FollowUpsRequest;
    const { responses, introTranscript } = body;

    // Collect all non-skipped responses
    const actualResponses = responses
      .filter((r) => r.responseType !== "skip" && r.response)
      .map((r) => r.response as string);

    // If we have responses, merge them into Voice DNA
    if (actualResponses.length > 0) {
      await mergeFollowUpResponses({
        userId: session.user.id,
        responses: actualResponses,
        introTranscript,
      });
    }

    // Update onboarding status
    await updateUserOnboardingStatus(session.user.id, "follow_ups");

    return NextResponse.json({
      success: true,
      responsesProcessed: actualResponses.length,
      responsesSkipped: responses.length - actualResponses.length,
    });
  } catch (error) {
    console.error("Onboarding follow-ups error:", error);
    return NextResponse.json(
      {
        error: "Failed to process follow-up responses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
