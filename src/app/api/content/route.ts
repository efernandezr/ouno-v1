/**
 * Content Listing API Route
 *
 * GET /api/content - List user's generated content
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent } from "@/lib/schema";

/**
 * GET /api/content
 *
 * Query params:
 * - limit: number (default 20, max 100)
 * - offset: number (default 0)
 * - status: filter by status (draft, final, published)
 *
 * Response: List of content items
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const statusFilter = searchParams.get("status");

    // Parse and validate limit
    let limit = 20;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 100); // Max 100
      }
    }

    // Parse offset
    let offset = 0;
    if (offsetParam) {
      const parsed = parseInt(offsetParam, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        offset = parsed;
      }
    }

    // Build query
    const query = db
      .select({
        id: generatedContent.id,
        title: generatedContent.title,
        wordCount: generatedContent.wordCount,
        readTimeMinutes: generatedContent.readTimeMinutes,
        status: generatedContent.status,
        createdAt: generatedContent.createdAt,
        updatedAt: generatedContent.updatedAt,
      })
      .from(generatedContent)
      .where(eq(generatedContent.userId, session.user.id))
      .orderBy(desc(generatedContent.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch content
    const content = await query;

    // Filter by status if provided
    const filteredContent = statusFilter
      ? content.filter((c) => c.status === statusFilter)
      : content;

    return NextResponse.json({
      content: filteredContent,
      pagination: {
        limit,
        offset,
        count: filteredContent.length,
      },
    });
  } catch (error) {
    console.error("Error listing content:", error);
    return NextResponse.json(
      {
        error: "Failed to list content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
