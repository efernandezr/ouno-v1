/**
 * Content Refinement API Route
 *
 * POST /api/content/[id]/refine
 *
 * Refines content based on voice or text instructions.
 * Creates a new version while preserving the original.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  processGeneratedContent,
  cleanupContent,
} from "@/lib/content/postProcessor";
import { db } from "@/lib/db";
import { generatedContent } from "@/lib/schema";
import { isValidUUID } from "@/lib/validation";

const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface RefineRequest {
  refinementType: "voice" | "text";
  instruction: string;
}

/**
 * System prompt for refinement
 */
const REFINEMENT_SYSTEM_PROMPT = `You are a skilled content editor helping refine written content while preserving the author's voice.

Your role is to make targeted improvements based on the user's instruction. DO NOT:
- Change the overall tone or voice
- Add new information the author didn't include
- Rewrite sections that weren't mentioned
- Remove content unless specifically asked

DO:
- Focus precisely on what was asked
- Preserve the author's unique phrases and expressions
- Maintain the existing structure unless asked to change it
- Make minimal changes to achieve the requested improvement

Return ONLY the refined content in markdown format. Do not include explanations or commentary.`;

/**
 * POST /api/content/[id]/refine
 *
 * Request body:
 * - refinementType: "voice" | "text" (how the instruction was given)
 * - instruction: The refinement instruction (already transcribed if voice)
 *
 * Response:
 * - contentId: UUID of the new version
 * - content: Refined markdown content
 * - wordCount: Word count
 * - readTimeMinutes: Estimated read time
 * - version: New version number
 * - changes: Array of change descriptions
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
      return NextResponse.json(
        { error: "Invalid content ID format" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as RefineRequest;
    const { refinementType, instruction } = body;

    // Validate request
    if (!refinementType || !["voice", "text"].includes(refinementType)) {
      return NextResponse.json(
        { error: "refinementType must be 'voice' or 'text'" },
        { status: 400 }
      );
    }

    if (!instruction || typeof instruction !== "string" || instruction.trim().length === 0) {
      return NextResponse.json(
        { error: "instruction is required" },
        { status: 400 }
      );
    }

    // Fetch existing content
    const [existingContent] = await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.id, id))
      .limit(1);

    if (!existingContent) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Verify ownership
    if (existingContent.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build refinement prompt
    const refinementPrompt = buildRefinementPrompt(
      existingContent.content,
      instruction.trim(),
      refinementType
    );

    // Generate refined content
    const { text: rawContent } = await generateText({
      model: openrouter(MODEL),
      system: REFINEMENT_SYSTEM_PROMPT,
      prompt: refinementPrompt,
      maxOutputTokens: 4000,
      temperature: 0.5, // Lower temperature for more faithful refinement
    });

    // Clean up and process the content
    const cleanedContent = cleanupContent(rawContent);
    const processed = processGeneratedContent(cleanedContent);

    // Detect changes
    const changes = detectChanges(existingContent.content, processed.content);

    // Create new version
    const newVersion = existingContent.version + 1;

    const [newContent] = await db
      .insert(generatedContent)
      .values({
        userId: session.user.id,
        sessionId: existingContent.sessionId,
        title: processed.title || existingContent.title,
        content: processed.content,
        wordCount: processed.wordCount,
        readTimeMinutes: processed.readTimeMinutes,
        status: "draft",
        voiceDNASnapshot: existingContent.voiceDNASnapshot,
        referentInfluencesUsed: existingContent.referentInfluencesUsed,
        version: newVersion,
        parentVersionId: existingContent.id,
        modelUsed: MODEL,
      })
      .returning();

    if (!newContent) {
      throw new Error("Failed to store refined content");
    }

    return NextResponse.json({
      contentId: newContent.id,
      title: newContent.title,
      content: newContent.content,
      wordCount: newContent.wordCount,
      readTimeMinutes: newContent.readTimeMinutes,
      version: newVersion,
      parentVersionId: existingContent.id,
      changes,
    });
  } catch (error) {
    console.error("Error refining content:", error);
    return NextResponse.json(
      {
        error: "Failed to refine content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Build the refinement prompt
 */
function buildRefinementPrompt(
  currentContent: string,
  instruction: string,
  refinementType: "voice" | "text"
): string {
  const instructionContext =
    refinementType === "voice"
      ? "The author gave this feedback by speaking (transcribed below)"
      : "The author gave this written feedback";

  return `## CURRENT CONTENT
"""
${currentContent}
"""

## REFINEMENT REQUEST
${instructionContext}:
"${instruction}"

## TASK
Apply the requested changes to the content. Preserve the author's voice and only modify what was specifically requested.

Return the complete refined content in markdown format.`;
}

/**
 * Detect and describe changes between old and new content
 */
function detectChanges(oldContent: string, newContent: string): string[] {
  const changes: string[] = [];

  // Word count change
  const oldWords = oldContent.split(/\s+/).length;
  const newWords = newContent.split(/\s+/).length;
  const wordDiff = newWords - oldWords;

  if (Math.abs(wordDiff) > 10) {
    if (wordDiff > 0) {
      changes.push(`Added approximately ${wordDiff} words`);
    } else {
      changes.push(`Removed approximately ${Math.abs(wordDiff)} words`);
    }
  }

  // Title change
  const oldTitle = oldContent.match(/^#\s+(.+?)(?:\n|$)/m)?.[1];
  const newTitle = newContent.match(/^#\s+(.+?)(?:\n|$)/m)?.[1];
  if (oldTitle !== newTitle && newTitle) {
    changes.push("Title updated");
  }

  // Section changes
  const oldSections = oldContent.match(/^##\s+.+$/gm) || [];
  const newSections = newContent.match(/^##\s+.+$/gm) || [];
  if (oldSections.length !== newSections.length) {
    if (newSections.length > oldSections.length) {
      changes.push("Added new sections");
    } else {
      changes.push("Removed sections");
    }
  }

  // If no specific changes detected, add a generic message
  if (changes.length === 0) {
    changes.push("Content refined based on feedback");
  }

  return changes;
}
