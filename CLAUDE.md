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
- **Authentication**: BetterAuth with Email/Password + Google OAuth
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack React Query v5 + React Context
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
4. User selects content template (Standard Article, Key Points, or Personal Story)
5. Content generated using Ouno Core profile + selected template
6. User can refine/iterate on output via Voice Refine

### 4. Onboarding Flow
- `not_started` → `voice_intro` → `follow_ups` → `samples` → `complete`
- Collects initial voice sample
- Gathers writing samples for pattern extraction
- Optional calibration rounds for fine-tuning

### 5. Calibration System
- Users rate generated samples (1-5)
- Feedback improves Ouno Core accuracy
- Learned rules stored for future generations

### 6. Admin Panel
- Role-based access control (admin/user hierarchy)
- User management dashboard at `/admin/users`
- View and edit user details
- Server-side protection via `requireAdmin()` guard

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
│   │   ├── samples/             # Writing samples
│   │   └── admin/               # Admin user management
│   │       └── users/           # User CRUD
│   ├── dashboard/               # User dashboard
│   ├── record/                  # Voice recording pages
│   │   ├── quick/               # Thought Stream mode
│   │   └── guided/              # Deep Dive mode
│   ├── session/[id]/            # Spark detail view
│   ├── content/                 # Content viewing/editing
│   │   ├── [id]/                # Content detail
│   │   └── library/             # Content library
│   ├── onboarding/              # Onboarding wizard
│   ├── settings/                # User settings
│   │   ├── voice-dna/           # Ouno Core settings
│   │   └── referents/           # Style influences
│   ├── admin/                   # Admin panel (protected)
│   │   ├── users/               # User management
│   │   └── users/[id]/          # User detail view
│   └── profile/                 # User profile
├── components/
│   ├── auth/                    # Authentication components
│   ├── brand/                   # Brand components
│   │   └── OunoLogo.tsx         # Reusable logo (LogoMark + LogoText)
│   ├── providers/               # Context providers
│   │   └── query-provider.tsx   # TanStack React Query setup
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
│   │   ├── TemplateSelector.tsx # Content format selector (3 templates)
│   │   └── VoiceRefine.tsx      # Voice-based content refinement
│   ├── dashboard/               # Dashboard components
│   │   ├── QuickActions.tsx     # Thought Stream + Deep Dive buttons
│   │   ├── RecentContent.tsx    # Recent articles list
│   │   └── VoiceDNAStatus.tsx   # Compact Ouno Core card
│   ├── onboarding/              # Onboarding components
│   ├── admin/                   # Admin panel components
│   │   ├── AdminSidebar.tsx     # Admin navigation
│   │   ├── UserList.tsx         # User table
│   │   └── UserDetail.tsx       # User editing
│   ├── referents/               # Referent components
│   └── ui/                      # shadcn/ui components
├── contexts/
│   └── session-context.tsx      # Centralized auth session
├── hooks/
│   ├── useRole.ts               # Role-based access hook
│   └── useSampleUpload.ts       # Sample upload logic
├── lib/
│   ├── auth.ts                  # BetterAuth server config
│   ├── auth-client.ts           # BetterAuth client hooks
│   ├── db.ts                    # Database connection
│   ├── schema.ts                # Drizzle schema
│   ├── roles.ts                 # Role hierarchy & guards
│   ├── validation.ts            # Input validation helpers
│   ├── storage.ts               # File storage (Vercel Blob / local)
│   ├── analysis/                # AI analysis modules
│   │   └── voiceDNABuilder.ts   # Core Ouno Core logic
│   └── content/                 # Content generation
│       └── promptComposer.ts    # Prompt engineering
└── types/
    ├── voice.ts                 # Voice recording types
    ├── voiceDNA.ts              # Ouno Core profile types
    ├── session.ts               # Spark types
    ├── content.ts               # Content types
    ├── calibration.ts           # Calibration types
    └── referent.ts              # Referent creator types
```

## State Management Architecture

### Session Context Pattern
The app uses a centralized session context to reduce duplicate auth queries from 5-7 to 1:

```typescript
// src/contexts/session-context.tsx
import { useSessionContext } from "@/contexts/session-context";

// In components:
const { data: session, isPending } = useSessionContext();
```

**Usage:**
- Client components: `useSessionContext()` (from context)
- Server components: `getSession()` or `getSessionWithRole()` (from BetterAuth)
- API routes: `auth.api.getSession({ headers: await headers() })`

### React Query Integration
TanStack React Query v5 provides efficient caching and data synchronization:

```typescript
// Configuration (src/components/providers/query-provider.tsx)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,         // Only fetch if stale
    },
  },
});
```

**Usage in components:**
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const { data, isLoading } = useQuery({
  queryKey: ["voice-dna", "full"],
  queryFn: async () => {
    const response = await fetch("/api/voice-dna");
    return response.json();
  },
  enabled: !!session,
});
```

### Authorization Hooks

**Client-side:**
```typescript
import { useRole } from "@/hooks/useRole";

const { role, isAdmin, isPending } = useRole();
```

**Server-side (pages):**
```typescript
import { requireAdmin } from "@/lib/roles";

// In server component or layout:
await requireAdmin("/dashboard"); // Redirects if not admin
```

**API routes:**
```typescript
import { checkAdminApi } from "@/lib/roles";

const adminCheck = await checkAdminApi();
if (!adminCheck.authorized) {
  return NextResponse.json(adminCheck.error, { status: adminCheck.error.status });
}
```

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `user` | User accounts with onboarding status and role |
| `voice_dna_profiles` | Ouno Core data per user |
| `voice_sessions` | Spark recordings with transcripts |
| `generated_content` | Blog posts/articles from Sparks |
| `writing_samples` | User-provided writing samples |
| `referent_creators` | Style influence profiles |
| `calibration_rounds` | Calibration feedback data |

### Key Enums

```typescript
onboarding_status: not_started, voice_intro, follow_ups, samples, complete
session_mode: quick (Thought Stream), guided (Deep Dive)
session_status: recording, transcribing, analyzing, follow_ups, generating, complete, error
content_status: draft, final, published
content_template: blog_post (Standard Article), listicle (Key Points), narrative (Personal Story)
user_role: admin, user
```

### Role Hierarchy

```typescript
// src/lib/roles.ts
const ROLE_HIERARCHY = {
  admin: 100,
  user: 10,
};
```

## API Routes Reference

### Voice Processing
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/voice/upload` | Upload audio file (max 25MB) |
| POST | `/api/voice/transcribe` | Transcribe audio via Whisper |
| POST | `/api/voice/analyze` | Analyze transcript, build Ouno Core |

### Content
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/content` | List user's content |
| POST | `/api/content/generate` | Generate content from Spark |
| GET | `/api/content/[id]` | Get content detail |
| POST | `/api/content/[id]/refine` | Refine content via voice/text |

### Voice DNA
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/voice-dna` | Get user's Ouno Core profile |
| PATCH | `/api/voice-dna` | Update profile |
| POST | `/api/voice-dna/rebuild` | Rebuild from all sources |

### Admin
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/users` | List users (paginated) |
| GET | `/api/admin/users/[id]` | Get user detail |
| PATCH | `/api/admin/users/[id]` | Update user role |

## Environment Variables

```env
# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/ouno

# BetterAuth
BETTER_AUTH_SECRET=32-char-random-string

# AI via OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=openai/gpt-4o-mini

# OpenAI (for Whisper transcription)
OPENAI_API_KEY=sk-your-openai-key

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
pnpm db:seed-admin # Seed admin user
```

## Guidelines for AI Assistants

### Critical Rules

1. **ALWAYS run lint and typecheck** after changes:
   ```bash
   pnpm lint && pnpm typecheck
   ```

2. **NEVER start the dev server yourself** - ask user for output

3. **Use OpenRouter, NOT OpenAI directly** for content generation
   - Import: `import { openrouter } from "@openrouter/ai-sdk-provider"`
   - Model format: `provider/model-name`
   - OpenAI is only used for Whisper transcription

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

8. **Use the session context**:
   - Client components: `useSessionContext()` (not `useSession()` directly)
   - This reduces duplicate auth queries

9. **Use React Query for data fetching**:
   - Configured in `src/components/providers/query-provider.tsx`
   - 5-minute stale time, automatic caching

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

**Working with admin panel:**
1. Protected by `requireAdmin()` in layout (`src/app/admin/layout.tsx`)
2. API routes require `checkAdminApi()` guard
3. Components in `src/components/admin/`
4. Use `useRole()` hook for client-side role checks

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

### Error Handling Patterns

API routes follow a consistent error handling pattern:

```typescript
export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate input
    const body = await request.json();
    if (!body.required) {
      return NextResponse.json({ error: "Missing field" }, { status: 400 });
    }

    // 3. Check authorization (for protected resources)
    if (resource.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Do work
    const result = await doWork();

    // 5. Return success
    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    console.error("Operation error:", error);
    return NextResponse.json(
      { error: "Operation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
```

### Best Practices

- Read existing patterns before creating new features
- Ouno Core should feel personal, not generic
- Follow-up questions should draw out unique insights
- Content should preserve the user's authentic voice
- Calibration feedback is valuable—use it to improve
- Refer to "The Editor" (not "the AI") in user-facing copy
- Use `useSessionContext()` for auth state (not `useSession()` directly)
- Use React Query for API data fetching when appropriate

## Known Limitations

1. **Email Service**: Password reset and verification URLs are currently logged to console only (no email service integration)
2. **Background Processing**: All AI calls are synchronous (potential timeout risk for long operations)
3. **URL Extraction**: Requires internet access to Jina.ai and LLM provider
4. **Temporary Files**: Audio cleanup on non-critical errors may leave orphan files

## Route Protection Levels

- **Public**: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`
- **Authenticated**: `/dashboard`, `/record`, `/onboarding`, `/settings`, `/profile`, `/content`
- **Admin Only**: `/admin`, `/admin/users`, `/admin/users/[id]`

## Package Manager

This project uses **pnpm** (see `pnpm-lock.yaml`). When running commands:
- Use `pnpm` instead of `npm`
- Scripts: `pnpm run [script]` or `pnpm [script]`
