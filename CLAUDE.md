# VoiceDNA - AI Assistant Guidelines

## Project Overview

VoiceDNA is a voice-to-content platform that transforms spoken ideas into polished written content while preserving the user's authentic voice and style. Users record their thoughts, answer follow-up questions, and receive blog posts that sound like them—not generic AI output.

### Core Concept

**"Stop typing prompts. Start talking ideas."**

The app learns each user's unique "Voice DNA"—their speaking patterns, vocabulary, tone, and style preferences—to generate content that authentically represents how they communicate.

### Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **AI Integration**: Vercel AI SDK 5 + OpenRouter (access to 100+ AI models)
- **Authentication**: BetterAuth with Email/Password
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: shadcn/ui components with Tailwind CSS 4
- **Styling**: Tailwind CSS with dark mode support (next-themes)

## Key Features

### 1. Voice Recording & Transcription
- Record voice memos (2-5 minutes)
- Real-time audio visualization
- Automatic transcription with word timestamps
- Quick mode (fast capture) vs Guided mode (structured prompts)

### 2. Voice DNA Profiling
- **Spoken Patterns**: Sentence structure, fillers, speech rhythm
- **Written Patterns**: Preferred vocabulary, formatting style
- **Tonal Attributes**: Formality level, enthusiasm, humor
- **Referent Influences**: Style influences from writers/creators the user admires

### 3. Content Generation Pipeline
1. User records voice → transcribed
2. AI analyzes for enthusiasm and key topics
3. Follow-up questions draw out more depth
4. Content generated using Voice DNA profile
5. User can refine/iterate on output

### 4. Onboarding Flow
- `not_started` → `voice_intro` → `follow_ups` → `samples` → `complete`
- Collects initial voice sample
- Gathers writing samples for pattern extraction
- Optional calibration rounds for fine-tuning

### 5. Calibration System
- Users rate generated samples (1-5)
- Feedback improves Voice DNA accuracy
- Learned rules stored for future generations

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Auth route group (login, register, etc.)
│   ├── api/
│   │   ├── auth/[...all]/       # BetterAuth catch-all
│   │   ├── voice/               # Voice upload, transcribe, analyze
│   │   ├── voice-dna/           # Voice DNA profile CRUD
│   │   ├── session/             # Voice session management
│   │   │   ├── create/          # Create new session
│   │   │   └── [id]/            # Session details, questions, responses
│   │   ├── content/             # Content generation
│   │   │   ├── generate/        # Generate content from session
│   │   │   └── [id]/            # Content CRUD, refinement
│   │   ├── onboarding/          # Onboarding flow endpoints
│   │   ├── calibration/         # Calibration rounds
│   │   ├── referents/           # Referent creators
│   │   └── samples/             # Writing samples
│   ├── dashboard/               # User dashboard
│   ├── record/                  # Voice recording pages
│   │   ├── quick/               # Quick recording mode
│   │   └── guided/              # Guided recording mode
│   ├── session/[id]/            # Session detail view
│   ├── content/                 # Content viewing/editing
│   ├── onboarding/              # Onboarding wizard
│   ├── settings/                # User settings
│   └── profile/                 # User profile
├── components/
│   ├── auth/                    # Authentication components
│   ├── voice/                   # Voice recording components
│   │   ├── VoiceRecorder.tsx    # Main recorder component
│   │   ├── AudioVisualizer.tsx  # Real-time audio visualization
│   │   ├── RecordingControls.tsx
│   │   └── TranscriptPreview.tsx
│   ├── voice-dna/               # Voice DNA components
│   │   ├── VoiceDNACard.tsx     # Profile display
│   │   ├── CalibrationFlow.tsx  # Calibration wizard
│   │   └── StrengthIndicator.tsx
│   ├── session/                 # Session-related components
│   ├── content/                 # Content display/editing
│   ├── onboarding/              # Onboarding components
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── auth.ts                  # BetterAuth server config
│   ├── auth-client.ts           # BetterAuth client hooks
│   ├── db.ts                    # Database connection
│   ├── schema.ts                # Drizzle schema
│   ├── storage.ts               # File storage (Vercel Blob / local)
│   └── utils.ts                 # Utility functions
└── types/
    ├── voice.ts                 # Voice recording types
    ├── voiceDNA.ts              # Voice DNA profile types
    ├── session.ts               # Session types
    ├── content.ts               # Content types
    ├── calibration.ts           # Calibration types
    └── referent.ts              # Referent creator types
```

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `user` | User accounts with onboarding status |
| `voice_dna_profiles` | Voice DNA data per user |
| `voice_sessions` | Recording sessions with transcripts |
| `generated_content` | Blog posts/articles from sessions |
| `writing_samples` | User-provided writing samples |
| `referent_creators` | Style influence profiles |
| `calibration_rounds` | Calibration feedback data |

### Key Enums

- `onboarding_status`: not_started, voice_intro, follow_ups, samples, complete
- `session_mode`: quick, guided
- `session_status`: recording, transcribing, analyzing, follow_ups, generating, complete, error
- `content_status`: draft, final, published

## Environment Variables

```env
# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/voicedna

# BetterAuth
BETTER_AUTH_SECRET=32-char-random-string

# AI via OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=openai/gpt-4o-mini

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# File Storage (optional - for voice uploads)
BLOB_READ_WRITE_TOKEN=
```

## Available Scripts

```bash
pnpm dev          # Start dev server (DON'T run - ask user)
pnpm build        # Build for production
pnpm lint         # Run ESLint (ALWAYS run after changes)
pnpm typecheck    # TypeScript checking (ALWAYS run after changes)
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Drizzle Studio
```

## Guidelines for AI Assistants

### Critical Rules

1. **ALWAYS run lint and typecheck** after changes:
   ```bash
   pnpm lint && pnpm typecheck
   ```

2. **NEVER start the dev server yourself** - ask user for output

3. **Use OpenRouter, NOT OpenAI directly**
   - Import: `import { openrouter } from "@openrouter/ai-sdk-provider"`
   - Model format: `provider/model-name`

4. **Understand the data flow**:
   - Voice → Transcript → Analysis → Follow-ups → Content
   - Voice DNA profile influences all generated content

5. **Session states matter**:
   - Sessions progress through defined statuses
   - Don't skip states or make invalid transitions

6. **Voice DNA is central**:
   - All content generation should use the user's Voice DNA
   - Calibration improves accuracy over time

### Common Tasks

**Adding a new session feature:**
1. Update types in `src/types/session.ts`
2. Modify schema if needed (`src/lib/schema.ts`)
3. Add/update API route in `src/app/api/session/`
4. Update session components in `src/components/session/`

**Modifying content generation:**
1. Check `src/app/api/content/generate/route.ts`
2. Understand Voice DNA usage in prompts
3. Reference `src/types/voiceDNA.ts` for profile structure

**Working with Voice DNA:**
1. Profile stored in `voice_dna_profiles` table
2. Components in `src/components/voice-dna/`
3. API at `src/app/api/voice-dna/`

**Updating onboarding:**
1. Flow defined by `onboarding_status` enum
2. API routes in `src/app/api/onboarding/`
3. Components in `src/components/onboarding/`

### Type Definitions

Key types to understand:

```typescript
// Voice DNA Profile structure
interface VoiceDNA {
  spokenPatterns: SpokenPatterns;
  writtenPatterns: WrittenPatterns;
  tonalAttributes: TonalAttributes;
  referentInfluences: ReferentInfluences;
  learnedRules: LearnedRule[];
}

// Session with full context
interface VoiceSession {
  id: string;
  mode: 'quick' | 'guided';
  status: SessionStatus;
  transcript: string;
  enthusiasmAnalysis: EnthusiasmAnalysis;
  followUpQuestions: FollowUpQuestion[];
  followUpResponses: FollowUpResponse[];
}
```

### Best Practices

- Read existing patterns before creating new features
- Voice DNA should feel personal, not generic
- Follow-up questions should draw out unique insights
- Content should preserve the user's authentic voice
- Calibration feedback is valuable—use it to improve

## Package Manager

This project uses **pnpm** (see `pnpm-lock.yaml`). When running commands:
- Use `pnpm` instead of `npm`
- Scripts: `pnpm run [script]` or `pnpm [script]`
