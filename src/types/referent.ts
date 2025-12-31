/**
 * Referent Creator Types
 *
 * Referent creators are writing style influences (like Seth Godin, Ann Handley)
 * that users can blend with their own voice.
 */

import type { TonalAttributes } from "./voiceDNA";

export interface LinguisticPatterns {
  sentenceLength: "short" | "medium" | "long";
  vocabularyLevel: "accessible" | "moderate" | "sophisticated";
  signaturePhrases: string[];
}

export interface ReferentStyleProfile {
  id: string;
  name: string;
  slug: string;
  description: string;
  keyCharacteristics: string[];
  linguisticPatterns: LinguisticPatterns;
  tonalAttributes: TonalAttributes;
  promptGuidance: string;
}

export interface ReferentCreator {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  styleProfile: ReferentStyleProfile;
  isPreBuilt: boolean;
  createdByUserId: string | null;
  createdAt: Date;
}
