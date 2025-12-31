/**
 * Follow-up Question Generator
 *
 * Generates contextual follow-up questions based on transcripts
 * to draw out more content from users.
 */

import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { EnthusiasmAnalysis } from "@/types/session";

interface GenerateQuestionsParams {
  transcript: string;
  enthusiasmAnalysis?: EnthusiasmAnalysis | null;
  context: "onboarding" | "session";
  existingResponses?: string[];
}

const SYSTEM_PROMPT = `You are helping draw out better content from a speaker. Based on their initial thoughts, generate follow-up questions that will help them share more meaningful content.

Your questions should:
1. CLARIFY: Ask about anything ambiguous or underdeveloped
2. EXPAND: Request more detail on interesting points
3. EXAMPLE: Ask for specific stories, examples, or anecdotes
4. CHALLENGE: Gently probe assumptions to strengthen arguments

Rules:
- Questions should be conversational, not interrogative
- Focus on high-enthusiasm segments if provided
- Avoid yes/no questions
- Each question should unlock 30-60 seconds of new content
- Be encouraging and curious in tone
- Use "you" and "your" to make it personal`;

const ONBOARDING_CONTEXT = `This is an onboarding flow where we're learning about the user for the first time. Focus on understanding:
- Their expertise and passion areas
- Their unique perspective and experiences
- Their target audience
- Their content creation goals`;

const SESSION_CONTEXT = `This is a content creation session. Focus on:
- Drawing out more examples and stories
- Clarifying key points for the reader
- Getting specific details that make content compelling
- Exploring implications and applications of their ideas`;

/**
 * Generate follow-up questions based on a transcript
 */
export async function generateFollowUpQuestions({
  transcript,
  enthusiasmAnalysis,
  context,
  existingResponses = [],
}: GenerateQuestionsParams): Promise<string[]> {
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";

  // Build the prompt
  let prompt = `${SYSTEM_PROMPT}

${context === "onboarding" ? ONBOARDING_CONTEXT : SESSION_CONTEXT}

## USER'S TRANSCRIPT:
${transcript}`;

  // Add enthusiasm analysis if available
  if (enthusiasmAnalysis?.peakMoments && enthusiasmAnalysis.peakMoments.length > 0) {
    prompt += `

## HIGH-ENTHUSIASM MOMENTS (ask about these!):
${enthusiasmAnalysis.peakMoments
  .map((m) => `- "${m.text}" (reason: ${m.reason})`)
  .join("\n")}`;
  }

  // Add existing responses to avoid repetition
  if (existingResponses.length > 0) {
    prompt += `

## ALREADY DISCUSSED (don't repeat these topics):
${existingResponses.map((r) => `- ${r.slice(0, 100)}...`).join("\n")}`;
  }

  prompt += `

Generate ${context === "onboarding" ? "3-4" : "2-4"} follow-up questions. Return ONLY the questions, one per line, no numbering or formatting.`;

  try {
    const { text } = await generateText({
      model: openrouter(model),
      prompt,
      maxOutputTokens: 500,
      temperature: 0.7,
    });

    // Parse questions from response
    const questions = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 10 && line.endsWith("?"))
      .slice(0, 4);

    // Ensure we have at least some questions
    if (questions.length === 0) {
      return getDefaultQuestions(context);
    }

    return questions;
  } catch (error) {
    console.error("Error generating follow-up questions:", error);
    return getDefaultQuestions(context);
  }
}

/**
 * Default questions if generation fails
 */
function getDefaultQuestions(context: "onboarding" | "session"): string[] {
  if (context === "onboarding") {
    return [
      "What specific experience or moment made you passionate about this topic?",
      "Who do you most want to help with your content, and what challenges do they face?",
      "What's something you believe about your topic that most people get wrong?",
    ];
  }

  return [
    "Can you share a specific example or story that illustrates this point?",
    "What would you tell someone who's just starting to learn about this?",
    "What's the most common misconception about this topic?",
  ];
}

/**
 * Generate calibration prompts for Voice DNA refinement
 */
export async function generateCalibrationPrompt(
  roundNumber: number,
  previousTopics: string[] = []
): Promise<string> {
  const defaultPrompt = "Write a short opening paragraph about why your favorite aspect of [your main topic] matters to people.";
  const prompts = [
    defaultPrompt,
    "Imagine you're explaining a key concept from your expertise to a friend over coffee. What would you say?",
    "What's a common mistake people make in your field, and how would you advise them to avoid it?",
  ];

  // Use predefined prompts for first 3 rounds
  if (roundNumber <= 3) {
    return prompts[roundNumber - 1] ?? defaultPrompt;
  }

  // For later rounds, generate custom prompts based on topics
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";

  try {
    const { text } = await generateText({
      model: openrouter(model),
      prompt: `Generate a single writing prompt for someone who writes about: ${previousTopics.join(", ")}.

The prompt should:
- Ask them to write 2-3 paragraphs
- Focus on a practical or thought-provoking angle
- Be specific enough to guide them but open enough for creativity

Return ONLY the prompt text, nothing else.`,
      maxOutputTokens: 150,
      temperature: 0.8,
    });

    return text.trim();
  } catch {
    return prompts[roundNumber % prompts.length] ?? defaultPrompt;
  }
}
