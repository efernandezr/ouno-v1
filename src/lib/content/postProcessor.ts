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
 * Patterns that indicate LLM preambles to remove
 */
const PREAMBLE_PATTERNS = [
  // Opening phrases with colon
  /^(Here's|Here is|Below is|I've created|I've written|I have created|I have written|This is|Based on|Following|Using|After analyzing|Drawing from|After reviewing).*?:\s*\n+/i,
  // Offers to help
  /^(Let me|I'll|I will|Allow me to|I'd be happy to|I'm happy to|I can).*?\n+/i,
  // Enthusiasm starters
  /^(Great!|Sure!|Absolutely!|Of course!|Certainly!|Perfect!|Wonderful!).*?\n+/i,
  // Transcript references
  /^(Based on|From|Using|According to) (your|the) (transcript|recording|voice|session|input|words|thoughts).*?\n+/i,
  /^(Your|The) (transcript|recording|voice session|input) (shows|indicates|reveals|contains|demonstrates|expresses).*?\n+/i,
  // Meta comments about the content
  /^(This article|This post|This piece|The following|What follows).*?\n+/i,
];

/**
 * Prompt section headers that may leak into output
 */
const LEAKED_SECTION_PATTERNS = [
  /^##?\s*(CRITICAL|OUTPUT|VOICE DNA|REFERENT|BLENDING|CONTENT STRUCTURE|ENTHUSIASM)\s*(INSTRUCTION|REQUIREMENTS|PROFILE|INFLUENCES|RULES|MAP)?s?\s*\n/gim,
  /^##?\s*(THEIR ORIGINAL|EXPANDED THOUGHTS|STRUCTURE PREFERENCES|SPEAKING STYLE|TONAL PROFILE|FOR SHORT TRANSCRIPTS)\s*.*?\n/gim,
  /^##?\s*(Note:|PRIMARY|INFLUENCE|STYLE|FORMAT:)\s*.*?\n/gim,
];

/**
 * Patterns that indicate raw transcript leaked into output
 */
const TRANSCRIPT_LEAK_PATTERNS = [
  /^"""[\s\S]*?"""\s*\n/gm, // Triple-quoted blocks
  /^Q:\s+.*?\nA:\s+"""/gm, // Q&A format from follow-ups
];

/**
 * Trailing artifacts to remove
 */
const TRAILING_PATTERNS = [
  /\n+---\s*\n*(Note:|Remember:|Important:|This article|I hope|Feel free|Let me know|If you)[\s\S]*$/i,
  /\n+\[.*?(generated|created|written|based on|by Claude|by AI).*?\]\s*$/i,
  /\n+\*+.*?(generated|created|written|based on).*?\*+\s*$/i,
  /\n+_{3,}\s*\n*[\s\S]{0,200}$/i, // Trailing underscores with short text
];

/**
 * Clean up generated content
 * - Removes ALL instruction artifacts and preambles
 * - Removes leaked prompt section headers
 * - Removes transcript leak patterns
 * - Normalizes whitespace
 * - Detects and removes repetitive content
 */
export function cleanupContent(content: string): string {
  let cleaned = content;

  // 1. Remove preambles (apply multiple times for nested preambles)
  for (let i = 0; i < 3; i++) {
    for (const pattern of PREAMBLE_PATTERNS) {
      cleaned = cleaned.replace(pattern, "");
    }
    cleaned = cleaned.trim();
  }

  // 2. Remove leaked prompt sections
  for (const pattern of LEAKED_SECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // 3. Remove transcript leak patterns
  for (const pattern of TRANSCRIPT_LEAK_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // 4. Remove trailing artifacts
  for (const pattern of TRAILING_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // 5. Normalize whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.replace(/^\s*\n+/, "");

  // 6. Remove repetitive content
  cleaned = removeRepetitiveContent(cleaned);

  // 7. Ensure proper title formatting
  cleaned = ensureProperTitle(cleaned);

  return cleaned.trim();
}

/**
 * Ensure content starts with a proper H1 title
 */
function ensureProperTitle(content: string): string {
  // Check if content already starts with proper H1
  if (content.match(/^#\s+[^#\n]/)) {
    return content;
  }

  // Check if first line could be a title
  const lines = content.split("\n");
  const firstLine = lines[0]?.trim();

  if (
    firstLine &&
    firstLine.length < 100 &&
    !firstLine.startsWith("-") &&
    !firstLine.startsWith("*") &&
    !firstLine.startsWith(">") &&
    !firstLine.startsWith("##")
  ) {
    // Promote first line to H1
    return `# ${firstLine}\n\n${lines.slice(1).join("\n").trim()}`;
  }

  return content;
}

/**
 * Detect and remove repetitive content patterns
 * This catches when the LLM generates the same sentence/paragraph multiple times
 */
function removeRepetitiveContent(content: string): string {
  // Split into paragraphs
  const paragraphs = content.split(/\n\n+/);
  const seenParagraphs = new Set<string>();
  const uniqueParagraphs: string[] = [];

  for (const para of paragraphs) {
    // Normalize for comparison (lowercase, remove extra whitespace)
    const normalized = para.toLowerCase().replace(/\s+/g, " ").trim();

    // Skip empty paragraphs
    if (!normalized) continue;

    // Check for exact duplicates
    if (seenParagraphs.has(normalized)) {
      continue; // Skip duplicate
    }

    // Check for near-duplicates (80% similarity)
    let isDuplicate = false;
    for (const seen of seenParagraphs) {
      if (calculateSimilarity(normalized, seen) > 0.8) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seenParagraphs.add(normalized);
      uniqueParagraphs.push(para);
    }
  }

  return uniqueParagraphs.join("\n\n");
}

/**
 * Calculate similarity between two strings (Jaccard similarity on words)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
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
