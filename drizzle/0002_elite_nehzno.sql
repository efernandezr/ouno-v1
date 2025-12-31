CREATE TYPE "public"."content_status" AS ENUM('draft', 'final', 'published');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('not_started', 'voice_intro', 'follow_ups', 'samples', 'complete');--> statement-breakpoint
CREATE TYPE "public"."response_type" AS ENUM('voice', 'text', 'skip');--> statement-breakpoint
CREATE TYPE "public"."session_mode" AS ENUM('quick', 'guided');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('recording', 'transcribing', 'analyzing', 'follow_ups', 'generating', 'complete', 'error');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "calibration_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"round_number" integer NOT NULL,
	"prompt_text" text NOT NULL,
	"user_response_transcript" text,
	"user_response_type" "response_type",
	"generated_sample" text,
	"rating" integer,
	"feedback_transcript" text,
	"feedback_text" text,
	"insights_extracted" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"session_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"word_count" integer NOT NULL,
	"read_time_minutes" integer NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"voice_dna_snapshot" jsonb,
	"referent_influences_used" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_version_id" uuid,
	"model_used" text,
	"generation_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referent_creators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"style_profile" jsonb NOT NULL,
	"is_pre_built" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referent_creators_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "voice_dna_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"spoken_patterns" jsonb,
	"written_patterns" jsonb,
	"tonal_attributes" jsonb,
	"referent_influences" jsonb,
	"learned_rules" jsonb DEFAULT '[]'::jsonb,
	"calibration_score" integer DEFAULT 0,
	"calibration_rounds_completed" integer DEFAULT 0,
	"voice_sessions_analyzed" integer DEFAULT 0,
	"writing_samples_analyzed" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "voice_dna_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "voice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"mode" "session_mode" NOT NULL,
	"status" "session_status" DEFAULT 'recording' NOT NULL,
	"transcript" text,
	"duration_seconds" integer,
	"word_timestamps" jsonb,
	"enthusiasm_analysis" jsonb,
	"content_outline" jsonb,
	"follow_up_questions" jsonb DEFAULT '[]'::jsonb,
	"follow_up_responses" jsonb DEFAULT '[]'::jsonb,
	"generated_content_id" uuid,
	"title" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_url" text,
	"file_name" text,
	"content" text NOT NULL,
	"word_count" integer NOT NULL,
	"extracted_patterns" jsonb,
	"analyzed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarding_status" "onboarding_status" DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "calibration_rounds" ADD CONSTRAINT "calibration_rounds_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_session_id_voice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."voice_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referent_creators" ADD CONSTRAINT "referent_creators_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_dna_profiles" ADD CONSTRAINT "voice_dna_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_sessions" ADD CONSTRAINT "voice_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_samples" ADD CONSTRAINT "writing_samples_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calibration_rounds_user_id_idx" ON "calibration_rounds" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calibration_rounds_round_number_idx" ON "calibration_rounds" USING btree ("round_number");--> statement-breakpoint
CREATE INDEX "generated_content_user_id_idx" ON "generated_content" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "generated_content_session_id_idx" ON "generated_content" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "generated_content_status_idx" ON "generated_content" USING btree ("status");--> statement-breakpoint
CREATE INDEX "generated_content_created_at_idx" ON "generated_content" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "referent_creators_slug_idx" ON "referent_creators" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "referent_creators_is_pre_built_idx" ON "referent_creators" USING btree ("is_pre_built");--> statement-breakpoint
CREATE INDEX "voice_dna_user_id_idx" ON "voice_dna_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "voice_sessions_user_id_idx" ON "voice_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "voice_sessions_status_idx" ON "voice_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "voice_sessions_created_at_idx" ON "voice_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "writing_samples_user_id_idx" ON "writing_samples" USING btree ("user_id");