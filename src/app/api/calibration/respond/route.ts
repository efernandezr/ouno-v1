/**
 * Calibration Respond API
 *
 * POST - Submit user response and generate sample
 * PATCH - Update with rating and feedback
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calibrationRounds, voiceDNAProfiles } from "@/lib/schema";
import type { CalibrationInsight } from "@/types/calibration";

interface RespondRequest {
  roundNumber: number;
  promptText: string;
  userResponse: string;
}

interface FeedbackRequest {
  roundNumber: number;
  rating: number;
  feedback?: string;
}

/**
 * POST - Submit user response and generate sample based on Voice DNA
 */
export async function POST(request: Request) {
  try {
    // Check API key early to fail fast
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is not configured");
      return NextResponse.json(
        { error: "Calibration service is not configured. Please contact support." },
        { status: 503 }
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as RespondRequest;
    const { roundNumber, promptText, userResponse } = body;

    if (!roundNumber || !promptText || !userResponse) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the calibration round
    const [round] = await db
      .select()
      .from(calibrationRounds)
      .where(
        and(
          eq(calibrationRounds.userId, session.user.id),
          eq(calibrationRounds.roundNumber, roundNumber)
        )
      )
      .limit(1);

    if (!round) {
      return NextResponse.json(
        { error: "Calibration round not found. Please start the round first." },
        { status: 404 }
      );
    }

    // Get user's Voice DNA profile
    const [profile] = await db
      .select()
      .from(voiceDNAProfiles)
      .where(eq(voiceDNAProfiles.userId, session.user.id))
      .limit(1);

    // Build Voice DNA context for generation
    const voiceDNAContext = buildVoiceDNAContext(profile);

    // Generate sample content using Voice DNA
    const generatedSample = await generateCalibrationSample(
      promptText,
      userResponse,
      voiceDNAContext
    );

    // Update the round with response and generated sample
    await db
      .update(calibrationRounds)
      .set({
        userResponseTranscript: userResponse,
        userResponseType: "voice", // Default to voice, could be passed from client
        generatedSample,
      })
      .where(eq(calibrationRounds.id, round.id));

    return NextResponse.json({
      roundId: round.id,
      generatedSample,
    });
  } catch (error) {
    console.error("Calibration respond error:", error);
    return NextResponse.json(
      {
        error: "Failed to process calibration response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update round with rating and feedback
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as FeedbackRequest;
    const { roundNumber, rating, feedback } = body;

    if (!roundNumber || rating === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Get the calibration round
    const [round] = await db
      .select()
      .from(calibrationRounds)
      .where(
        and(
          eq(calibrationRounds.userId, session.user.id),
          eq(calibrationRounds.roundNumber, roundNumber)
        )
      )
      .limit(1);

    if (!round) {
      return NextResponse.json(
        { error: "Calibration round not found" },
        { status: 404 }
      );
    }

    // Extract insights from the feedback
    const insights = await extractCalibrationInsights(
      round.generatedSample || "",
      rating,
      feedback || ""
    );

    // Update the round with feedback
    await db
      .update(calibrationRounds)
      .set({
        rating,
        feedbackText: feedback || null,
        insightsExtracted: insights,
      })
      .where(eq(calibrationRounds.id, round.id));

    // Update Voice DNA profile calibration stats
    await db
      .update(voiceDNAProfiles)
      .set({
        calibrationRoundsCompleted: roundNumber,
        calibrationScore: Math.min(100, roundNumber * 20 + rating * 4),
        updatedAt: new Date(),
      })
      .where(eq(voiceDNAProfiles.userId, session.user.id));

    return NextResponse.json({
      success: true,
      roundId: round.id,
      insightsExtracted: insights.length,
    });
  } catch (error) {
    console.error("Calibration feedback error:", error);
    return NextResponse.json(
      {
        error: "Failed to save calibration feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Build Voice DNA context string for content generation
 */
function buildVoiceDNAContext(
  profile: typeof voiceDNAProfiles.$inferSelect | undefined
): string {
  if (!profile) {
    return "Write in a natural, conversational tone.";
  }

  const parts: string[] = [];

  // Spoken patterns
  if (profile.spokenPatterns) {
    const sp = profile.spokenPatterns;

    if (sp.vocabulary?.uniquePhrases?.length > 0) {
      parts.push(`Use phrases like: ${sp.vocabulary.uniquePhrases.slice(0, 3).join(", ")}`);
    }

    if (sp.rhythm) {
      parts.push(`Sentence length: ${sp.rhythm.avgSentenceLength}`);
      parts.push(`Writing pace: ${sp.rhythm.paceVariation}`);
    }

    if (sp.rhetoric) {
      if (sp.rhetoric.usesQuestions) parts.push("Include rhetorical questions");
      if (sp.rhetoric.usesAnalogies) parts.push("Use analogies to explain concepts");
      parts.push(`Storytelling style: ${sp.rhetoric.storytellingStyle}`);
    }
  }

  // Tonal attributes
  if (profile.tonalAttributes) {
    const ta = profile.tonalAttributes;
    const tones: string[] = [];

    if (ta.warmth > 0.6) tones.push("warm");
    if (ta.authority > 0.6) tones.push("authoritative");
    if (ta.humor > 0.4) tones.push("light humor");
    if (ta.directness > 0.7) tones.push("direct");
    if (ta.empathy > 0.6) tones.push("empathetic");

    if (tones.length > 0) {
      parts.push(`Tone: ${tones.join(", ")}`);
    }
  }

  // Referent influences
  if (profile.referentInfluences?.referents && profile.referentInfluences.referents.length > 0) {
    const influences = profile.referentInfluences.referents
      .map((r) => `${r.name} (${r.weight}%)`)
      .join(", ");
    parts.push(`Style influences: ${influences}`);
  }

  return parts.length > 0
    ? parts.join(". ") + "."
    : "Write in a natural, conversational tone.";
}

/**
 * Generate calibration sample content using Voice DNA
 */
async function generateCalibrationSample(
  promptText: string,
  userResponse: string,
  voiceDNAContext: string
): Promise<string> {
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";

  const systemPrompt = `You are a writing assistant that generates content matching a specific person's voice and style.

VOICE DNA PROFILE:
${voiceDNAContext}

IMPORTANT:
- Match the style, tone, and patterns described in the Voice DNA profile
- Write naturally, not mechanically
- Keep the response to 2-3 paragraphs
- Focus on clarity and engagement`;

  const userPrompt = `ORIGINAL PROMPT: ${promptText}

USER'S RESPONSE/INPUT:
${userResponse}

Generate a polished piece of content based on this input, written in the user's voice and style. The content should feel like something they would actually write.`;

  try {
    const { text } = await generateText({
      model: openrouter(model),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 500,
      temperature: 0.7,
    });

    return text.trim();
  } catch (error) {
    console.error("Error generating calibration sample:", error);
    throw new Error("Failed to generate sample content");
  }
}

/**
 * Extract insights from calibration feedback
 */
async function extractCalibrationInsights(
  generatedSample: string,
  rating: number,
  feedback: string
): Promise<CalibrationInsight[]> {
  // If rating is high and no specific feedback, minimal insights needed
  if (rating >= 4 && !feedback.trim()) {
    return [
      {
        type: "style_preference",
        insight: "Current voice style is well-calibrated",
        confidence: rating / 5,
      },
    ];
  }

  // For lower ratings or specific feedback, try to extract insights
  if (!feedback.trim()) {
    return [
      {
        type: "tone_adjustment",
        insight: `Voice match rated ${rating}/5 - needs refinement`,
        confidence: 0.5,
      },
    ];
  }

  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";

  try {
    const { text } = await generateText({
      model: openrouter(model),
      prompt: `Analyze this calibration feedback and extract specific insights for improving voice matching.

Generated content that was rated ${rating}/5:
${generatedSample.slice(0, 500)}

User feedback:
${feedback}

Extract 1-3 specific insights. For each insight, identify:
1. Type: "style_preference" | "tone_adjustment" | "vocabulary" | "structure"
2. What specifically should be adjusted
3. Confidence level (0-1)

Return as JSON array:
[{"type": "...", "insight": "...", "confidence": 0.X}]`,
      maxOutputTokens: 300,
      temperature: 0.3,
    });

    // Try to parse JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as CalibrationInsight[];
      return parsed.slice(0, 3);
    }

    // Fallback if parsing fails
    return [
      {
        type: "tone_adjustment",
        insight: feedback.slice(0, 200),
        confidence: 0.6,
      },
    ];
  } catch (error) {
    console.error("Error extracting insights:", error);
    return [
      {
        type: "tone_adjustment",
        insight: feedback.slice(0, 200) || `Rating: ${rating}/5 - needs improvement`,
        confidence: 0.5,
      },
    ];
  }
}
