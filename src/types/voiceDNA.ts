/**
 * Voice DNA Profile Types
 *
 * These types represent the extracted patterns from a user's voice recordings
 * and writing samples that define their unique "Voice DNA".
 */

export interface SpokenPatterns {
  vocabulary: {
    frequentWords: string[];
    uniquePhrases: string[];
    fillerWords: string[];
    preserveFillers: boolean;
  };
  rhythm: {
    avgSentenceLength: "short" | "medium" | "long";
    paceVariation: "consistent" | "varied" | "dynamic";
    pausePatterns: "frequent" | "moderate" | "rare";
  };
  rhetoric: {
    usesQuestions: boolean;
    usesAnalogies: boolean;
    storytellingStyle: "anecdotal" | "hypothetical" | "personal" | "mixed";
  };
  enthusiasm: {
    topicsThatExcite: string[];
    emphasisPatterns: string[];
    energyBaseline: number; // 0-1
  };
}

export interface WrittenPatterns {
  structurePreference: "linear" | "modular" | "narrative";
  formality: number; // 0-1, where 0 is casual and 1 is formal
  paragraphLength: "short" | "medium" | "long";
  openingStyle: "hook" | "context" | "question" | "story";
  closingStyle: "cta" | "summary" | "question" | "reflection";
}

export interface TonalAttributes {
  warmth: number; // 0-1
  authority: number; // 0-1
  humor: number; // 0-1
  directness: number; // 0-1
  empathy: number; // 0-1
}

export interface ReferentInfluence {
  id: string;
  name: string;
  weight: number; // 0-50 (user voice is always >= 50)
  activeTraits: string[];
}

export interface ReferentInfluences {
  userWeight: number; // 50-100
  referents: ReferentInfluence[];
}

export interface LearnedRule {
  type: "prefer" | "avoid" | "adjust";
  content: string;
  confidence: number; // 0-1
  sourceCount: number;
}

export interface VoiceDNA {
  spokenPatterns: SpokenPatterns | null;
  writtenPatterns: WrittenPatterns | null;
  tonalAttributes: TonalAttributes | null;
  referentInfluences: ReferentInfluences | null;
  learnedRules: LearnedRule[];
  calibrationScore: number; // 0-100
}

export interface ExtractedWritingPatterns {
  vocabularyComplexity: number; // 0-1
  sentenceVariation: number; // 0-1
  paragraphStructure: "short" | "medium" | "long";
  toneIndicators: string[];
  keyPhrases: string[];
}
