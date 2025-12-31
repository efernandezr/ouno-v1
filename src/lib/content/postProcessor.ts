/**
 * Content Post-Processor
 *
 * Processes generated content to extract metadata like title,
 * word count, and estimated read time.
 */

export interface ProcessedContent {
  title: string;
  content: string;
  wordCount: number;
  readTimeMinutes: number;
}

/**
 * Average reading speed in words per minute
 * 200-250 WPM is average for online content
 */
const WORDS_PER_MINUTE = 225;

/**
 * Process generated markdown content to extract metadata
 */
export function processGeneratedContent(rawContent: string): ProcessedContent {
  const content = rawContent.trim();

  // Extract title from first H1 heading
  const title = extractTitle(content);

  // Calculate word count (excluding markdown syntax)
  const wordCount = calculateWordCount(content);

  // Calculate read time
  const readTimeMinutes = calculateReadTime(wordCount);

  return {
    title,
    content,
    wordCount,
    readTimeMinutes,
  };
}

/**
 * Extract title from markdown content
 * Looks for first H1 heading (# Title)
 */
export function extractTitle(content: string): string {
  // Try to find H1 heading
  const h1Match = content.match(/^#\s+(.+?)(?:\n|$)/m);
  if (h1Match?.[1]) {
    return h1Match[1].trim();
  }

  // Fallback: use first line if it looks like a title
  const firstLine = content.split("\n")[0]?.trim();
  if (firstLine && firstLine.length < 100 && !firstLine.startsWith("-")) {
    return firstLine;
  }

  // Default title
  return "Untitled";
}

/**
 * Calculate word count excluding markdown syntax
 */
export function calculateWordCount(content: string): number {
  // Remove markdown syntax elements
  const text = content
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    .replace(/`[^`]+`/g, "")
    // Remove images
    .replace(/!\[.*?\]\(.*?\)/g, "")
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove HTML tags
    .replace(/<[^>]+>/g, "")
    // Remove headings markers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic markers
    .replace(/[*_]{1,3}/g, "")
    // Remove blockquote markers
    .replace(/^>\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "");

  // Split by whitespace and filter empty strings
  const words = text.split(/\s+/).filter((word) => word.length > 0);

  return words.length;
}

/**
 * Calculate estimated read time in minutes
 */
export function calculateReadTime(wordCount: number): number {
  const minutes = wordCount / WORDS_PER_MINUTE;
  // Round up to nearest minute, minimum 1 minute
  return Math.max(1, Math.ceil(minutes));
}

/**
 * Clean up generated content
 * - Ensures proper markdown formatting
 * - Removes any instruction artifacts
 * - Normalizes whitespace
 */
export function cleanupContent(content: string): string {
  let cleaned = content;

  // Remove any artifacts that might be left from LLM instructions
  cleaned = cleaned.replace(/^(Here's|Here is|Below is).*?:\s*\n+/i, "");

  // Remove trailing instruction-like content
  cleaned = cleaned.replace(/\n+---\s*\n*(Note:|Remember:|Important:)[\s\S]*$/i, "");

  // Normalize multiple consecutive blank lines to single blank line
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Ensure content starts with title (add one if missing)
  if (!cleaned.match(/^#\s/)) {
    const firstLine = cleaned.split("\n")[0];
    if (firstLine && !firstLine.startsWith("#")) {
      // Check if first line looks like a title
      if (firstLine.length < 100 && !firstLine.startsWith("-") && !firstLine.startsWith("*")) {
        cleaned = `# ${firstLine}\n\n${cleaned.substring(firstLine.length).trim()}`;
      }
    }
  }

  return cleaned.trim();
}

/**
 * Generate a suggested title from transcript
 * Used as fallback when generation doesn't produce a good title
 */
export function generateSuggestedTitle(transcript: string): string {
  // Take first significant sentence
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 10);

  const firstSentence = sentences[0]?.trim();
  if (!firstSentence) {
    return "My Thoughts";
  }

  // Truncate if too long
  if (firstSentence.length > 60) {
    const words = firstSentence.split(" ").slice(0, 8);
    return words.join(" ") + "...";
  }

  return firstSentence;
}

/**
 * Extract key quotes from content for preview/sharing
 */
export function extractKeyQuotes(content: string, count: number = 3): string[] {
  const quotes: string[] = [];

  // Find blockquotes
  const blockquotes = content.match(/^>\s+(.+)$/gm);
  if (blockquotes) {
    quotes.push(...blockquotes.map((q) => q.replace(/^>\s+/, "").trim()));
  }

  // Find bold text (likely emphasized points)
  const boldText = content.match(/\*\*([^*]+)\*\*/g);
  if (boldText) {
    quotes.push(...boldText.map((b) => b.replace(/\*\*/g, "").trim()));
  }

  // Deduplicate and limit
  const unique = [...new Set(quotes)];
  return unique.slice(0, count);
}

/**
 * Create a preview/excerpt from content
 */
export function createExcerpt(content: string, maxLength: number = 200): string {
  // Remove title
  let text = content.replace(/^#\s+.+?\n+/, "");

  // Remove markdown formatting
  text = text
    .replace(/[*_#]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s+/gm, "")
    .trim();

  // Get first paragraph
  const firstPara = text.split("\n\n")[0] || text;

  if (firstPara.length <= maxLength) {
    return firstPara;
  }

  // Truncate at word boundary
  const truncated = firstPara.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  return truncated.substring(0, lastSpace) + "...";
}
