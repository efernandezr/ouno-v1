/**
 * Generated Content Types
 */

import type { VoiceDNA, ReferentInfluences } from "./voiceDNA";

export type ContentStatus = "draft" | "final" | "published";

export interface GeneratedContent {
  id: string;
  userId: string;
  sessionId: string;
  title: string;
  content: string; // Markdown content
  wordCount: number;
  readTimeMinutes: number;
  status: ContentStatus;
  voiceDNASnapshot: VoiceDNA | null;
  referentInfluencesUsed: ReferentInfluences | null;
  version: number;
  parentVersionId: string | null;
  modelUsed: string | null;
  generationTimeMs: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentRefinement {
  refinementType: "voice" | "text";
  instruction: string;
  previousContent: string;
  newContent: string;
  changes: string[];
}
