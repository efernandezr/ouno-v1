/**
 * Follow-up Question Generation Prompts
 *
 * Prompts for generating Socratic-style follow-up questions
 * that draw out more content from the user's initial recording.
 */

import { randomUUID } from "crypto";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { EnthusiasmAnalysis, FollowUpQuestion } from "@/types/session";

const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";

/**
 * System prompt for generating follow-up questions
 */
const FOLLOW_UP_SYSTEM_PROMPT = `You are helping draw out better content from a speaker. Based on their initial thoughts, generate follow-up questions that will:

1. CLARIFY: Ask about anything ambiguous or underdeveloped
2. EXPAND: Request more detail on interesting points
3. EXAMPLE: Ask for specific stories, examples, or anecdotes
4. CHALLENGE: Gently probe assumptions to strengthen arguments

Rules:
- Questions should be conversational, not interrogative
- Focus on the high-enthusiasm segments (provided below)
- Avoid yes/no questions
- Each question should unlock 30-60 seconds of new content
- Generate 2-4 questions depending on the richness of the content
- Questions should feel natural, like a curious friend asking

For each question, also provide:
- questionType: one of "clarify", "expand", "example", or "challenge"
- context: brief explanation of why you're asking this
- relatedTranscriptSegment: the part of the transcript this relates to (if any)`;

/**
 * Build the user prompt with transcript and enthusiasm data
 */
function buildUserPrompt(
  transcript: string,
  enthusiasmAnalysis: EnthusiasmAnalysis | null,
  mode: "quick" | "guided"
): string {
  const peakMomentsText =
    enthusiasmAnalysis?.peakMoments
      .map(
        (pm) =>
          `- "${pm.text}" (${pm.reason}, could be used as: ${pm.useAs})`
      )
      .join("\n") || "No peak moments detected";

  const highEnergySegments =
    enthusiasmAnalysis?.segments
      .filter((s) => s.energyScore > 0.5)
      .map((s) => `- "${s.text}" (energy: ${(s.energyScore * 100).toFixed(0)}%)`)
      .join("\n") || "No high-energy segments detected";

  const questionCount = mode === "quick" ? "2-3" : "3-4";

  return `TRANSCRIPT:
"""
${transcript}
"""

HIGH-ENTHUSIASM MOMENTS (focus questions here):
${peakMomentsText}

HIGH-ENERGY SEGMENTS:
${highEnergySegments}

OVERALL ENERGY: ${((enthusiasmAnalysis?.overallEnergy || 0.5) * 100).toFixed(0)}%

Generate ${questionCount} follow-up questions to draw out more valuable content.

Return ONLY a JSON array with this structure:
[
  {
    "questionType": "clarify" | "expand" | "example" | "challenge",
    "question": "the follow-up question",
    "context": "why you're asking this",
    "relatedTranscriptSegment": "relevant part of transcript or null"
  }
]`;
}

/**
 * Generate follow-up questions based on transcript and enthusiasm analysis
 */
export async function generateFollowUpQuestions(
  transcript: string,
  enthusiasmAnalysis: EnthusiasmAnalysis | null,
  mode: "quick" | "guided" = "guided"
): Promise<FollowUpQuestion[]> {
  if (!transcript || transcript.trim().length < 30) {
    // Return a default question for very short transcripts
    return [
      {
        id: randomUUID(),
        questionType: "expand",
        question:
          "Could you tell me more about what you're thinking? I'd love to hear your main point in more detail.",
        context: "The initial recording was brief, so we need more content.",
      },
    ];
  }

  try {
    const { text } = await generateText({
      model: openrouter(MODEL),
      system: FOLLOW_UP_SYSTEM_PROMPT,
      prompt: buildUserPrompt(transcript, enthusiasmAnalysis, mode),
      maxOutputTokens: 1000,
      temperature: 0.7, // Slightly creative for varied questions
    });

    // Parse the JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON array from response:", text);
      return getDefaultQuestions(transcript);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      questionType: FollowUpQuestion["questionType"];
      question: string;
      context: string;
      relatedTranscriptSegment?: string;
    }>;

    // Validate and add IDs
    return parsed
      .filter(
        (q) =>
          q.question &&
          q.questionType &&
          ["clarify", "expand", "example", "challenge"].includes(q.questionType)
      )
      .map((q): FollowUpQuestion => {
        const question: FollowUpQuestion = {
          id: randomUUID(),
          questionType: q.questionType,
          question: q.question,
          context: q.context || "Follow-up to explore your thoughts further",
        };
        if (q.relatedTranscriptSegment) {
          question.relatedTranscriptSegment = q.relatedTranscriptSegment;
        }
        return question;
      });
  } catch (error) {
    console.error("Error generating follow-up questions:", error);
    return getDefaultQuestions(transcript);
  }
}

/**
 * Get default questions when LLM fails
 */
function getDefaultQuestions(transcript: string): FollowUpQuestion[] {
  const questions: FollowUpQuestion[] = [
    {
      id: randomUUID(),
      questionType: "example",
      question:
        "Can you share a specific example or story that illustrates your main point?",
      context: "Stories and examples make content more engaging and memorable.",
    },
    {
      id: randomUUID(),
      questionType: "expand",
      question:
        "What's the most important thing you want people to take away from this?",
      context: "Clarifying the key takeaway helps structure the final content.",
    },
  ];

  // Add a third question for longer transcripts
  if (transcript.length > 500) {
    questions.push({
      id: randomUUID(),
      questionType: "challenge",
      question:
        "Is there a common misconception about this topic that you'd like to address?",
      context: "Challenging assumptions creates more compelling content.",
    });
  }

  return questions;
}

/**
 * Generate a single follow-up question based on a specific segment
 */
export async function generateTargetedQuestion(
  segment: string,
  questionType: FollowUpQuestion["questionType"]
): Promise<FollowUpQuestion> {
  const typePrompts = {
    clarify: "What exactly do you mean by this? Help me understand better.",
    expand: "This is interesting - can you tell me more about it?",
    example: "Do you have a specific example or story about this?",
    challenge: "What would you say to someone who disagrees with this?",
  };

  try {
    const { text } = await generateText({
      model: openrouter(MODEL),
      prompt: `Given this transcript segment: "${segment}"

Generate a conversational ${questionType} question to draw out more detail.
The question should feel natural, like a curious friend asking.

Return ONLY the question text, no quotes or extra formatting.`,
      maxOutputTokens: 100,
      temperature: 0.7,
    });

    return {
      id: randomUUID(),
      questionType,
      question: text.trim() || typePrompts[questionType],
      context: `Targeted ${questionType} question for deeper exploration`,
      relatedTranscriptSegment: segment,
    };
  } catch {
    return {
      id: randomUUID(),
      questionType,
      question: typePrompts[questionType],
      context: `Fallback ${questionType} question`,
      relatedTranscriptSegment: segment,
    };
  }
}
