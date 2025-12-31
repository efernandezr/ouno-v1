/**
 * Content CRUD API Route
 *
 * GET /api/content/[id] - Get content details
 * PATCH /api/content/[id] - Update content (title, content, status)
 * DELETE /api/content/[id] - Delete content
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  calculateWordCount,
  calculateReadTime,
} from "@/lib/content/postProcessor";
import { db } from "@/lib/db";
import { generatedContent, voiceSessions } from "@/lib/schema";
import { isValidUUID } from "@/lib/validation";
import type { ContentStatus } from "@/types/content";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PatchRequest {
  title?: string;
  content?: string;
  status?: ContentStatus;
}

/**
 * GET /api/content/[id]
 *
 * Response: Full content object with session info
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
      return NextResponse.json(
        { error: "Invalid content ID format" },
        { status: 400 }
      );
    }

    // Fetch content
    const [content] = await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.id, id))
      .limit(1);

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Verify ownership
    if (content.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch associated session for context
    const [voiceSession] = await db
      .select({
        id: voiceSessions.id,
        mode: voiceSessions.mode,
        durationSeconds: voiceSessions.durationSeconds,
        createdAt: voiceSessions.createdAt,
      })
      .from(voiceSessions)
      .where(eq(voiceSessions.id, content.sessionId))
      .limit(1);

    return NextResponse.json({
      id: content.id,
      userId: content.userId,
      sessionId: content.sessionId,
      title: content.title,
      content: content.content,
      wordCount: content.wordCount,
      readTimeMinutes: content.readTimeMinutes,
      status: content.status,
      version: content.version,
      parentVersionId: content.parentVersionId,
      voiceDNASnapshot: content.voiceDNASnapshot,
      referentInfluencesUsed: content.referentInfluencesUsed,
      modelUsed: content.modelUsed,
      generationTimeMs: content.generationTimeMs,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      session: voiceSession || null,
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/content/[id]
 *
 * Request body:
 * - title: (optional) Update title
 * - content: (optional) Update content (will recalculate word count and read time)
 * - status: (optional) Update status (draft, final, published)
 *
 * Response: Updated content object
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
      return NextResponse.json(
        { error: "Invalid content ID format" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as PatchRequest;

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

    // Build update object
    const updateData: Partial<typeof generatedContent.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.content !== undefined) {
      if (typeof body.content !== "string") {
        return NextResponse.json(
          { error: "Content must be a string" },
          { status: 400 }
        );
      }
      updateData.content = body.content;
      // Recalculate word count and read time
      updateData.wordCount = calculateWordCount(body.content);
      updateData.readTimeMinutes = calculateReadTime(updateData.wordCount);
    }

    if (body.status !== undefined) {
      const validStatuses: ContentStatus[] = ["draft", "final", "published"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    // Update content
    const [updatedContent] = await db
      .update(generatedContent)
      .set(updateData)
      .where(eq(generatedContent.id, id))
      .returning();

    // Also update session title if title changed
    if (body.title !== undefined) {
      await db
        .update(voiceSessions)
        .set({ title: body.title.trim(), updatedAt: new Date() })
        .where(eq(voiceSessions.id, existingContent.sessionId));
    }

    return NextResponse.json({
      success: true,
      content: updatedContent,
    });
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json(
      {
        error: "Failed to update content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content/[id]
 *
 * Deletes the content (soft delete by setting status, or hard delete)
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
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

    // Clear the reference from the session first
    await db
      .update(voiceSessions)
      .set({ generatedContentId: null, updatedAt: new Date() })
      .where(eq(voiceSessions.id, existingContent.sessionId));

    // Delete the content
    await db.delete(generatedContent).where(eq(generatedContent.id, id));

    return NextResponse.json({
      success: true,
      message: "Content deleted",
    });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json(
      {
        error: "Failed to delete content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
