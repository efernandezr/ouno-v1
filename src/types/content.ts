/**
 * Generated Content Types
 */

import type { VoiceDNA, ReferentInfluences } from "./voiceDNA";

export type ContentStatus = "draft" | "final" | "published";

export type ContentTemplate = "blog_post" | "listicle" | "narrative";

export const CONTENT_TEMPLATES: Record<
  ContentTemplate,
  { name: string; description: string; icon: string }
> = {
  blog_post: {
    name: "Standard Article",
    description: "Traditional blog format with sections and flow",
    icon: "FileText",
  },
  listicle: {
    name: "Key Points",
    description: "Numbered list of takeaways and insights",
    icon: "ListOrdered",
  },
  narrative: {
    name: "Personal Story",
    description: "First-person narrative without rigid structure",
    icon: "BookOpen",
  },
};

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
  template: ContentTemplate;
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
