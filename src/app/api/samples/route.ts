/**
 * Writing Samples API
 *
 * GET - List user's writing samples
 * POST - Upload a writing sample for Voice DNA training
 * Supports: paste (direct text), url (fetch from web), file (uploaded content)
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { eq, desc } from "drizzle-orm";
import { rebuildVoiceDNA } from "@/lib/analysis/voiceDNABuilder";
import { extractWritingPatterns } from "@/lib/analysis/writingSampleAnalyzer";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writingSamples } from "@/lib/schema";
import { isValidExternalUrl, VALIDATION_LIMITS } from "@/lib/validation";

// Use a fast/cheap model for article extraction
const EXTRACTION_MODEL = "openai/gpt-4o-mini";

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
 * Fetch raw content using Jina.ai Reader API (handles JS-rendered sites)
 * Returns raw markdown for LLM extraction
 */
async function fetchWithJinaReader(url: string, timeout: number): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl, {
      headers: {
        Accept: "text/plain",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    return text.length > 100 ? text : null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

interface ExtractionResult {
  success: boolean;
  title?: string;
  author?: string;
  articleBody?: string;
  wordCount?: number;
  isArticle: boolean;
  error?: string;
}

/**
 * Extract article content using LLM from raw Jina output
 * Intelligently extracts only the main article body, removing navigation, footers, etc.
 */
async function extractArticleWithLLM(rawContent: string, sourceUrl: string): Promise<ExtractionResult> {
  const EXTRACTION_PROMPT = `You are an article extraction specialist. Given raw web page content, extract ONLY the main article body.

TASK:
1. Identify if this is an article/blog post (vs landing page, product page, 404, etc.)
2. Extract ONLY the article body text - no navigation, headers, footers, sidebars, ads, or other articles
3. Extract the article title and author name if present

RULES:
- If this is NOT an article (landing page, 404, product page, login wall), set isArticle to false
- Strip all navigation menus, site headers, footers, cookie notices
- Remove "Related articles", "You might also like", "Subscribe" sections
- Remove author bios that appear at the end (but keep the author NAME)
- Remove comments sections
- Keep the main article text with natural paragraph breaks
- Convert ALL markdown to plain text:
  - Remove **bold** and _italic_ markers (keep the text inside)
  - Remove > blockquote markers at the start of lines
  - Remove # header markers
  - Convert [link text](url) to just the link text
  - Remove template placeholders like {{variable}} or {{variable | default: "..."}}
  - Remove code fence markers (\`\`\`) but keep the code content
  - Remove inline code backticks (\`)
- Output should be clean, readable prose with no markdown or special formatting characters

Return ONLY valid JSON (no markdown, no explanation):
{
  "isArticle": true,
  "title": "Article title or null if not found",
  "author": "Author name or null if not found",
  "articleBody": "The extracted article text with paragraph breaks preserved",
  "error": null
}

Or if not an article:
{
  "isArticle": false,
  "title": null,
  "author": null,
  "articleBody": null,
  "error": "Brief explanation of why this is not an article"
}`;

  try {
    // Limit input to ~15k chars to stay within token limits
    const truncatedContent = rawContent.slice(0, 15000);

    const { text } = await generateText({
      model: openrouter(EXTRACTION_MODEL),
      system: EXTRACTION_PROMPT,
      prompt: `URL: ${sourceUrl}\n\nRAW CONTENT:\n${truncatedContent}`,
      maxOutputTokens: 4000,
      temperature: 0, // Deterministic extraction
    });

    // Parse JSON response - find JSON object in response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        isArticle: false,
        error: "Failed to parse extraction response"
      };
    }

    const result = JSON.parse(jsonMatch[0]);

    if (!result.isArticle) {
      return {
        success: false,
        isArticle: false,
        error: result.error || "This URL does not appear to be an article. Please try a different URL or paste the text directly.",
      };
    }

    if (!result.articleBody || result.articleBody.length < 100) {
      return {
        success: false,
        isArticle: true,
        error: "Could not extract enough article content. Try pasting the text directly.",
      };
    }

    const wordCount = result.articleBody.trim().split(/\s+/).filter(Boolean).length;

    return {
      success: true,
      isArticle: true,
      title: result.title || undefined,
      author: result.author || undefined,
      articleBody: result.articleBody,
      wordCount,
    };
  } catch (error) {
    console.error("LLM extraction error:", error);
    return {
      success: false,
      isArticle: false,
      error: error instanceof Error ? error.message : "Extraction failed",
    };
  }
}

interface UrlFetchResult {
  success: boolean;
  content?: string;
  title?: string;
  author?: string;
  wordCount?: number;
  extractionFailed?: boolean;
  errorMessage?: string;
}

/**
 * Fetch and extract article content from a URL
 * Uses Jina.ai for fetching (handles JS-rendered sites), then LLM for intelligent extraction
 * Returns extraction result with success/failure info for paste fallback
 */
async function fetchUrlContent(url: string): Promise<UrlFetchResult> {
  // Validate URL safety (SSRF protection)
  const urlValidation = isValidExternalUrl(url);
  if (!urlValidation.valid) {
    return {
      success: false,
      extractionFailed: true,
      errorMessage: urlValidation.error || "Invalid URL",
    };
  }

  const timeout = VALIDATION_LIMITS.URL_FETCH_TIMEOUT_MS;

  // Fetch raw content via Jina (handles JS rendering)
  const rawContent = await fetchWithJinaReader(url, timeout);

  if (!rawContent) {
    return {
      success: false,
      extractionFailed: true,
      errorMessage: "Could not fetch content from this URL. The site may be blocking access or require login.",
    };
  }

  // Use LLM to intelligently extract just the article body
  const extraction = await extractArticleWithLLM(rawContent, url);

  if (!extraction.success || !extraction.articleBody) {
    return {
      success: false,
      extractionFailed: true,
      errorMessage: extraction.error || "Could not extract article content.",
    };
  }

  return {
    success: true,
    content: extraction.articleBody,
    ...(extraction.title && { title: extraction.title }),
    ...(extraction.author && { author: extraction.author }),
    ...(extraction.wordCount && { wordCount: extraction.wordCount }),
  };
}

/**
 * GET - List user's writing samples
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const samples = await db
      .select({
        id: writingSamples.id,
        sourceType: writingSamples.sourceType,
        sourceUrl: writingSamples.sourceUrl,
        fileName: writingSamples.fileName,
        content: writingSamples.content,
        wordCount: writingSamples.wordCount,
        analyzedAt: writingSamples.analyzedAt,
        createdAt: writingSamples.createdAt,
      })
      .from(writingSamples)
      .where(eq(writingSamples.userId, session.user.id))
      .orderBy(desc(writingSamples.createdAt));

    // Transform samples to include preview instead of full content
    const samplesWithPreview = samples.map((sample) => ({
      id: sample.id,
      sourceType: sample.sourceType,
      sourceUrl: sample.sourceUrl,
      fileName: sample.fileName,
      preview: sample.content.slice(0, 150) + (sample.content.length > 150 ? "..." : ""),
      wordCount: sample.wordCount,
      analyzedAt: sample.analyzedAt,
      createdAt: sample.createdAt,
    }));

    return NextResponse.json({
      samples: samplesWithPreview,
      total: samples.length,
    });
  } catch (error) {
    console.error("Error fetching samples:", error);
    return NextResponse.json(
      { error: "Failed to fetch writing samples" },
      { status: 500 }
    );
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
    let extractedWordCount: number | undefined;

    if (sourceType === "url") {
      const urlResult = await fetchUrlContent(sourceUrl!);

      // If extraction failed, return 422 to trigger paste fallback UI
      if (!urlResult.success || !urlResult.content) {
        return NextResponse.json(
          {
            success: false,
            extractionFailed: true,
            error: urlResult.errorMessage || "Could not extract article content.",
            sourceUrl: sourceUrl,
          },
          { status: 422 }
        );
      }

      sampleContent = urlResult.content;
      extractedWordCount = urlResult.wordCount;
    } else {
      sampleContent = content!;
    }

    const wordCount = extractedWordCount || countWords(sampleContent);

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

    // Analyze the sample and rebuild Voice DNA profile
    try {
      const patterns = await extractWritingPatterns(sampleContent);

      await db
        .update(writingSamples)
        .set({
          extractedPatterns: patterns,
          analyzedAt: new Date(),
        })
        .where(eq(writingSamples.id, sample.id));

      // Rebuild Voice DNA profile to incorporate new sample
      // This merges all writing samples and recalculates the calibration score
      await rebuildVoiceDNA(session.user.id);
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
