# Implementation Plan: VoiceDNA MVP

## Overview

Build a voice-first AI content creation platform that captures authentic thinking through speech and transforms it into polished blog articles. The implementation is split into 9 phases (0-8), each delivering testable functionality.

**Tech Stack:**
- Next.js 16 (App Router, React 19, TypeScript)
- PostgreSQL with Drizzle ORM (Neon)
- BetterAuth (Google OAuth + Email/Password)
- OpenAI Whisper API (transcription)
- OpenRouter (LLM for analysis/generation)
- Tailwind CSS + shadcn/ui
- Mobile-first design

---

## Phase 0: Boilerplate Cleanup ✅ COMPLETE

Remove generic boilerplate elements and prepare codebase for VoiceDNA development.

### Tasks

- [x] Delete boilerplate demo components and pages
- [x] Update landing page with VoiceDNA branding
- [x] Update site header with VoiceDNA name and Mic icon
- [x] Clean footer (remove GitHub stars, update text)
- [x] Simplify dashboard to minimal state
- [x] Update root layout metadata for VoiceDNA

### Technical Details

**Files to DELETE:**
```
src/components/setup-checklist.tsx
src/components/starter-prompt-modal.tsx
src/components/ui/github-stars.tsx
src/app/api/diagnostics/route.ts
src/app/chat/  (entire directory - page.tsx, error.tsx, loading.tsx)
```

**Files to MODIFY:**

`src/app/page.tsx` - Replace entire content with:
```tsx
// Minimal VoiceDNA landing page
// - Hero with "VoiceDNA" title and tagline
// - CTA buttons: "Get Started" (→ /register) and "Sign In" (→ /login)
// - Brief value proposition section
```

`src/components/site-header.tsx`:
- Change `"Starter Kit"` → `"VoiceDNA"`
- Change `Bot` icon → `Mic` icon from lucide-react
- Update navigation links

`src/components/site-footer.tsx`:
- Remove `GitHubStars` import and usage
- Remove Leon van Zyl credits
- Simple "© 2025 VoiceDNA" footer

`src/app/dashboard/page.tsx`:
- Remove "AI Chat" link card
- Remove "Protected Page" messaging
- Simple "Welcome to VoiceDNA" + placeholder

`src/app/layout.tsx`:
- Update metadata: `title: "VoiceDNA"`, `description: "Voice-first AI content creation"`

---

## Phase 1: Database & Core Infrastructure ✅ COMPLETE

Extend database schema and set up core Voice DNA data structures.

### Tasks

- [x] Add VoiceDNA tables to Drizzle schema [complex]
  - [x] Add enum types for statuses
  - [x] Add voiceDNAProfiles table
  - [x] Add voiceSessions table
  - [x] Add followUpResponses table
  - [x] Add generatedContent table
  - [x] Add writingSamples table
  - [x] Add referentCreators table
  - [x] Add calibrationRounds table
- [x] Create TypeScript type definitions
- [x] Run database migrations
- [x] Seed 4 referent creator profiles

### Technical Details

**Enums to add to `src/lib/schema.ts`:**
```typescript
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const onboardingStatusEnum = pgEnum('onboarding_status', [
  'not_started', 'voice_intro', 'follow_ups', 'samples', 'complete'
]);
export const sessionModeEnum = pgEnum('session_mode', ['quick', 'guided']);
export const sessionStatusEnum = pgEnum('session_status', [
  'recording', 'transcribing', 'analyzing', 'follow_ups', 'generating', 'complete', 'error'
]);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'final', 'published']);
export const responseTypeEnum = pgEnum('response_type', ['voice', 'text', 'skip']);
```

**Tables to add:**

```typescript
// voiceDNAProfiles
export const voiceDNAProfiles = pgTable('voice_dna_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  spokenPatterns: jsonb('spoken_patterns').$type<SpokenPatterns>(),
  writtenPatterns: jsonb('written_patterns').$type<WrittenPatterns>(),
  tonalAttributes: jsonb('tonal_attributes').$type<TonalAttributes>(),
  referentInfluences: jsonb('referent_influences').$type<ReferentInfluences>(),
  learnedRules: jsonb('learned_rules').$type<LearnedRule[]>().default([]),
  calibrationScore: integer('calibration_score').default(0),
  calibrationRoundsCompleted: integer('calibration_rounds_completed').default(0),
  voiceSessionsAnalyzed: integer('voice_sessions_analyzed').default(0),
  writingSamplesAnalyzed: integer('writing_samples_analyzed').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// voiceSessions
export const voiceSessions = pgTable('voice_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  mode: sessionModeEnum('mode').notNull(),
  status: sessionStatusEnum('status').notNull().default('recording'),
  transcript: text('transcript'),
  durationSeconds: integer('duration_seconds'),
  wordTimestamps: jsonb('word_timestamps').$type<WordTimestamp[]>(),
  enthusiasmAnalysis: jsonb('enthusiasm_analysis').$type<EnthusiasmAnalysis>(),
  contentOutline: jsonb('content_outline').$type<ContentOutline>(),
  followUpQuestions: jsonb('follow_up_questions').$type<FollowUpQuestion[]>().default([]),
  followUpResponses: jsonb('follow_up_responses').$type<FollowUpResponse[]>().default([]),
  generatedContentId: uuid('generated_content_id'),
  title: text('title'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// generatedContent
export const generatedContent = pgTable('generated_content', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionId: uuid('session_id').references(() => voiceSessions.id).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  wordCount: integer('word_count').notNull(),
  readTimeMinutes: integer('read_time_minutes').notNull(),
  status: contentStatusEnum('status').default('draft').notNull(),
  voiceDNASnapshot: jsonb('voice_dna_snapshot').$type<VoiceDNA>(),
  referentInfluencesUsed: jsonb('referent_influences_used').$type<ReferentInfluences>(),
  version: integer('version').default(1).notNull(),
  parentVersionId: uuid('parent_version_id'),
  modelUsed: text('model_used'),
  generationTimeMs: integer('generation_time_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// writingSamples
export const writingSamples = pgTable('writing_samples', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sourceType: text('source_type').notNull(), // 'paste', 'url', 'file'
  sourceUrl: text('source_url'),
  fileName: text('file_name'),
  content: text('content').notNull(),
  wordCount: integer('word_count').notNull(),
  extractedPatterns: jsonb('extracted_patterns').$type<ExtractedWritingPatterns>(),
  analyzedAt: timestamp('analyzed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// referentCreators
export const referentCreators = pgTable('referent_creators', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  styleProfile: jsonb('style_profile').$type<ReferentStyleProfile>().notNull(),
  isPreBuilt: boolean('is_pre_built').default(true).notNull(),
  createdByUserId: text('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// calibrationRounds
export const calibrationRounds = pgTable('calibration_rounds', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roundNumber: integer('round_number').notNull(),
  promptText: text('prompt_text').notNull(),
  userResponseTranscript: text('user_response_transcript'),
  userResponseType: responseTypeEnum('user_response_type'),
  generatedSample: text('generated_sample'),
  rating: integer('rating'),
  feedbackTranscript: text('feedback_transcript'),
  feedbackText: text('feedback_text'),
  insightsExtracted: jsonb('insights_extracted').$type<CalibrationInsight[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Type definitions to create in `src/types/`:**

`src/types/voice.ts`:
```typescript
export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscribeResponse {
  transcript: string;
  durationSeconds: number;
  wordTimestamps: WordTimestamp[];
  language: string;
}
```

`src/types/voiceDNA.ts`:
```typescript
export interface SpokenPatterns {
  vocabulary: {
    frequentWords: string[];
    uniquePhrases: string[];
    fillerWords: string[];
    preserveFillers: boolean;
  };
  rhythm: {
    avgSentenceLength: 'short' | 'medium' | 'long';
    paceVariation: 'consistent' | 'varied' | 'dynamic';
    pausePatterns: 'frequent' | 'moderate' | 'rare';
  };
  rhetoric: {
    usesQuestions: boolean;
    usesAnalogies: boolean;
    storytellingStyle: 'anecdotal' | 'hypothetical' | 'personal' | 'mixed';
  };
  enthusiasm: {
    topicsThatExcite: string[];
    emphasisPatterns: string[];
    energyBaseline: number;
  };
}

export interface WrittenPatterns {
  structurePreference: 'linear' | 'modular' | 'narrative';
  formality: number;
  paragraphLength: 'short' | 'medium' | 'long';
  openingStyle: 'hook' | 'context' | 'question' | 'story';
  closingStyle: 'cta' | 'summary' | 'question' | 'reflection';
}

export interface TonalAttributes {
  warmth: number;
  authority: number;
  humor: number;
  directness: number;
  empathy: number;
}

export interface ReferentInfluences {
  userWeight: number;
  referents: Array<{
    id: string;
    name: string;
    weight: number;
    activeTraits: string[];
  }>;
}

export interface LearnedRule {
  type: 'prefer' | 'avoid' | 'adjust';
  content: string;
  confidence: number;
  sourceCount: number;
}
```

**CLI Commands:**
```bash
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Verify tables created
```

**Seed script for referent creators:** Create `src/lib/db/seed-referents.ts` with Seth Godin, Ann Handley, Gary Vee, James Clear profiles.

---

## Phase 2: Voice Recording & Transcription ✅ COMPLETE

Core voice capture with real-time visualization and Whisper transcription.

### Tasks

- [x] Create VoiceRecorder component with MediaRecorder API
- [x] Create AudioVisualizer component (Canvas waveform)
- [x] Create RecordingControls component (Start/Stop/Pause)
- [x] Create recorder utility library
- [x] Create audio upload API endpoint
- [x] Create Whisper transcription API endpoint [complex]
  - [x] Integrate OpenAI Whisper API
  - [x] Parse word-level timestamps
  - [x] Delete audio after transcription
- [x] Create recording pages (mode selection, quick, guided)
- [x] Add TranscriptPreview component

### Technical Details

**Voice recording components in `src/components/voice/`:**

`VoiceRecorder.tsx` interface:
```typescript
interface VoiceRecorderProps {
  mode: 'quick' | 'guided' | 'follow_up' | 'calibration';
  maxDuration: number; // seconds (300 for guided, 120 for quick)
  prompt?: string;
  onComplete: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

interface RecordingState {
  status: 'idle' | 'recording' | 'paused' | 'processing';
  duration: number;
  audioLevel: number; // 0-100
  error: string | null;
}
```

**Audio format specification:**
- Format: WebM with Opus codec
- Sample Rate: 48kHz
- Channels: Mono
- Bitrate: 32kbps
- Max File Size: ~2.5MB for 5 minutes

**Recorder utility in `src/lib/voice/recorder.ts`:**
```typescript
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private analyser: AnalyserNode | null = null;

  async start(): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): Promise<Blob>;
  getAudioLevel(): number; // For visualizer
}
```

**AudioVisualizer in `src/components/voice/AudioVisualizer.tsx`:**
- Use Canvas API for waveform
- Accept `audioLevel` prop (0-100)
- Animate bars based on audio level
- Show recording indicator (pulsing dot)

**API Routes:**

`POST /api/voice/upload` (`src/app/api/voice/upload/route.ts`):
```typescript
// Request: FormData with audioBlob, sessionId, mode
// Response: { uploadId, status, durationSeconds, fileSizeBytes }
// Store temporarily (Vercel Blob or local in dev)
```

`POST /api/voice/transcribe` (`src/app/api/voice/transcribe/route.ts`):
```typescript
// Request: { uploadId, sessionId }
// Response: { transcript, durationSeconds, wordTimestamps[], language }
```

**Whisper integration in `src/lib/transcription/whisper.ts`:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(audioFile: File): Promise<TranscribeResponse> {
  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  });

  // Parse and return structured response
  // DELETE audio file after successful transcription
}
```

**Recording pages:**
- `/record` - Mode selection (Quick vs Guided)
- `/record/quick` - Quick capture mode (2 min max)
- `/record/guided` - Guided session mode (5 min max)

**Environment variable needed:**
```env
OPENAI_API_KEY=sk-...  # For Whisper transcription
```

---

## Phase 3: Voice DNA Engine & Analysis ✅ COMPLETE

Extract voice patterns and build Voice DNA profiles.

### Tasks

- [x] Create enthusiasm detection algorithm
- [x] Create linguistic analyzer
- [x] Create Voice DNA profile builder
- [x] Create Voice DNA API routes (GET, PATCH, analyze)
- [x] Create VoiceDNACard component
- [x] Create StrengthIndicator component
- [x] Create Voice DNA settings page

### Technical Details

**Enthusiasm detector in `src/lib/analysis/enthusiasmDetector.ts`:**
```typescript
interface EnthusiasmSegment {
  startTime: number;
  endTime: number;
  text: string;
  energyScore: number; // 0-1
  indicators: ('pace_increase' | 'dense_speech' | 'emphasis_words' | 'repetition')[];
}

interface EnthusiasmAnalysis {
  overallEnergy: number;
  segments: EnthusiasmSegment[];
  peakMoments: Array<{
    timestamp: number;
    text: string;
    reason: string;
    useAs: 'hook' | 'key_point' | 'conclusion' | 'quote';
  }>;
}

// Detection logic:
// - wordsPerSecond > 3.0 = excited
// - wordsPerSecond < 2.0 = thoughtful
// - Check for emphasis words: 'really', 'absolutely', 'incredible', 'crucial'
// - Check for repetition (word repeated consecutively)
```

**Linguistic analyzer in `src/lib/analysis/linguisticAnalyzer.ts`:**
```typescript
// Use Claude via OpenRouter to analyze transcript for:
// - Vocabulary complexity and unique phrases
// - Sentence structure patterns
// - Rhetorical devices (questions, analogies)
// - Storytelling patterns
// - Topic preferences
```

**Voice DNA builder in `src/lib/analysis/voiceDNABuilder.ts`:**
```typescript
export async function buildVoiceDNA(
  userId: string,
  transcript: string,
  wordTimestamps: WordTimestamp[],
  existingProfile?: VoiceDNA
): Promise<VoiceDNA> {
  // 1. Run enthusiasm detection
  // 2. Run linguistic analysis
  // 3. Merge with existing profile (weighted average for numerics, union for arrays)
  // 4. Recalculate calibration score
  // 5. Store updated profile
}
```

**API Routes:**

`GET /api/voice-dna` - Get current user's Voice DNA profile
`PATCH /api/voice-dna` - Update Voice DNA settings (referent selections, preferences)
`POST /api/voice/analyze` - Analyze transcript and update Voice DNA

**Components:**

`VoiceDNACard.tsx`:
- Display tonal attributes as radar chart or bars
- Show key phrases
- Show enthusiasm topics
- Calibration score badge

`StrengthIndicator.tsx`:
- Progress bar showing 0-100% calibration
- Color coded (red < 30, yellow 30-70, green > 70)

**Settings page:** `/settings/voice-dna`

---

## Phase 4: Onboarding & Calibration ✅ COMPLETE

Voice-based onboarding flow and calibration system.

### Tasks

- [x] Create onboarding wizard layout
- [x] Create VoiceIntroStep component
- [x] Create FollowUpStep component (onboarding)
- [x] Create SampleUploadStep component
- [x] Create ReferentSelectStep component
- [x] Create writing sample upload API
- [x] Create CalibrationFlow component
- [x] Create calibration API endpoints
- [x] Track and update user onboarding status

### Technical Details

**Onboarding flow in `/onboarding`:**

Step 1 - `VoiceIntroStep.tsx`:
- Prompt: "Tell us about yourself and what you write about (2-3 minutes)"
- Use VoiceRecorder component with mode='guided'
- On complete: transcribe → create initial Voice DNA

Step 2 - `FollowUpStep.tsx`:
- Generate 3-4 questions based on intro
- User responds via voice or text
- Merge responses into Voice DNA

Step 3 - `SampleUploadStep.tsx`:
- Textarea for pasting content
- URL input for fetching article
- File upload for documents
- Optional step (can skip)

Step 4 - `ReferentSelectStep.tsx`:
- Display 4 referent cards
- Select 0-3 referents
- Adjust weights with sliders

**Writing sample API:**

`POST /api/samples`:
```typescript
// Request: { sourceType, content, sourceUrl?, fileName? }
// Process: Extract patterns via Claude, store in writingSamples table
// Response: { sampleId, wordCount, extractedPatterns }
```

**Calibration flow:**

`CalibrationFlow.tsx`:
- 3 rounds of calibration
- Each round:
  1. Show prompt (from calibration prompts list)
  2. User responds via voice
  3. Generate sample content based on current Voice DNA
  4. User rates 1-5 and provides feedback (voice or text)
  5. Extract insights and update Voice DNA

`POST /api/calibration/start`:
- Creates new calibration round
- Returns prompt for this round

`POST /api/calibration/respond`:
- Submit response and rating
- Extract insights
- Update Voice DNA calibration score

**User onboarding tracking:**
- Add `onboardingStatus` field to users table (already in schema)
- Update status after each step
- Redirect to onboarding if status !== 'complete'

---

## Phase 5: Session Flow & Follow-up Questions ✅ COMPLETE

Complete voice session with Socratic follow-up dialogue.

### Tasks

- [x] Create session creation API
- [x] Create session status API
- [x] Create follow-up question generator
- [x] Create follow-up response API
- [x] Create FollowUpQuestion component
- [x] Create VoiceResponse component (session)
- [x] Create TextResponse component
- [x] Create SessionProgress component
- [x] Create session page with follow-up flow

### Technical Details

**Session state machine:**
```
recording → transcribing → analyzing → follow_ups → generating → complete
                                                              ↓
                                                           error
```

**API Routes:**

`POST /api/session/create`:
```typescript
// Request: { mode: 'quick' | 'guided', title?: string }
// Response: { sessionId, mode, status: 'recording' }
```

`GET /api/session/[id]`:
```typescript
// Response: Full session object with current status
```

`POST /api/session/[id]/questions`:
```typescript
// Input: session transcript + enthusiasm analysis
// Generate 2-4 follow-up questions via Claude
// Store questions in session
// Response: { questions: FollowUpQuestion[] }
```

`POST /api/session/[id]/respond`:
```typescript
// Request: { questionId, responseType: 'voice' | 'text' | 'skip', content? }
// If voice: transcribe first
// Store response
// Response: { responseId, nextQuestionId? }
```

**Follow-up prompt in `src/lib/ai/prompts/followUp.ts`:**
```typescript
const generateFollowUpQuestions = `
You are helping draw out better content from a speaker. Based on their initial thoughts,
generate 2-4 follow-up questions that will:

1. CLARIFY: Ask about anything ambiguous or underdeveloped
2. EXPAND: Request more detail on interesting points
3. EXAMPLE: Ask for specific stories, examples, or anecdotes
4. CHALLENGE: Gently probe assumptions to strengthen arguments

Rules:
- Questions should be conversational, not interrogative
- Focus on the high-enthusiasm segments (provided)
- Avoid yes/no questions
- Each question should unlock 30-60 seconds of new content
`;
```

**Components:**

`FollowUpQuestion.tsx`:
- Display question text prominently
- Three action buttons: Voice, Text, Skip
- Question number indicator (2 of 4)

`VoiceResponse.tsx`:
- Wrapper around VoiceRecorder for follow-up responses
- 60-second max duration
- Show question being answered

`TextResponse.tsx`:
- Textarea for typed response
- Submit button
- Character count indicator

`SessionProgress.tsx`:
- Status steps with icons
- Current step highlighted
- Estimated time remaining

**Session page:** `/session/[id]`

---

## Phase 6: Content Generation & Refinement

Generate blog posts from sessions with voice/text refinement.

### Tasks

- [ ] Create content generation API [complex]
  - [ ] Build prompt composer
  - [ ] Integrate Voice DNA into generation
  - [ ] Apply referent blending
  - [ ] Post-process output (word count, read time)
- [ ] Create ContentViewer component
- [ ] Create ContentEditor component
- [ ] Create VoiceRefine component
- [ ] Create RefineChat component
- [ ] Create ContentActions component
- [ ] Create content API routes (GET, PATCH, DELETE, refine)
- [ ] Create content pages (view/edit, library)

### Technical Details

**Content generation API:**

`POST /api/content/generate`:
```typescript
// Input: sessionId
// Process:
// 1. Fetch session with transcript, follow-ups, enthusiasm analysis
// 2. Fetch user's Voice DNA
// 3. Build generation prompt with Voice DNA injection
// 4. Call Claude via OpenRouter
// 5. Post-process (extract title, calculate word count, read time)
// 6. Store in generatedContent table
// Response: { contentId, title, content, wordCount, readTimeMinutes }
```

**Prompt composer in `src/lib/content/promptComposer.ts`:**
```typescript
function buildGenerationPrompt(params: {
  voiceDNA: VoiceDNA;
  contentOutline: ContentOutline;
  originalTranscript: string;
  enthusiasmAnalysis: EnthusiasmAnalysis;
  followUpResponses: FollowUpResponse[];
}): string {
  // Include:
  // - Voice DNA patterns (vocabulary, rhythm, rhetoric)
  // - Tonal attributes
  // - Referent influence instructions
  // - Original transcript
  // - Enthusiasm mapping
  // - Structure outline
}
```

**Generation prompt structure (from PRD):**
```
## CRITICAL INSTRUCTION
This is NOT about writing "in a style"—this is about capturing this SPECIFIC PERSON's voice.
Their spoken words ARE the content. Your job is to structure and polish, not to add your own ideas.

## VOICE DNA PROFILE
[spokenPatterns, writtenPatterns, tonalAttributes]

## REFERENT INFLUENCES
[blending instructions if referents selected]

## THEIR ORIGINAL WORDS
[transcript + follow-up responses]

## ENTHUSIASM MAP
[peak moments to emphasize]

## OUTPUT REQUIREMENTS
1. Write in THEIR voice
2. Use their actual phrases
3. Structure according to outline
4. Emphasize high-enthusiasm moments
5. Do NOT add ideas they didn't express
```

**Content API routes:**

`GET /api/content/[id]` - Get content details
`PATCH /api/content/[id]` - Update content (title, content, status)
`DELETE /api/content/[id]` - Delete content
`POST /api/content/[id]/refine`:
```typescript
// Request: { refinementType: 'voice' | 'text', instruction: string }
// If voice: transcribe instruction first
// Apply refinement via Claude
// Create new version
// Response: { contentId, content, version, changes }
```

**Components:**

`ContentViewer.tsx`:
- Markdown rendering with react-markdown
- Title, word count, read time header
- Status badge (Draft/Final)

`ContentEditor.tsx`:
- Toggle between view and edit mode
- Textarea with markdown
- Auto-save on blur

`VoiceRefine.tsx`:
- VoiceRecorder for refinement instructions
- Examples: "Make opening more punchy", "Add more detail to section 2"

`RefineChat.tsx`:
- Chat-style interface
- Message history
- Text input for refinement requests

`ContentActions.tsx`:
- Copy to clipboard button
- Download as markdown
- Status toggle (Draft → Final)

**Pages:**
- `/content/[id]` - View/edit single content
- `/content/library` - List all user's content with search/filter

---

## Phase 7: Referent System & Blending

Referent creator influence system with blending controls.

### Tasks

- [ ] Create referent profile definitions
- [ ] Create ReferentCard component
- [ ] Create ReferentSelector component
- [ ] Create BlendSliders component
- [ ] Create referent API route
- [ ] Implement blending algorithm
- [ ] Create referent settings page

### Technical Details

**Referent profiles in `src/lib/referents/`:**

`sethGodin.ts`:
```typescript
export const sethGodinProfile: ReferentStyleProfile = {
  id: 'ref-seth-godin',
  name: 'Seth Godin',
  slug: 'seth-godin',
  description: 'Marketing legend known for short, punchy, provocative insights',
  keyCharacteristics: [
    'Extremely short paragraphs (often 1-2 sentences)',
    'Provocative opening statements',
    'Challenges conventional thinking',
    'Memorable one-liners',
    'Avoids jargon completely',
  ],
  linguisticPatterns: {
    sentenceLength: 'short',
    vocabularyLevel: 'accessible',
    signaturePhrases: ["Here's the thing", 'It turns out', 'The question is', 'Perhaps'],
  },
  tonalAttributes: {
    warmth: 0.6,
    authority: 0.9,
    humor: 0.2,
    directness: 0.95,
    empathy: 0.7,
  },
  promptGuidance: `
Apply Seth Godin's influence by:
- Breaking into very short paragraphs (1-3 sentences max)
- Starting with a statement that challenges assumptions
- Using simple, everyday words (no jargon)
- Including a memorable, quotable insight
- Keeping sentences punchy and direct
`,
};
```

Similar profiles for `annHandley.ts`, `garyVee.ts`, `jamesClear.ts`.

**Blending algorithm in `src/lib/referents/blending.ts`:**
```typescript
function applyReferentBlend(
  userVoice: VoiceDNA,
  influences: ReferentInfluences
): string {
  const userWeight = Math.max(50, influences.userWeight);

  let styleGuidance = `
## VOICE BLEND
PRIMARY (${userWeight}%): User's authentic voice
- Use their natural vocabulary: ${userVoice.spokenPatterns.vocabulary.uniquePhrases.join(', ')}
- Match their rhythm: ${userVoice.spokenPatterns.rhythm.avgSentenceLength} sentences
`;

  for (const ref of influences.referents) {
    if (ref.weight > 0) {
      const profile = getReferentProfile(ref.id);
      styleGuidance += `
SECONDARY (${ref.weight}%): ${ref.name}
${profile.promptGuidance}
`;
    }
  }

  styleGuidance += `
## BLENDING RULES
1. User voice is ALWAYS the foundation
2. Referent influences are "seasoning" - enhance, don't override
3. When styles conflict, favor user's natural patterns
`;

  return styleGuidance;
}
```

**Components:**

`ReferentCard.tsx`:
- Profile image
- Name and description
- Key characteristics list
- Tonal attributes visualization
- Select/deselect toggle

`ReferentSelector.tsx`:
- Grid of 4 ReferentCards
- Max 3 selection enforcement
- Selection count indicator

`BlendSliders.tsx`:
- User voice slider (locked at minimum 50%)
- Individual referent sliders
- Total must equal 100%
- Visual percentage indicators

**API Route:**

`GET /api/referents`:
- Return all referent profiles
- Include isPreBuilt flag

**Settings page:** `/settings/referents`

---

## Phase 8: Dashboard & Polish

Complete dashboard, mobile polish, error handling.

### Tasks

- [ ] Update dashboard with VoiceDNA components
- [ ] Create QuickActions component
- [ ] Create RecentContent component
- [ ] Create VoiceDNAStatus component
- [ ] Implement mobile-first optimizations
- [ ] Add bottom navigation bar
- [ ] Implement error handling throughout
- [ ] Add loading states and skeletons
- [ ] Verify dark mode across all pages
- [ ] Add accessibility improvements

### Technical Details

**Dashboard components:**

`QuickActions.tsx`:
- Large "Quick Capture" button (< 2 min)
- Large "Guided Session" button (2-5 min)
- Thumb-friendly sizing for mobile
- Link to `/record/quick` and `/record/guided`

`RecentContent.tsx`:
- List of recent generated content
- Title, status badge, word count, date
- "See all" link to `/content/library`
- Max 5 items on dashboard

`VoiceDNAStatus.tsx`:
- Calibration score with StrengthIndicator
- "Complete Setup" CTA if not fully calibrated
- Quick stats (sessions analyzed, samples)

**Mobile optimizations:**
- Large touch targets (min 44x44px)
- Bottom navigation bar with: Home, Record, Library, Settings
- Thumb zone friendly layouts
- No hover-dependent interactions
- Responsive grids (1 col mobile, 2+ col desktop)

**Error handling:**
- API error responses with codes (AUTH_001, VOICE_001, etc.)
- Toast notifications for errors using Sonner
- Retry buttons for transient failures
- Clear error messages (not technical jargon)

**Loading states:**
- Skeleton components for cards and lists
- Spinner for processing states
- Progress indicators for multi-step operations

**Accessibility:**
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly content order

**Dark mode verification:**
- Check all components with dark mode toggle
- Ensure sufficient contrast
- Fix any hardcoded colors

---

## Environment Variables Summary

```env
# Database (already configured)
POSTGRES_URL=postgresql://...

# Auth (already configured)
BETTER_AUTH_SECRET=32-char-random-string
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AI - OpenRouter (already configured)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-sonnet-4  # or preferred model

# AI - OpenAI (need to add for Whisper)
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## File Structure Overview

```
src/
├── app/
│   ├── (auth)/                    # Auth routes (keep)
│   ├── api/
│   │   ├── auth/                  # Better Auth (keep)
│   │   ├── voice/
│   │   │   ├── upload/route.ts
│   │   │   ├── transcribe/route.ts
│   │   │   └── analyze/route.ts
│   │   ├── session/
│   │   │   ├── create/route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── questions/route.ts
│   │   │       └── respond/route.ts
│   │   ├── content/
│   │   │   ├── generate/route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── refine/route.ts
│   │   ├── voice-dna/route.ts
│   │   ├── samples/route.ts
│   │   ├── referents/route.ts
│   │   └── calibration/
│   │       ├── start/route.ts
│   │       └── respond/route.ts
│   ├── record/
│   │   ├── page.tsx
│   │   ├── quick/page.tsx
│   │   └── guided/page.tsx
│   ├── session/[id]/page.tsx
│   ├── content/
│   │   ├── [id]/page.tsx
│   │   └── library/page.tsx
│   ├── onboarding/page.tsx
│   ├── settings/
│   │   ├── voice-dna/page.tsx
│   │   └── referents/page.tsx
│   ├── dashboard/page.tsx
│   └── page.tsx
├── components/
│   ├── voice/
│   │   ├── VoiceRecorder.tsx
│   │   ├── AudioVisualizer.tsx
│   │   ├── RecordingControls.tsx
│   │   └── TranscriptPreview.tsx
│   ├── session/
│   │   ├── FollowUpQuestion.tsx
│   │   ├── VoiceResponse.tsx
│   │   ├── TextResponse.tsx
│   │   └── SessionProgress.tsx
│   ├── content/
│   │   ├── ContentViewer.tsx
│   │   ├── ContentEditor.tsx
│   │   ├── VoiceRefine.tsx
│   │   ├── RefineChat.tsx
│   │   └── ContentActions.tsx
│   ├── voice-dna/
│   │   ├── VoiceDNACard.tsx
│   │   ├── StrengthIndicator.tsx
│   │   └── CalibrationFlow.tsx
│   ├── referents/
│   │   ├── ReferentCard.tsx
│   │   ├── ReferentSelector.tsx
│   │   └── BlendSliders.tsx
│   ├── onboarding/
│   │   ├── VoiceIntroStep.tsx
│   │   ├── FollowUpStep.tsx
│   │   ├── SampleUploadStep.tsx
│   │   └── ReferentSelectStep.tsx
│   ├── dashboard/
│   │   ├── QuickActions.tsx
│   │   ├── RecentContent.tsx
│   │   └── VoiceDNAStatus.tsx
│   └── ui/                        # shadcn/ui (keep)
├── lib/
│   ├── voice/
│   │   ├── recorder.ts
│   │   ├── audioUtils.ts
│   │   └── visualizer.ts
│   ├── transcription/
│   │   ├── whisper.ts
│   │   └── timestampParser.ts
│   ├── analysis/
│   │   ├── enthusiasmDetector.ts
│   │   ├── linguisticAnalyzer.ts
│   │   └── voiceDNABuilder.ts
│   ├── content/
│   │   ├── promptComposer.ts
│   │   └── postProcessor.ts
│   ├── referents/
│   │   ├── sethGodin.ts
│   │   ├── annHandley.ts
│   │   ├── garyVee.ts
│   │   ├── jamesClear.ts
│   │   └── blending.ts
│   ├── ai/
│   │   └── prompts/
│   │       ├── analysis.ts
│   │       ├── followUp.ts
│   │       ├── generation.ts
│   │       └── refinement.ts
│   ├── auth.ts                    # Keep
│   ├── auth-client.ts             # Keep
│   ├── db.ts                      # Keep
│   ├── schema.ts                  # Extend
│   └── utils.ts                   # Keep
└── types/
    ├── voice.ts
    ├── voiceDNA.ts
    ├── session.ts
    └── content.ts
```
