# Ouno - AI Assistant Guidelines

## Project Overview

Ouno is a voice-to-content platform that transforms spoken ideas into polished written content while preserving the user's authentic voice and style. Users record their thoughts, answer follow-up questions, and receive blog posts that sound like them—not generic AI output.

### Core Concept

**"Your Authentic Intelligence"**

- **Tagline**: "Speak Your Mind. We'll Handle the Words."
- **Value Prop**: "Turn Talk into Content"

The app learns each user's unique "Ouno Core"—their speaking patterns, vocabulary, tone, and style preferences—to generate content that authentically represents how they communicate.

### Brand Identity

| Element | Value |
|---------|-------|
| Primary Color | Electric Indigo `#4F46E5` / `oklch(0.448 0.235 264.376)` |
| Foreground | Deep Charcoal `#1F2937` / `oklch(0.227 0.019 264.376)` |
| Accent/Warning | Signal Amber `#F59E0B` / `oklch(0.769 0.188 70.08)` |
| Typography | Inter (body), JetBrains Mono (code) |
| Logo | Microphone icon + "Ouno" text (via `OunoLogo` component) |

### Terminology

| Internal/API | User-Facing |
|--------------|-------------|
| `voice_dna_profiles` | Ouno Core |
| `quick` mode | Thought Stream |
| `guided` mode | Deep Dive |
| `voice_sessions` | Sparks |
| "The AI" | The Editor |

### Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **AI Integration**: Vercel AI SDK 5 + OpenRouter (access to 100+ AI models)
- **Authentication**: BetterAuth with Email/Password
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: shadcn/ui components with Tailwind CSS 4
- **Styling**: Tailwind CSS with dark mode support (next-themes)
- **Typography**: Inter font family via `next/font/google`

## Key Features

### 1. Voice Recording & Transcription
- Record voice memos (2-5 minutes)
- Real-time audio visualization
- Automatic transcription with word timestamps
- **Thought Stream** mode (fast capture) vs **Deep Dive** mode (structured prompts)

### 2. Ouno Core Profiling
- **Spoken Patterns**: Sentence structure, fillers, speech rhythm
- **Written Patterns**: Preferred vocabulary, formatting style
- **Tonal Attributes**: Formality level, enthusiasm, humor
- **Referent Influences**: Style influences from writers/creators the user admires

### 3. Content Generation Pipeline
1. User records voice → transcribed
2. The Editor analyzes for enthusiasm and key topics
3. Follow-up questions draw out more depth
4. Content generated using Ouno Core profile
5. User can refine/iterate on output

### 4. Onboarding Flow
- `not_started` → `voice_intro` → `follow_ups` → `samples` → `complete`
- Collects initial voice sample
- Gathers writing samples for pattern extraction
- Optional calibration rounds for fine-tuning

### 5. Calibration System
- Users rate generated samples (1-5)
- Feedback improves Ouno Core accuracy
- Learned rules stored for future generations

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Auth route group (login, register, etc.)
│   ├── api/
│   │   ├── auth/[...all]/       # BetterAuth catch-all
│   │   ├── voice/               # Voice upload, transcribe, analyze
│   │   ├── voice-dna/           # Ouno Core profile CRUD
│   │   ├── session/             # Spark session management
│   │   │   ├── create/          # Create new Spark
│   │   │   └── [id]/            # Spark details, questions, responses
│   │   ├── content/             # Content generation
│   │   │   ├── generate/        # Generate content from Spark
│   │   │   └── [id]/            # Content CRUD, refinement
│   │   ├── onboarding/          # Onboarding flow endpoints
│   │   ├── calibration/         # Calibration rounds
│   │   ├── referents/           # Referent creators
│   │   └── samples/             # Writing samples
│   ├── dashboard/               # User dashboard
│   ├── record/                  # Voice recording pages
│   │   ├── quick/               # Thought Stream mode
│   │   └── guided/              # Deep Dive mode
│   ├── session/[id]/            # Spark detail view
│   ├── content/                 # Content viewing/editing
│   ├── onboarding/              # Onboarding wizard
│   ├── settings/                # User settings
│   └── profile/                 # User profile
├── components/
│   ├── auth/                    # Authentication components
│   ├── brand/                   # Brand components
│   │   └── OunoLogo.tsx         # Reusable logo (LogoMark + LogoText)
│   ├── voice/                   # Voice recording components
│   │   ├── VoiceRecorder.tsx    # Main recorder component
│   │   ├── AudioVisualizer.tsx  # Real-time audio visualization
│   │   ├── RecordingControls.tsx
│   │   └── TranscriptPreview.tsx
│   ├── voice-dna/               # Ouno Core components
│   │   ├── VoiceDNACard.tsx     # Profile display
│   │   ├── CalibrationFlow.tsx  # Calibration wizard
│   │   └── StrengthIndicator.tsx
│   ├── samples/                 # Writing sample components
│   │   ├── WritingSamplesSection.tsx  # Sample list container
│   │   ├── SampleCard.tsx       # Individual sample with view/delete
│   │   ├── SampleUploadDialog.tsx     # Upload dialog (paste/URL/file)
│   │   └── SampleViewDialog.tsx # View full sample content
│   ├── session/                 # Spark-related components
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
    ├── voiceDNA.ts              # Ouno Core profile types
    ├── session.ts               # Spark types
    ├── content.ts               # Content types
    ├── calibration.ts           # Calibration types
    └── referent.ts              # Referent creator types
```

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `user` | User accounts with onboarding status |
| `voice_dna_profiles` | Ouno Core data per user |
| `voice_sessions` | Spark recordings with transcripts |
| `generated_content` | Blog posts/articles from Sparks |
| `writing_samples` | User-provided writing samples |
| `referent_creators` | Style influence profiles |
| `calibration_rounds` | Calibration feedback data |

### Key Enums

- `onboarding_status`: not_started, voice_intro, follow_ups, samples, complete
- `session_mode`: quick (Thought Stream), guided (Deep Dive)
- `session_status`: recording, transcribing, analyzing, follow_ups, generating, complete, error
- `content_status`: draft, final, published

## Environment Variables

```env
# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/ouno

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
   - Ouno Core profile influences all generated content

5. **Spark states matter**:
   - Sparks progress through defined statuses
   - Don't skip states or make invalid transitions

6. **Ouno Core is central**:
   - All content generation should use the user's Ouno Core
   - Calibration improves accuracy over time

7. **Use correct terminology**:
   - User-facing: "Ouno Core", "Thought Stream", "Deep Dive", "Spark", "The Editor"
   - Internal/API: `voice_dna_profiles`, `quick`, `guided`, `voice_sessions`

### Common Tasks

**Adding a new Spark feature:**
1. Update types in `src/types/session.ts`
2. Modify schema if needed (`src/lib/schema.ts`)
3. Add/update API route in `src/app/api/session/`
4. Update Spark components in `src/components/session/`

**Modifying content generation:**
1. Check `src/app/api/content/generate/route.ts`
2. Understand Ouno Core usage in prompts
3. Reference `src/types/voiceDNA.ts` for profile structure

**Working with Ouno Core:**
1. Profile stored in `voice_dna_profiles` table
2. Components in `src/components/voice-dna/`
3. API at `src/app/api/voice-dna/`

**Updating onboarding:**
1. Flow defined by `onboarding_status` enum
2. API routes in `src/app/api/onboarding/`
3. Components in `src/components/onboarding/`

**Working with writing samples:**
1. Upload methods: paste, URL (with LLM extraction), file
2. URL import uses Jina.ai Reader + OpenRouter LLM to extract article body only
3. LLM strips markdown formatting and converts to plain text
4. API routes: `src/app/api/samples/` (GET list, POST create) and `src/app/api/samples/[id]/` (GET full content, DELETE)
5. Components in `src/components/samples/`
6. Samples are analyzed and merged into Ouno Core profile automatically via `rebuildVoiceDNA()`

**Using the logo:**
```tsx
import { OunoLogo, LogoMark, LogoText } from "@/components/brand/OunoLogo";

// Full logo with text
<OunoLogo size="md" />

// Icon only (for compact spaces)
<OunoLogo size="sm" showText={false} />

// Individual components
<LogoMark size="lg" />
<LogoText size="lg" />
```

### Type Definitions

Key types to understand:

```typescript
// Ouno Core Profile structure
interface VoiceDNA {
  spokenPatterns: SpokenPatterns;
  writtenPatterns: WrittenPatterns;
  tonalAttributes: TonalAttributes;
  referentInfluences: ReferentInfluences;
  learnedRules: LearnedRule[];
}

// Spark with full context
interface VoiceSession {
  id: string;
  mode: 'quick' | 'guided'; // Thought Stream | Deep Dive
  status: SessionStatus;
  transcript: string;
  enthusiasmAnalysis: EnthusiasmAnalysis;
  followUpQuestions: FollowUpQuestion[];
  followUpResponses: FollowUpResponse[];
}
```

### Best Practices

- Read existing patterns before creating new features
- Ouno Core should feel personal, not generic
- Follow-up questions should draw out unique insights
- Content should preserve the user's authentic voice
- Calibration feedback is valuable—use it to improve
- Refer to "The Editor" (not "the AI") in user-facing copy

## Package Manager

This project uses **pnpm** (see `pnpm-lock.yaml`). When running commands:
- Use `pnpm` instead of `npm`
- Scripts: `pnpm run [script]` or `pnpm [script]`
