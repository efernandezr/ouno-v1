/**
 * Pre-built Referent Creator Profiles
 *
 * These profiles represent well-known content creators whose writing styles
 * users can blend with their own voice.
 */

import type { ReferentStyleProfile } from "@/types/referent";

export const sethGodinProfile: ReferentStyleProfile = {
  id: "ref-seth-godin",
  name: "Seth Godin",
  slug: "seth-godin",
  description: "Marketing legend known for short, punchy, provocative insights",
  keyCharacteristics: [
    "Extremely short paragraphs (often 1-2 sentences)",
    "Provocative opening statements",
    "Challenges conventional thinking",
    "Memorable one-liners",
    "Avoids jargon completely",
  ],
  linguisticPatterns: {
    sentenceLength: "short",
    vocabularyLevel: "accessible",
    signaturePhrases: ["Here's the thing", "It turns out", "The question is", "Perhaps"],
  },
  tonalAttributes: {
    warmth: 0.6,
    authority: 0.9,
    humor: 0.2,
    directness: 0.95,
    empathy: 0.7,
  },
  promptGuidance: `Apply Seth Godin's influence by:
- Breaking into very short paragraphs (1-3 sentences max)
- Starting with a statement that challenges assumptions
- Using simple, everyday words (no jargon)
- Including a memorable, quotable insight
- Keeping sentences punchy and direct
- Ending with a thought-provoking question or call to action`,
};

export const annHandleyProfile: ReferentStyleProfile = {
  id: "ref-ann-handley",
  name: "Ann Handley",
  slug: "ann-handley",
  description: "Content marketing expert with a warm, conversational, and witty style",
  keyCharacteristics: [
    "Conversational and approachable tone",
    "Clever wordplay and wit",
    "Personal anecdotes and stories",
    "Practical, actionable advice",
    "Self-deprecating humor",
  ],
  linguisticPatterns: {
    sentenceLength: "medium",
    vocabularyLevel: "accessible",
    signaturePhrases: ["Here's the thing", "The truth is", "Let me explain", "Think about it"],
  },
  tonalAttributes: {
    warmth: 0.95,
    authority: 0.7,
    humor: 0.8,
    directness: 0.6,
    empathy: 0.9,
  },
  promptGuidance: `Apply Ann Handley's influence by:
- Writing like you're talking to a friend over coffee
- Adding light humor and clever observations
- Including relatable personal stories
- Making content practical and immediately useful
- Using contractions and casual language
- Adding moments of self-deprecating wit`,
};

export const garyVeeProfile: ReferentStyleProfile = {
  id: "ref-gary-vee",
  name: "Gary Vaynerchuk",
  slug: "gary-vee",
  description: "Entrepreneur known for direct, urgent, high-energy content",
  keyCharacteristics: [
    "Highly energetic and passionate",
    "Direct and sometimes blunt",
    "Urgency and motivation-focused",
    "Street-smart wisdom",
    "Authentic and unfiltered",
  ],
  linguisticPatterns: {
    sentenceLength: "short",
    vocabularyLevel: "accessible",
    signaturePhrases: ["Look", "Here's the deal", "You need to understand", "Stop making excuses"],
  },
  tonalAttributes: {
    warmth: 0.6,
    authority: 0.85,
    humor: 0.4,
    directness: 1.0,
    empathy: 0.7,
  },
  promptGuidance: `Apply Gary Vaynerchuk's influence by:
- Writing with high energy and urgency
- Being direct—don't beat around the bush
- Including motivational elements without being cheesy
- Using everyday language, even informal
- Adding passion and conviction to key points
- Cutting through excuses and getting to action`,
};

export const jamesClearProfile: ReferentStyleProfile = {
  id: "ref-james-clear",
  name: "James Clear",
  slug: "james-clear",
  description: "Habits expert known for clear, structured, evidence-based writing",
  keyCharacteristics: [
    "Crystal clear explanations",
    "Well-researched with citations",
    "Logical structure and flow",
    "Practical frameworks",
    "Calm, measured tone",
  ],
  linguisticPatterns: {
    sentenceLength: "medium",
    vocabularyLevel: "moderate",
    signaturePhrases: ["Here's the key insight", "Research shows", "The lesson is", "In other words"],
  },
  tonalAttributes: {
    warmth: 0.7,
    authority: 0.85,
    humor: 0.2,
    directness: 0.8,
    empathy: 0.6,
  },
  promptGuidance: `Apply James Clear's influence by:
- Using clear, logical structure with obvious transitions
- Including evidence or examples to back up points
- Creating memorable frameworks or mental models
- Writing in a calm, measured, authoritative tone
- Breaking complex ideas into simple, digestible steps
- Ending sections with clear takeaways`,
};

export const allReferentProfiles = [
  sethGodinProfile,
  annHandleyProfile,
  garyVeeProfile,
  jamesClearProfile,
];

export function getReferentProfile(idOrSlug: string): ReferentStyleProfile | undefined {
  return allReferentProfiles.find(
    (profile) => profile.id === idOrSlug || profile.slug === idOrSlug
  );
}
