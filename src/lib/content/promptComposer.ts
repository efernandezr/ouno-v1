/**
 * Content Generation Prompt Composer
 *
 * Builds prompts that preserve the user's authentic voice while
 * applying referent influences as "seasoning".
 */

import { getReferentProfile } from "@/lib/referents/profiles";
import type { EnthusiasmAnalysis, ContentOutline, FollowUpResponse } from "@/types/session";
import type { VoiceDNA, ReferentInfluences, TonalAttributes } from "@/types/voiceDNA";

export interface GenerationContext {
  voiceDNA: VoiceDNA;
  originalTranscript: string;
  enthusiasmAnalysis: EnthusiasmAnalysis | null;
  contentOutline: ContentOutline | null;
  followUpResponses: FollowUpResponse[];
  followUpQuestions?: Array<{ id: string; question: string }>;
}

/**
 * Build the complete generation prompt with Voice DNA injection
 */
export function buildGenerationPrompt(context: GenerationContext): string {
  const {
    voiceDNA,
    originalTranscript,
    enthusiasmAnalysis,
    contentOutline,
    followUpResponses,
    followUpQuestions,
  } = context;

  const sections: string[] = [];

  // Critical instruction
  sections.push(buildCriticalInstruction());

  // Voice DNA profile
  sections.push(buildVoiceDNASection(voiceDNA));

  // Referent influences (if any)
  if (voiceDNA.referentInfluences?.referents.length) {
    sections.push(buildReferentSection(voiceDNA.referentInfluences));
  }

  // Original content
  sections.push(buildContentSection(originalTranscript, followUpResponses, followUpQuestions));

  // Enthusiasm map
  if (enthusiasmAnalysis) {
    sections.push(buildEnthusiasmSection(enthusiasmAnalysis));
  }

  // Structure guidance
  sections.push(buildStructureSection(contentOutline, voiceDNA));

  // Output requirements
  sections.push(buildOutputRequirements(voiceDNA));

  return sections.join("\n\n");
}

/**
 * System prompt for content generation
 */
export function getGenerationSystemPrompt(): string {
  return `You are a skilled content writer who transforms spoken thoughts into polished written content while preserving the speaker's authentic voice.

Your role is to structure and polish, NOT to add your own ideas or change the speaker's perspective. The spoken words ARE the content—your job is to organize them into readable, engaging prose.

Key principles:
1. PRESERVE their unique vocabulary and phrases
2. MAINTAIN their natural rhythm and pacing
3. CAPTURE their enthusiasm where they showed it
4. STRUCTURE content logically while keeping their flow
5. NEVER add opinions, facts, or ideas they didn't express
6. KEEP their tone—don't make casual speakers sound formal

You write in markdown format with clear headings, well-structured paragraphs, and emphasis where the speaker showed enthusiasm.`;
}

function buildCriticalInstruction(): string {
  return `## CRITICAL INSTRUCTION

This is NOT about writing "in a style"—this is about capturing this SPECIFIC PERSON's voice.
Their spoken words ARE the content. Your job is to structure and polish, not to add your own ideas.

Rules:
- Use THEIR vocabulary—preserve their unique phrases and expressions
- Match THEIR rhythm—if they speak in short bursts, write in short paragraphs
- Capture THEIR enthusiasm—the moments they got excited are the highlights
- Keep THEIR perspective—don't add opinions or facts they didn't mention
- Maintain THEIR tone—if they're casual, stay casual; if they're formal, stay formal`;
}

function buildVoiceDNASection(voiceDNA: VoiceDNA): string {
  const parts: string[] = ["## VOICE DNA PROFILE"];

  // Spoken patterns
  if (voiceDNA.spokenPatterns) {
    const sp = voiceDNA.spokenPatterns;
    parts.push(`### Speaking Style
- Sentence length: ${sp.rhythm.avgSentenceLength}
- Pace: ${sp.rhythm.paceVariation}
- Uses questions: ${sp.rhetoric.usesQuestions ? "Yes" : "No"}
- Uses analogies: ${sp.rhetoric.usesAnalogies ? "Yes" : "No"}
- Storytelling style: ${sp.rhetoric.storytellingStyle}`);

    if (sp.vocabulary.uniquePhrases.length > 0) {
      parts.push(`
### Signature Phrases to Preserve
${sp.vocabulary.uniquePhrases.map((p) => `- "${p}"`).join("\n")}`);
    }

    if (sp.vocabulary.frequentWords.length > 0) {
      parts.push(`
### Frequently Used Words
${sp.vocabulary.frequentWords.slice(0, 10).join(", ")}`);
    }

    if (sp.enthusiasm.topicsThatExcite.length > 0) {
      parts.push(`
### Topics That Excite Them
${sp.enthusiasm.topicsThatExcite.map((t) => `- ${t}`).join("\n")}`);
    }
  }

  // Written patterns
  if (voiceDNA.writtenPatterns) {
    const wp = voiceDNA.writtenPatterns;
    parts.push(`
### Writing Preferences
- Structure: ${wp.structurePreference}
- Formality: ${formatFormality(wp.formality)}
- Paragraph length: ${wp.paragraphLength}
- Opening style: ${wp.openingStyle}
- Closing style: ${wp.closingStyle}`);
  }

  // Tonal attributes
  if (voiceDNA.tonalAttributes) {
    parts.push(`
### Tonal Profile
${formatTonalAttributes(voiceDNA.tonalAttributes)}`);
  }

  // Learned rules
  if (voiceDNA.learnedRules.length > 0) {
    const highConfidenceRules = voiceDNA.learnedRules.filter((r) => r.confidence > 0.6);
    if (highConfidenceRules.length > 0) {
      parts.push(`
### Style Rules (from calibration)
${highConfidenceRules
  .map((r) => `- ${r.type.toUpperCase()}: ${r.content}`)
  .join("\n")}`);
    }
  }

  return parts.join("\n");
}

function buildReferentSection(influences: ReferentInfluences): string {
  const parts: string[] = ["## REFERENT INFLUENCES"];

  const userWeight = Math.max(50, influences.userWeight);
  parts.push(`PRIMARY (${userWeight}%): User's authentic voice
- This is the foundation—always preserve their natural patterns
- User's words and phrases take priority`);

  for (const ref of influences.referents) {
    if (ref.weight > 0) {
      const profile = getReferentProfile(ref.id);
      if (profile) {
        parts.push(`
INFLUENCE (${ref.weight}%): ${ref.name}
${profile.promptGuidance}
${ref.activeTraits.length > 0 ? `Apply especially: ${ref.activeTraits.join(", ")}` : ""}`);
      }
    }
  }

  parts.push(`
## BLENDING RULES
1. User voice is ALWAYS the foundation
2. Referent influences are "seasoning"—enhance, don't override
3. When styles conflict, favor user's natural patterns
4. Never lose the user's unique phrases or vocabulary`);

  return parts.join("\n");
}

function buildContentSection(
  transcript: string,
  followUpResponses: FollowUpResponse[],
  followUpQuestions?: Array<{ id: string; question: string }>
): string {
  const parts: string[] = [];

  parts.push(`## THEIR ORIGINAL WORDS
"""
${transcript}
"""`);

  // Add follow-up responses with context
  const answeredResponses = followUpResponses.filter(
    (r) => r.responseType !== "skip" && r.content
  );

  if (answeredResponses.length > 0) {
    parts.push(`
## EXPANDED THOUGHTS (from follow-up questions)
${answeredResponses
  .map((r) => {
    const question = followUpQuestions?.find((q) => q.id === r.questionId);
    return `Q: ${question?.question || "Follow-up question"}
A: """
${r.content}
"""`;
  })
  .join("\n\n")}`);
  }

  return parts.join("\n\n");
}

function buildEnthusiasmSection(analysis: EnthusiasmAnalysis): string {
  const parts: string[] = ["## ENTHUSIASM MAP"];

  parts.push(`Overall energy level: ${(analysis.overallEnergy * 100).toFixed(0)}%`);

  if (analysis.peakMoments.length > 0) {
    parts.push(`
### Peak Moments (emphasize these)
${analysis.peakMoments
  .map(
    (pm) => `- "${pm.text}"
  → ${pm.reason}
  → Use as: ${pm.useAs}`
  )
  .join("\n")}`);
  }

  const highEnergySegments = analysis.segments.filter((s) => s.energyScore > 0.6);
  if (highEnergySegments.length > 0) {
    parts.push(`
### High-Energy Sections
${highEnergySegments
  .map(
    (s) =>
      `- "${s.text.substring(0, 100)}${s.text.length > 100 ? "..." : ""}" (${(s.energyScore * 100).toFixed(0)}% energy)`
  )
  .join("\n")}`);
  }

  return parts.join("\n");
}

function buildStructureSection(outline: ContentOutline | null, voiceDNA: VoiceDNA): string {
  const parts: string[] = ["## CONTENT STRUCTURE"];

  if (outline) {
    parts.push(`Suggested title: "${outline.suggestedTitle}"
Target length: ~${outline.estimatedWordCount} words`);

    if (outline.sections.length > 0) {
      parts.push(`
### Suggested Sections
${outline.sections
  .map(
    (s, i) =>
      `${i + 1}. ${s.type.toUpperCase()}: ${s.title}
   Key quotes: ${s.keyQuotes.slice(0, 2).map((q) => `"${q}"`).join(", ") || "None specified"}`
  )
  .join("\n")}`);
    }
  }

  // Add structure guidance based on Voice DNA preferences
  const wp = voiceDNA.writtenPatterns;
  if (wp) {
    parts.push(`
### Structure Preferences
- Use ${wp.structurePreference} organization
- Start with: ${getOpeningGuidance(wp.openingStyle)}
- End with: ${getClosingGuidance(wp.closingStyle)}
- Paragraphs: ${wp.paragraphLength} length preferred`);
  }

  return parts.join("\n");
}

function buildOutputRequirements(voiceDNA: VoiceDNA): string {
  const formality = voiceDNA.writtenPatterns?.formality ?? 0.5;
  const formalityNote =
    formality < 0.3
      ? "casual, conversational"
      : formality > 0.7
        ? "polished, professional"
        : "balanced, approachable";

  return `## OUTPUT REQUIREMENTS

1. Write in markdown format
2. Start with a compelling title (# Heading)
3. Use ## for major sections
4. Keep their authentic voice—tone should be ${formalityNote}
5. Emphasize high-enthusiasm moments with **bold** or > blockquotes
6. Include their actual phrases—don't paraphrase unique expressions
7. Target ${voiceDNA.writtenPatterns?.paragraphLength || "medium"} paragraphs
8. End according to their preferred style

IMPORTANT:
- Do NOT add facts, statistics, or examples they didn't mention
- Do NOT change their perspective or opinions
- Do NOT make the content more formal than their natural speech
- Do NOT add generic filler or transitions—use their words`;
}

// Helper functions

function formatFormality(formality: number): string {
  if (formality < 0.3) return "Casual/Conversational";
  if (formality < 0.5) return "Friendly/Approachable";
  if (formality < 0.7) return "Professional";
  return "Formal";
}

function formatTonalAttributes(attrs: TonalAttributes): string {
  const lines: string[] = [];
  if (attrs.warmth > 0.6) lines.push("- Warm and friendly");
  if (attrs.warmth < 0.4) lines.push("- Professional/Reserved");
  if (attrs.authority > 0.7) lines.push("- Confident and authoritative");
  if (attrs.humor > 0.5) lines.push("- Incorporates humor");
  if (attrs.directness > 0.7) lines.push("- Very direct and to the point");
  if (attrs.directness < 0.3) lines.push("- Thoughtful and nuanced");
  if (attrs.empathy > 0.7) lines.push("- Empathetic and understanding");

  return lines.length > 0 ? lines.join("\n") : "- Balanced, moderate tone";
}

function getOpeningGuidance(style: string): string {
  const guidance: Record<string, string> = {
    hook: "a provocative statement or surprising insight",
    context: "setting the scene and providing background",
    question: "a thought-provoking question",
    story: "a personal anecdote or narrative",
  };
  return guidance[style] || "a compelling opening";
}

function getClosingGuidance(style: string): string {
  const guidance: Record<string, string> = {
    cta: "a clear call to action",
    summary: "a summary of key points",
    question: "a reflective question for the reader",
    reflection: "a personal reflection or insight",
  };
  return guidance[style] || "a memorable conclusion";
}
