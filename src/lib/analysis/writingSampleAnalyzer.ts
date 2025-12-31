/**
 * Writing Sample Analyzer
 *
 * Extracts writing patterns from text samples to build the WrittenPatterns
 * component of Voice DNA.
 */

import type { ExtractedWritingPatterns } from "@/types/voiceDNA";

/**
 * Calculate vocabulary complexity based on word length and variety
 */
function calculateVocabularyComplexity(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  if (words.length === 0) return 0.5;

  // Calculate average word length
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

  // Calculate vocabulary variety (unique words / total words)
  const uniqueWords = new Set(words);
  const variety = uniqueWords.size / words.length;

  // Complex words (> 8 characters) ratio
  const complexWords = words.filter((w) => w.length > 8).length;
  const complexRatio = complexWords / words.length;

  // Combine factors (weighted average)
  const lengthScore = Math.min(avgWordLength / 8, 1);
  const complexScore = (lengthScore * 0.3 + variety * 0.4 + complexRatio * 0.3);

  return Math.min(Math.max(complexScore, 0), 1);
}

/**
 * Calculate sentence variation based on length distribution
 */
function calculateSentenceVariation(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length < 2) return 0.5;

  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avgLength = lengths.reduce((sum, l) => sum + l, 0) / lengths.length;

  // Calculate standard deviation
  const variance =
    lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) /
    lengths.length;
  const stdDev = Math.sqrt(variance);

  // Higher std dev = more variation (normalize to 0-1)
  const variation = Math.min(stdDev / 15, 1);

  return variation;
}

/**
 * Analyze paragraph structure to determine typical length
 */
function analyzeParagraphStructure(
  text: string
): "short" | "medium" | "long" {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 0) return "medium";

  const avgWords =
    paragraphs.reduce(
      (sum, p) => sum + p.trim().split(/\s+/).length,
      0
    ) / paragraphs.length;

  if (avgWords < 50) return "short";
  if (avgWords > 150) return "long";
  return "medium";
}

/**
 * Extract tone indicators from the text
 */
function extractToneIndicators(text: string): string[] {
  const indicators: string[] = [];
  const lowerText = text.toLowerCase();

  // Check for conversational markers
  if (
    lowerText.includes("you") ||
    lowerText.includes("we") ||
    lowerText.includes("let's")
  ) {
    indicators.push("conversational");
  }

  // Check for formal markers
  if (
    lowerText.includes("therefore") ||
    lowerText.includes("furthermore") ||
    lowerText.includes("consequently")
  ) {
    indicators.push("formal");
  }

  // Check for enthusiasm markers
  if (text.includes("!") || lowerText.includes("amazing") || lowerText.includes("exciting")) {
    indicators.push("enthusiastic");
  }

  // Check for authority markers
  if (
    lowerText.includes("research shows") ||
    lowerText.includes("studies indicate") ||
    lowerText.includes("evidence suggests")
  ) {
    indicators.push("authoritative");
  }

  // Check for storytelling markers
  if (
    lowerText.includes("once upon") ||
    lowerText.includes("i remember") ||
    lowerText.includes("last year") ||
    lowerText.includes("one day")
  ) {
    indicators.push("narrative");
  }

  // Check for analytical markers
  if (
    lowerText.includes("first") ||
    lowerText.includes("second") ||
    lowerText.includes("finally") ||
    lowerText.includes("in conclusion")
  ) {
    indicators.push("structured");
  }

  // Check for empathy markers
  if (
    lowerText.includes("i understand") ||
    lowerText.includes("i know how") ||
    lowerText.includes("we've all been")
  ) {
    indicators.push("empathetic");
  }

  // Check for humor markers
  if (
    text.includes(";)") ||
    text.includes(":)") ||
    lowerText.includes("joke") ||
    lowerText.includes("funny")
  ) {
    indicators.push("humorous");
  }

  return indicators.length > 0 ? indicators : ["neutral"];
}

/**
 * Extract key phrases and patterns from text
 */
function extractKeyPhrases(text: string): string[] {
  const phrases: string[] = [];

  // Common transition/signal phrases to look for
  const patternMatches = [
    // Opening patterns
    { regex: /^(let me|here's|the thing is|think about)/im, phrase: "direct opening" },
    { regex: /^(have you ever|what if|imagine)/im, phrase: "question opening" },
    { regex: /^(i was|last week|one time)/im, phrase: "story opening" },

    // Structural patterns
    { regex: /first[,.]|second[,.]|third[,.]/i, phrase: "numbered structure" },
    { regex: /on the other hand|however|but here's/i, phrase: "contrast usage" },
    { regex: /for example|for instance|consider this/i, phrase: "examples usage" },

    // Closing patterns
    { regex: /(so what|what now|the takeaway)/i, phrase: "action closing" },
    { regex: /(to summarize|in short|bottom line)/i, phrase: "summary closing" },
    { regex: /\?$/m, phrase: "question closing" },
  ];

  for (const pattern of patternMatches) {
    if (pattern.regex.test(text)) {
      phrases.push(pattern.phrase);
    }
  }

  // Extract repeated phrases (3+ words that appear multiple times)
  const words = text.toLowerCase().split(/\s+/);
  const threeGrams = new Map<string, number>();

  for (let i = 0; i < words.length - 2; i++) {
    const gram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    if (gram.length > 10) {
      threeGrams.set(gram, (threeGrams.get(gram) || 0) + 1);
    }
  }

  // Add repeated phrases
  for (const [gram, count] of threeGrams) {
    if (count >= 2) {
      phrases.push(`repeats: "${gram}"`);
    }
  }

  return phrases.slice(0, 10); // Limit to top 10
}

/**
 * Main function to extract writing patterns from text
 */
export async function extractWritingPatterns(
  text: string
): Promise<ExtractedWritingPatterns> {
  // Clean the text
  const cleanedText = text
    .replace(/\s+/g, " ")
    .trim();

  return {
    vocabularyComplexity: calculateVocabularyComplexity(cleanedText),
    sentenceVariation: calculateSentenceVariation(cleanedText),
    paragraphStructure: analyzeParagraphStructure(text), // Use original for paragraph detection
    toneIndicators: extractToneIndicators(cleanedText),
    keyPhrases: extractKeyPhrases(cleanedText),
  };
}

/**
 * Merge multiple writing sample analyses into one
 */
export function mergeWritingPatterns(
  patterns: ExtractedWritingPatterns[]
): ExtractedWritingPatterns {
  if (patterns.length === 0) {
    return {
      vocabularyComplexity: 0.5,
      sentenceVariation: 0.5,
      paragraphStructure: "medium",
      toneIndicators: [],
      keyPhrases: [],
    };
  }

  if (patterns.length === 1 && patterns[0]) {
    return patterns[0];
  }

  // Average the numeric values
  const avgComplexity =
    patterns.reduce((sum, p) => sum + p.vocabularyComplexity, 0) / patterns.length;
  const avgVariation =
    patterns.reduce((sum, p) => sum + p.sentenceVariation, 0) / patterns.length;

  // Most common paragraph structure
  const structureCounts = { short: 0, medium: 0, long: 0 };
  patterns.forEach((p) => structureCounts[p.paragraphStructure]++);
  const paragraphStructure = (
    Object.entries(structureCounts) as [
      "short" | "medium" | "long",
      number,
    ][]
  ).reduce((a, b) => (b[1] > a[1] ? b : a))[0];

  // Merge and deduplicate tone indicators and key phrases
  const allTones = patterns.flatMap((p) => p.toneIndicators);
  const uniqueTones = [...new Set(allTones)];

  const allPhrases = patterns.flatMap((p) => p.keyPhrases);
  const uniquePhrases = [...new Set(allPhrases)];

  return {
    vocabularyComplexity: avgComplexity,
    sentenceVariation: avgVariation,
    paragraphStructure,
    toneIndicators: uniqueTones,
    keyPhrases: uniquePhrases.slice(0, 15),
  };
}
