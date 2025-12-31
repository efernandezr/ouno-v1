import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  index,
  uuid,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import type { CalibrationInsight } from "@/types/calibration";
import type { ReferentStyleProfile } from "@/types/referent";
import type {
  EnthusiasmAnalysis,
  ContentOutline,
  FollowUpQuestion,
  FollowUpResponse,
} from "@/types/session";
import type { WordTimestamp } from "@/types/voice";
import type {
  SpokenPatterns,
  WrittenPatterns,
  TonalAttributes,
  ReferentInfluences,
  LearnedRule,
  ExtractedWritingPatterns,
  VoiceDNA,
} from "@/types/voiceDNA";

// IMPORTANT! ID fields should ALWAYS use UUID types, EXCEPT the BetterAuth tables.

// ============================================
// Enums
// ============================================

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const onboardingStatusEnum = pgEnum("onboarding_status", [
  "not_started",
  "voice_intro",
  "follow_ups",
  "samples",
  "complete",
]);

export const sessionModeEnum = pgEnum("session_mode", ["quick", "guided"]);

export const sessionStatusEnum = pgEnum("session_status", [
  "recording",
  "transcribing",
  "analyzing",
  "follow_ups",
  "generating",
  "complete",
  "error",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "final",
  "published",
]);

export const responseTypeEnum = pgEnum("response_type", [
  "voice",
  "text",
  "skip",
]);

// ============================================
// BetterAuth Tables (keep text IDs)
// ============================================

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    role: userRoleEnum("role").default("user").notNull(),
    onboardingStatus: onboardingStatusEnum("onboarding_status")
      .default("not_started")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("user_email_idx").on(table.email)]
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_user_id_idx").on(table.userId),
    index("session_token_idx").on(table.token),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    index("account_provider_account_idx").on(table.providerId, table.accountId),
  ]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ============================================
// VoiceDNA Tables
// ============================================

/**
 * Voice DNA Profiles
 * Stores the extracted voice patterns and preferences for each user
 */
export const voiceDNAProfiles = pgTable(
  "voice_dna_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    spokenPatterns: jsonb("spoken_patterns").$type<SpokenPatterns>(),
    writtenPatterns: jsonb("written_patterns").$type<WrittenPatterns>(),
    tonalAttributes: jsonb("tonal_attributes").$type<TonalAttributes>(),
    referentInfluences: jsonb("referent_influences").$type<ReferentInfluences>(),
    learnedRules: jsonb("learned_rules").$type<LearnedRule[]>().default([]),
    calibrationScore: integer("calibration_score").default(0),
    calibrationRoundsCompleted: integer("calibration_rounds_completed").default(0),
    voiceSessionsAnalyzed: integer("voice_sessions_analyzed").default(0),
    writingSamplesAnalyzed: integer("writing_samples_analyzed").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("voice_dna_user_id_idx").on(table.userId)]
);

/**
 * Voice Sessions
 * Records of voice recording sessions with transcripts and analysis
 */
export const voiceSessions = pgTable(
  "voice_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    mode: sessionModeEnum("mode").notNull(),
    status: sessionStatusEnum("status").notNull().default("recording"),
    transcript: text("transcript"),
    durationSeconds: integer("duration_seconds"),
    wordTimestamps: jsonb("word_timestamps").$type<WordTimestamp[]>(),
    enthusiasmAnalysis: jsonb("enthusiasm_analysis").$type<EnthusiasmAnalysis>(),
    contentOutline: jsonb("content_outline").$type<ContentOutline>(),
    followUpQuestions: jsonb("follow_up_questions")
      .$type<FollowUpQuestion[]>()
      .default([]),
    followUpResponses: jsonb("follow_up_responses")
      .$type<FollowUpResponse[]>()
      .default([]),
    generatedContentId: uuid("generated_content_id"),
    title: text("title"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("voice_sessions_user_id_idx").on(table.userId),
    index("voice_sessions_status_idx").on(table.status),
    index("voice_sessions_created_at_idx").on(table.createdAt),
  ]
);

/**
 * Generated Content
 * Blog posts and articles generated from voice sessions
 */
export const generatedContent = pgTable(
  "generated_content",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: uuid("session_id")
      .references(() => voiceSessions.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    wordCount: integer("word_count").notNull(),
    readTimeMinutes: integer("read_time_minutes").notNull(),
    status: contentStatusEnum("status").default("draft").notNull(),
    voiceDNASnapshot: jsonb("voice_dna_snapshot").$type<VoiceDNA>(),
    referentInfluencesUsed: jsonb("referent_influences_used").$type<ReferentInfluences>(),
    version: integer("version").default(1).notNull(),
    parentVersionId: uuid("parent_version_id"),
    modelUsed: text("model_used"),
    generationTimeMs: integer("generation_time_ms"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("generated_content_user_id_idx").on(table.userId),
    index("generated_content_session_id_idx").on(table.sessionId),
    index("generated_content_status_idx").on(table.status),
    index("generated_content_created_at_idx").on(table.createdAt),
  ]
);

/**
 * Writing Samples
 * User-provided writing samples for Voice DNA training
 */
export const writingSamples = pgTable(
  "writing_samples",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    sourceType: text("source_type").notNull(), // 'paste', 'url', 'file'
    sourceUrl: text("source_url"),
    fileName: text("file_name"),
    content: text("content").notNull(),
    wordCount: integer("word_count").notNull(),
    extractedPatterns: jsonb("extracted_patterns").$type<ExtractedWritingPatterns>(),
    analyzedAt: timestamp("analyzed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("writing_samples_user_id_idx").on(table.userId)]
);

/**
 * Referent Creators
 * Pre-built and custom writing style influence profiles
 */
export const referentCreators = pgTable(
  "referent_creators",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    styleProfile: jsonb("style_profile").$type<ReferentStyleProfile>().notNull(),
    isPreBuilt: boolean("is_pre_built").default(true).notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("referent_creators_slug_idx").on(table.slug),
    index("referent_creators_is_pre_built_idx").on(table.isPreBuilt),
  ]
);

/**
 * Calibration Rounds
 * User calibration sessions to improve Voice DNA accuracy
 */
export const calibrationRounds = pgTable(
  "calibration_rounds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    roundNumber: integer("round_number").notNull(),
    promptText: text("prompt_text").notNull(),
    userResponseTranscript: text("user_response_transcript"),
    userResponseType: responseTypeEnum("user_response_type"),
    generatedSample: text("generated_sample"),
    rating: integer("rating"), // 1-5
    feedbackTranscript: text("feedback_transcript"),
    feedbackText: text("feedback_text"),
    insightsExtracted: jsonb("insights_extracted").$type<CalibrationInsight[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("calibration_rounds_user_id_idx").on(table.userId),
    index("calibration_rounds_round_number_idx").on(table.roundNumber),
  ]
);
