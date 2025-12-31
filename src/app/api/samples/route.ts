/**
 * Writing Samples API
 *
 * POST - Upload a writing sample for Voice DNA training
 * Supports: paste (direct text), url (fetch from web), file (uploaded content)
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { extractWritingPatterns } from "@/lib/analysis/writingSampleAnalyzer";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writingSamples, voiceDNAProfiles } from "@/lib/schema";
import { isValidExternalUrl, VALIDATION_LIMITS } from "@/lib/validation";

interface SampleRequest {
  sourceType: "paste" | "url" | "file";
  content?: string;
  sourceUrl?: string;
  fileName?: string;
}

/**
 * Count words in a string
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Fetch and extract text content from a URL
 * Includes SSRF protection and size limits
 */
async function fetchUrlContent(url: string): Promise<string> {
  // Validate URL safety (SSRF protection)
  const urlValidation = isValidExternalUrl(url);
  if (!urlValidation.valid) {
    throw new Error(urlValidation.error || "Invalid URL");
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    VALIDATION_LIMITS.URL_FETCH_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "VoiceDNA Bot (content analysis)",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    // Check content length before downloading
    const contentLength = response.headers.get("content-length");
    const maxSize = VALIDATION_LIMITS.URL_FETCH_MAX_SIZE_MB * 1024 * 1024;
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      throw new Error(
        `Content too large. Maximum size: ${VALIDATION_LIMITS.URL_FETCH_MAX_SIZE_MB}MB`
      );
    }

    const html = await response.text();

    // Double-check size after download (for chunked transfers)
    if (html.length > maxSize) {
      throw new Error(
        `Content too large. Maximum size: ${VALIDATION_LIMITS.URL_FETCH_MAX_SIZE_MB}MB`
      );
    }

    // Basic HTML to text extraction
    // Remove script, style, and other non-content tags
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, "");

    // Try to extract main content
    const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

    if (mainMatch?.[1]) {
      text = mainMatch[1];
    } else if (articleMatch?.[1]) {
      text = articleMatch[1];
    }

    // Remove remaining HTML tags
    text = text.replace(/<[^>]+>/g, " ");

    // Clean up whitespace
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 100) {
      throw new Error(
        "Could not extract enough content from URL. Please try pasting the text directly."
      );
    }

    return text;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      // Handle abort error specifically
      if (error.name === "AbortError") {
        throw new Error("Request timed out while fetching URL");
      }
      throw error;
    }
    throw new Error("Failed to fetch content from URL");
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as SampleRequest;
    const { sourceType, content, sourceUrl, fileName } = body;

    // Validate input based on source type
    if (sourceType === "paste" || sourceType === "file") {
      if (!content || content.length < VALIDATION_LIMITS.CONTENT_MIN_LENGTH) {
        return NextResponse.json(
          { error: `Content must be at least ${VALIDATION_LIMITS.CONTENT_MIN_LENGTH} characters` },
          { status: 400 }
        );
      }
      // Check maximum content length
      if (content.length > VALIDATION_LIMITS.CONTENT_MAX_LENGTH) {
        return NextResponse.json(
          { error: `Content must be at most ${VALIDATION_LIMITS.CONTENT_MAX_LENGTH} characters` },
          { status: 413 }
        );
      }
    } else if (sourceType === "url") {
      if (!sourceUrl) {
        return NextResponse.json(
          { error: "URL is required" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid source type" },
        { status: 400 }
      );
    }

    // Get content based on source type
    let sampleContent: string;

    if (sourceType === "url") {
      sampleContent = await fetchUrlContent(sourceUrl!);
    } else {
      sampleContent = content!;
    }

    const wordCount = countWords(sampleContent);

    // Validate minimum word count
    if (wordCount < 50) {
      return NextResponse.json(
        { error: "Sample must contain at least 50 words" },
        { status: 400 }
      );
    }

    // Insert the sample
    const [sample] = await db
      .insert(writingSamples)
      .values({
        userId: session.user.id,
        sourceType,
        sourceUrl: sourceUrl || null,
        fileName: fileName || null,
        content: sampleContent,
        wordCount,
      })
      .returning();

    if (!sample) {
      throw new Error("Failed to save writing sample");
    }

    // Analyze the sample in the background
    // For now, we'll do it synchronously since it's quick
    try {
      const patterns = await extractWritingPatterns(sampleContent);

      await db
        .update(writingSamples)
        .set({
          extractedPatterns: patterns,
          analyzedAt: new Date(),
        })
        .where(eq(writingSamples.id, sample.id));

      // Update Voice DNA profile stats
      const [profile] = await db
        .select()
        .from(voiceDNAProfiles)
        .where(eq(voiceDNAProfiles.userId, session.user.id))
        .limit(1);

      if (profile) {
        await db
          .update(voiceDNAProfiles)
          .set({
            writingSamplesAnalyzed: (profile.writingSamplesAnalyzed || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(voiceDNAProfiles.userId, session.user.id));
      }
    } catch (analysisError) {
      console.error("Error analyzing sample:", analysisError);
      // Don't fail the request, sample is still saved
    }

    return NextResponse.json({
      success: true,
      sampleId: sample.id,
      wordCount,
      sourceType,
    });
  } catch (error) {
    console.error("Error uploading sample:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload sample",
      },
      { status: 500 }
    );
  }
}
