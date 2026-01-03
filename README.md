# Ouno

**Your Authentic Intelligence** — Speak Your Mind. We'll Handle the Words.

Ouno is a voice-to-content platform that transforms spoken ideas into polished written content while preserving your authentic voice and style. Record your thoughts, answer follow-up questions, and receive blog posts that sound like you—not generic AI output.

![Ouno Logo](public/brand/logo-dark.png)

## Features

### Voice Recording & Transcription
- Record voice memos (2-5 minutes)
- Real-time audio visualization
- Automatic transcription with word timestamps
- **Thought Stream** mode for fast capture
- **Deep Dive** mode with structured prompts

### Ouno Core (Voice DNA) Profiling
The app learns your unique communication style:
- **Spoken Patterns**: Sentence structure, vocabulary, speech rhythm
- **Written Patterns**: Formatting preferences, paragraph style
- **Tonal Attributes**: Formality, enthusiasm, humor, directness
- **Referent Influences**: Style inspirations from writers you admire

### Content Generation
1. Record your voice → transcribed automatically
2. AI analyzes for enthusiasm and key topics
3. Follow-up questions draw out more depth
4. Select content template (Standard Article, Key Points, Personal Story)
5. Content generated using your Ouno Core profile
6. Refine and iterate via Voice Refine

### Writing Samples & Calibration
- **Smart URL Import**: Paste a URL and AI extracts just the article content (no navigation, footers, ads)
- **Multiple upload methods**: Paste text, import from URL, or upload .txt/.md files
- **Automatic analysis**: Samples are analyzed for vocabulary, tone, and style patterns
- Complete calibration rounds to fine-tune your profile
- Rate AI-generated samples and provide feedback
- Profile improves with each interaction

### Admin Panel
- Role-based access control (admin/user roles)
- User management dashboard
- View and edit user details
- Monitor system usage

## Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **AI Integration**: Vercel AI SDK 5 + OpenRouter (100+ AI models)
- **Authentication**: BetterAuth with Email/Password + Google OAuth
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack React Query v5 + React Context
- **UI**: shadcn/ui components with Tailwind CSS 4
- **Styling**: Dark mode support via next-themes

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenRouter API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ouno.git
   cd ouno
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```

   Edit `.env` with your credentials:
   ```env
   # Database
   POSTGRES_URL=postgresql://user:password@localhost:5432/ouno

   # Authentication
   BETTER_AUTH_SECRET=your-32-character-secret-key

   # AI via OpenRouter
   OPENROUTER_API_KEY=sk-or-v1-your-key
   OPENROUTER_MODEL=openai/gpt-4o-mini

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   ```bash
   pnpm db:push
   ```

5. **Seed admin user (optional)**
   ```bash
   pnpm db:seed-admin
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth routes (login, register, forgot-password)
│   ├── api/
│   │   ├── auth/            # BetterAuth catch-all
│   │   ├── voice/           # Voice upload, transcription, analysis
│   │   ├── voice-dna/       # Ouno Core profile management
│   │   ├── session/         # Spark session management
│   │   ├── content/         # Content generation & refinement
│   │   ├── calibration/     # Calibration rounds
│   │   ├── samples/         # Writing samples
│   │   └── admin/           # Admin user management
│   ├── dashboard/           # User dashboard
│   ├── record/              # Voice recording pages
│   │   ├── quick/           # Thought Stream mode
│   │   └── guided/          # Deep Dive mode
│   ├── session/[id]/        # Spark detail view
│   ├── content/             # Content viewing/editing/library
│   ├── onboarding/          # Onboarding wizard
│   ├── settings/            # User settings (voice-dna, referents)
│   ├── admin/               # Admin panel (protected)
│   │   ├── users/           # User management
│   │   └── users/[id]/      # User detail view
│   └── profile/             # User profile
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── providers/           # React Query provider
│   ├── auth/                # Authentication components
│   ├── brand/               # Logo components
│   ├── voice/               # Voice recorder, visualizer
│   ├── voice-dna/           # Ouno Core components
│   ├── samples/             # Writing sample upload/view
│   ├── session/             # Spark components
│   ├── content/             # Content display/editing
│   ├── dashboard/           # Dashboard cards
│   ├── onboarding/          # Wizard steps
│   ├── admin/               # Admin panel components
│   └── referents/           # Style influence components
├── contexts/
│   └── session-context.tsx  # Centralized auth session
├── hooks/
│   ├── useRole.ts           # Role-based access hook
│   └── useSampleUpload.ts   # Sample upload logic
├── lib/
│   ├── auth.ts              # BetterAuth config
│   ├── auth-client.ts       # BetterAuth client hooks
│   ├── db.ts                # Database connection
│   ├── schema.ts            # Drizzle schema
│   ├── roles.ts             # Role hierarchy & guards
│   ├── validation.ts        # Input validation helpers
│   └── analysis/            # AI analysis modules
└── types/                   # TypeScript definitions
```

## Available Scripts

```bash
pnpm dev          # Start dev server (with Turbopack)
pnpm build        # Build for production (runs migrations)
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript checking
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Drizzle Studio
pnpm db:seed-admin # Seed admin user
```

## Terminology

| Internal/API | User-Facing |
|--------------|-------------|
| `voice_dna_profiles` | Ouno Core |
| `quick` mode | Thought Stream |
| `guided` mode | Deep Dive |
| `voice_sessions` | Sparks |
| "The AI" | The Editor |

## Architecture Highlights

### State Management
- **Session Context**: Centralized auth session reduces duplicate queries
- **React Query**: Efficient caching with 5-min stale time, 10-min garbage collection
- **Local State**: useState for UI state (modals, forms, tabs)

### Authentication
- BetterAuth with session caching (5-minute cookie cache)
- Role-based access control (admin/user hierarchy)
- Server-side protection for admin routes
- Email verification + password reset flows

### Data Flow
```
Voice Recording → Transcription (OpenAI Whisper)
                        ↓
              Analysis (Enthusiasm, Patterns)
                        ↓
              Follow-up Questions
                        ↓
              Content Generation (OpenRouter)
                        ↓
              Voice Refine (Iterations)
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run lint and typecheck (`pnpm lint && pnpm typecheck`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.
