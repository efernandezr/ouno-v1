/**
 * Content Generation API Route
 *
 * POST /api/content/generate
 *
 * Generates blog content from a voice session using Voice DNA.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { getVoiceDNAProfile } from "@/lib/analysis/voiceDNABuilder";
import { auth } from "@/lib/auth";
import {
  processGeneratedContent,
  cleanupContent,
} from "@/lib/content/postProcessor";
import {
  buildGenerationPrompt,
  getGenerationSystemPrompt,
  type GenerationContext,
} from "@/lib/content/promptComposer";
import { db } from "@/lib/db";
import { voiceSessions, generatedContent } from "@/lib/schema";
import { isValidUUID } from "@/lib/validation";

const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";

interface GenerateRequest {
  sessionId: string;
}

/**
 * POST /api/content/generate
 *
 * Request body:
 * - sessionId: UUID of the voice session to generate content from
 *
 * Response:
 * - contentId: UUID of the generated content
 * - title: Generated title
 * - content: Markdown content
 * - wordCount: Word count
 * - readTimeMinutes: Estimated read time
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as GenerateRequest;
    const { sessionId } = body;

    // Validate sessionId
    if (!sessionId || !isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: "Invalid session ID format" },
        { status: 400 }
      );
    }

    // Fetch the voice session
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

    // Check if session has transcript
    if (!voiceSession.transcript) {
      return NextResponse.json(
        { error: "Session has no transcript" },
        { status: 400 }
      );
    }

    // Check if content was already generated
    if (voiceSession.generatedContentId) {
      // Return existing content
      const [existingContent] = await db
        .select()
        .from(generatedContent)
        .where(eq(generatedContent.id, voiceSession.generatedContentId))
        .limit(1);

      if (existingContent) {
        return NextResponse.json({
          contentId: existingContent.id,
          title: existingContent.title,
          content: existingContent.content,
          wordCount: existingContent.wordCount,
          readTimeMinutes: existingContent.readTimeMinutes,
          alreadyGenerated: true,
        });
      }
    }

    // Update session status to generating
    await db
      .update(voiceSessions)
      .set({ status: "generating", updatedAt: new Date() })
      .where(eq(voiceSessions.id, sessionId));

    // Fetch user's Voice DNA profile
    const { profile: voiceDNA } = await getVoiceDNAProfile(session.user.id);

    // Build generation context
    const followUpQuestions = voiceSession.followUpQuestions?.map((q) => ({
      id: q.id,
      question: q.question,
    }));

    const generationContext: GenerationContext = {
      voiceDNA: voiceDNA || {
        spokenPatterns: null,
        writtenPatterns: null,
        tonalAttributes: null,
        referentInfluences: null,
        learnedRules: [],
        calibrationScore: 0,
      },
      originalTranscript: voiceSession.transcript,
      enthusiasmAnalysis: voiceSession.enthusiasmAnalysis,
      contentOutline: voiceSession.contentOutline,
      followUpResponses: voiceSession.followUpResponses || [],
      ...(followUpQuestions && { followUpQuestions }),
    };

    // Build the prompt
    const prompt = buildGenerationPrompt(generationContext);
    const systemPrompt = getGenerationSystemPrompt();

    // Estimate target word count based on transcript length
    const transcriptWords = voiceSession.transcript.split(/\s+/).length;
    const followUpWords = (voiceSession.followUpResponses || [])
      .map((r) => r.content?.split(/\s+/).length || 0)
      .reduce((a, b) => a + b, 0);
    const totalInputWords = transcriptWords + followUpWords;

    // Target 70-100% of input word count for output (structured content is often slightly shorter)
    const targetWordCount = Math.max(300, Math.round(totalInputWords * 0.85));

    // Generate content
    const { text: rawContent } = await generateText({
      model: openrouter(MODEL),
      system: systemPrompt,
      prompt: `${prompt}\n\nTarget approximately ${targetWordCount} words.`,
      maxOutputTokens: 4000,
      temperature: 0.7, // Some creativity but stay faithful
    });

    // Clean up and process the content
    const cleanedContent = cleanupContent(rawContent);
    const processed = processGeneratedContent(cleanedContent);

    const generationTimeMs = Date.now() - startTime;

    // Store the generated content
    const [newContent] = await db
      .insert(generatedContent)
      .values({
        userId: session.user.id,
        sessionId: sessionId,
        title: processed.title,
        content: processed.content,
        wordCount: processed.wordCount,
        readTimeMinutes: processed.readTimeMinutes,
        status: "draft",
        voiceDNASnapshot: voiceDNA,
        referentInfluencesUsed: voiceDNA?.referentInfluences || null,
        version: 1,
        modelUsed: MODEL,
        generationTimeMs,
      })
      .returning();

    if (!newContent) {
      throw new Error("Failed to store generated content");
    }

    // Update session with generated content ID and status
    await db
      .update(voiceSessions)
      .set({
        status: "complete",
        generatedContentId: newContent.id,
        title: processed.title,
        updatedAt: new Date(),
      })
      .where(eq(voiceSessions.id, sessionId));

    return NextResponse.json({
      contentId: newContent.id,
      title: processed.title,
      content: processed.content,
      wordCount: processed.wordCount,
      readTimeMinutes: processed.readTimeMinutes,
      generationTimeMs,
      alreadyGenerated: false,
    });
  } catch (error) {
    console.error("Error generating content:", error);

    // Update session status to error if we have a sessionId
    try {
      const body = await request.clone().json();
      if (body.sessionId && isValidUUID(body.sessionId)) {
        await db
          .update(voiceSessions)
          .set({
            status: "error",
            errorMessage:
              error instanceof Error ? error.message : "Content generation failed",
            updatedAt: new Date(),
          })
          .where(eq(voiceSessions.id, body.sessionId));
      }
    } catch {
      // Ignore error handling errors
    }

    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
