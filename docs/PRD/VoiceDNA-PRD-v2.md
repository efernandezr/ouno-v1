# VoiceDNA — Product Requirements Document v2

**Version**: 2.0  
**Last Updated**: December 29, 2025  
**Author**: Enrique (Product Owner)  
**Status**: MVP Definition — Voice-First Architecture

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Strategy](#2-product-vision--strategy)
3. [Core Concept: Voice-First Content Creation](#3-core-concept-voice-first-content-creation)
4. [User Personas & Stories](#4-user-personas--stories)
5. [MVP Feature Requirements](#5-mvp-feature-requirements)
6. [Voice Capture System](#6-voice-capture-system)
7. [Voice DNA Engine](#7-voice-dna-engine)
8. [Content Generation Pipeline](#8-content-generation-pipeline)
9. [Technical Architecture](#9-technical-architecture)
10. [Data Models](#10-data-models)
11. [API Specifications](#11-api-specifications)
12. [UI/UX Specifications](#12-uiux-specifications)
13. [Referent Creator System](#13-referent-creator-system)
14. [Security & Privacy](#14-security--privacy)
15. [Success Metrics](#15-success-metrics)
16. [Development Phases](#16-development-phases)
17. [Future Vision](#17-future-vision)
18. [Appendices](#18-appendices)

---

## 1. Executive Summary

### 1.1 Product Overview

**VoiceDNA** is a voice-first AI content creation platform that captures your authentic thinking through speech and transforms it into polished, publish-ready blog articles. Unlike traditional AI writing tools where you type prompts, VoiceDNA lets you speak naturally—capturing not just your words, but your enthusiasm, emphasis, and authentic voice patterns.

### 1.2 The Core Insight

> **Your authentic voice comes through when you SPEAK, not when you type.**

When you type a prompt, you activate "writing mode"—formal, filtered, self-edited. When you speak, you activate natural thought patterns, genuine enthusiasm, and authentic personality. VoiceDNA captures that authenticity.

### 1.3 How It's Different

| Traditional AI Writing | VoiceDNA |
|------------------------|----------|
| Type a prompt | Speak your ideas naturally |
| Generic AI voice | YOUR voice patterns captured |
| Flat, uniform tone | Enthusiasm/emotion detected and preserved |
| One-shot generation | Socratic follow-ups draw out better content |
| Desktop-centric | Mobile-first, capture anywhere |

### 1.4 MVP Scope Summary

- **Input**: Voice recordings (1-5 minutes) + optional writing samples
- **Processing**: Async transcription → AI follow-up questions → content generation
- **Output**: Polished blog articles ready to publish
- **Enhancement**: Referent creator influence blending (Seth Godin, etc.)
- **Platforms**: Mobile-first with desktop support
- **Users**: Maximum 10 users
- **Timeline**: 1-3 weeks (Claude Code development)

### 1.5 Value Proposition

> "Stop typing prompts. Start talking ideas. VoiceDNA captures your authentic thinking and transforms it into polished content—preserving what makes YOU sound like YOU."

---

## 2. Product Vision & Strategy

### 2.1 Vision Statement

*"Make AI content creation as natural as having a conversation with a brilliant editor who knows exactly how you think and write."*

### 2.2 Strategic Positioning

| Dimension | Typing-Based Tools | VoiceDNA |
|-----------|-------------------|----------|
| **Input Mode** | Keyboard prompts | Natural speech |
| **Authenticity** | AI interprets your request | AI captures your actual thoughts |
| **Voice Capture** | Analyzes writing samples | Analyzes HOW you speak |
| **Emotion** | None | Detects enthusiasm, emphasis |
| **Convenience** | Requires focused typing time | Capture while walking, commuting |
| **Mental Load** | Must articulate perfect prompt | Just talk through your ideas |

### 2.3 Target Users

**Primary**: Content creators who:
- Have ideas but struggle to translate them to written content
- Are better speakers than writers
- Want to capture insights on-the-go (commute, walks, gym)
- Feel AI-generated content sounds generic

**Secondary**: Marketing professionals who:
- Need to produce consistent content at scale
- Want to maintain their authentic voice
- Value thought leadership positioning

### 2.4 Business Model (Future)

Personal tool with future SaaS monetization:
- **Free Tier**: 5 voice sessions/month
- **Pro Tier**: Unlimited sessions, referent blending, priority processing
- **Premium Tier**: Multi-format output, API access, team features

---

## 3. Core Concept: Voice-First Content Creation

### 3.1 The VoiceDNA Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VOICEDNA CONTENT FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐                                                        │
│  │   1. CAPTURE     │  User speaks naturally for 1-5 minutes                 │
│  │                  │  "So I've been thinking about why marketers            │
│  │   🎤 Voice In    │   resist AI tools, and I think it comes down           │
│  │                  │   to fear of losing creative identity..."              │
│  └────────┬─────────┘                                                        │
│           │                                                                  │
│           ▼                                                                  │
│  ┌──────────────────┐                                                        │
│  │  2. TRANSCRIBE   │  Whisper API converts speech to text                   │
│  │                  │  Preserves: filler words, emphasis markers,            │
│  │   📝 + Emotion   │  emotional peaks, natural rhythm                       │
│  │                  │                                                        │
│  └────────┬─────────┘                                                        │
│           │                                                                  │
│           ▼                                                                  │
│  ┌──────────────────┐                                                        │
│  │  3. ANALYZE      │  Claude extracts:                                      │
│  │                  │  • Core argument/thesis                                │
│  │   🧠 Extract     │  • Key points and stories                              │
│  │                  │  • Enthusiasm peaks (what excites you)                 │
│  │                  │  • Gaps that need elaboration                          │
│  └────────┬─────────┘                                                        │
│           │                                                                  │
│           ▼                                                                  │
│  ┌──────────────────┐                                                        │
│  │  4. DIALOGUE     │  AI asks 2-4 follow-up questions (text)                │
│  │                  │  "You mentioned 'creative identity'—can you            │
│  │   💬 Follow-up   │   give an example of a marketer who felt this?"        │
│  │                  │  User responds via voice or text                       │
│  └────────┬─────────┘                                                        │
│           │                                                                  │
│           ▼                                                                  │
│  ┌──────────────────┐                                                        │
│  │  5. GENERATE     │  Claude generates blog post with:                      │
│  │                  │  • Your Voice DNA patterns                             │
│  │   ✨ Create      │  • Referent influences (if selected)                   │
│  │                  │  • Your actual ideas and examples                      │
│  │                  │  • Structured for engagement                           │
│  └────────┬─────────┘                                                        │
│           │                                                                  │
│           ▼                                                                  │
│  ┌──────────────────┐                                                        │
│  │  6. REFINE       │  User can refine via:                                  │
│  │                  │  • Voice: "Make the opening more punchy"               │
│  │   🔄 Iterate     │  • Text: Chat-based editing                            │
│  │                  │  • Direct: Edit in document view                       │
│  └────────┬─────────┘                                                        │
│           │                                                                  │
│           ▼                                                                  │
│  ┌──────────────────┐                                                        │
│  │  7. PUBLISH      │  Copy, download, or save for later                     │
│  │                  │                                                        │
│  │   📤 Export      │  Polished, publish-ready article                       │
│  │                  │                                                        │
│  └──────────────────┘                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Two Capture Modes

**Quick Capture (30 seconds - 2 minutes)**
- Capture a single insight or idea
- Minimal AI follow-up (0-1 questions)
- Generates shorter content or stores for later synthesis
- Use case: "Quick thought while walking"

**Guided Session (2-5 minutes)**
- Structured content creation session
- AI asks 2-4 follow-up questions to draw out detail
- Generates full blog post
- Use case: "I want to write about X"

### 3.3 Voice DNA Components

Voice DNA is built from multiple sources:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VOICE DNA COMPOSITION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  PRIMARY: HOW YOU SPEAK (Extracted from voice sessions)                 ││
│  │                                                                          ││
│  │  • Natural vocabulary and phrases you use                                ││
│  │  • Sentence rhythm and length patterns                                   ││
│  │  • Topics that generate enthusiasm (detected via prosody)                ││
│  │  • Storytelling patterns (how you set up examples)                       ││
│  │  • Filler words and verbal tics (to optionally preserve or remove)       ││
│  │  • Rhetorical questions you naturally ask                                ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  SUPPLEMENTARY: WRITING SAMPLES (Optional but recommended)               ││
│  │                                                                          ││
│  │  • Published articles, blog posts                                        ││
│  │  • Email writing style                                                   ││
│  │  • Social media posts                                                    ││
│  │  → Used to refine written expression of your spoken ideas                ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  ENHANCEMENT: REFERENT INFLUENCES (Optional)                             ││
│  │                                                                          ││
│  │  • Seth Godin's punchiness                                               ││
│  │  • Ann Handley's warmth                                                  ││
│  │  • James Clear's clarity                                                 ││
│  │  → Applied at generation stage to enhance your natural voice             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Emotion/Enthusiasm Detection

A key differentiator is detecting emotional engagement in speech:

| Signal | What We Detect | How We Use It |
|--------|----------------|---------------|
| **Pace increase** | Excitement about topic | Emphasize this in the article |
| **Volume increase** | Strong conviction | Use as key argument |
| **Repetition** | Core message | Make this the thesis |
| **Pauses before** | Important point coming | Highlight in structure |
| **Rising intonation** | Questions/curiosity | Explore further in follow-up |
| **Falling energy** | Less important tangent | Summarize or cut |

---

## 4. User Personas & Stories

### 4.1 Primary Persona: "Maya the Marketing Creator"

**Demographics:**
- Age: 32
- Role: Freelance marketing consultant, builds personal brand
- Creates: Weekly blog posts, LinkedIn content
- Tech comfort: High (uses AI tools daily)

**Current Pain:**
- Has great ideas during commute/walks but loses them
- Typing prompts feels unnatural, output feels generic
- Spends 2+ hours per blog post
- AI content doesn't sound like her

**Goals with VoiceDNA:**
- Capture ideas when inspiration strikes
- Reduce blog creation time to 30 minutes
- Maintain authentic voice at scale
- Sound like herself, enhanced

**Quote:** *"I think best when I'm talking, not typing. I want AI that works with how I actually think."*

### 4.2 User Stories (MVP)

#### Onboarding & Setup

```
US-001: Quick Voice Onboarding
As a new user,
I want to set up my Voice DNA by speaking rather than filling forms
So that the process feels natural and captures my authentic voice.

Acceptance Criteria:
- User records 2-3 minute "about me" voice intro
- System asks 3-4 follow-up questions via text
- User responds to each via voice
- Basic Voice DNA profile created
- Time to complete: < 10 minutes
```

```
US-002: Supplementary Writing Samples
As a user setting up my profile,
I want to add writing samples to enhance my Voice DNA
So that the AI understands both how I speak AND write.

Acceptance Criteria:
- Upload 1-5 writing samples (paste, URL, or file)
- System analyzes and extracts writing patterns
- Patterns merged with voice-derived DNA
- User sees "Voice DNA strength" indicator improve
```

```
US-003: Select Referent Influences
As a user,
I want to choose writers whose style I admire
So that my content is enhanced by their techniques.

Acceptance Criteria:
- Browse 4 pre-built referent creators
- Preview each creator's style characteristics
- Select 0-3 referents with influence weights
- See example of how blend affects output
```

#### Voice Capture

```
US-004: Quick Voice Capture
As a user with a sudden idea,
I want to quickly record my thought in under 2 minutes
So that I don't lose the insight.

Acceptance Criteria:
- One-tap access to recording from dashboard
- Recording starts immediately
- Visual feedback shows recording active
- Auto-stops after silence or manual stop
- Transcript generated within 30 seconds
- Option to "Generate now" or "Save for later"
```

```
US-005: Guided Content Session
As a user ready to create content,
I want a guided voice session with AI follow-ups
So that I produce comprehensive, well-developed content.

Acceptance Criteria:
- Select "Create Content" from dashboard
- Optional: Choose topic/working title
- Record initial thoughts (1-5 minutes)
- AI analyzes and presents 2-4 follow-up questions
- User responds to each via voice or text
- All responses compiled for generation
- Status indicator shows progress
```

```
US-006: Voice Calibration
As a user,
I want the calibration process to be voice-based
So that the AI learns from my actual speaking patterns.

Acceptance Criteria:
- Calibration prompts appear as text
- User responds via voice recording
- AI generates sample content
- User rates via voice: "This sounds like me" or explains what's off
- 3 calibration rounds improve Voice DNA accuracy
- Calibration score displayed
```

#### Content Generation

```
US-007: Generate Blog Post from Voice Session
As a user who completed a voice session,
I want my spoken ideas transformed into a polished blog post
So that I can publish quality content quickly.

Acceptance Criteria:
- Processing shows clear status (Transcribing → Analyzing → Generating)
- Generation completes within 90 seconds
- Output is polished, publish-ready article
- Article length matches spoken content depth
- User's Voice DNA clearly reflected
- Referent influences subtly blended
```

```
US-008: Review Generated Content
As a user,
I want to review generated content in a clean editor
So that I can assess quality and make changes.

Acceptance Criteria:
- Article displayed in distraction-free reader view
- Word count and estimated read time shown
- Copy to clipboard with one tap
- Download as markdown or plain text
- "Refine" option to continue editing
```

#### Refinement

```
US-009: Voice-Based Refinement
As a user reviewing generated content,
I want to request changes by speaking
So that refinement feels as natural as creation.

Acceptance Criteria:
- Tap microphone icon while viewing article
- Speak refinement request: "Make the opening more punchy"
- AI processes and updates article
- Changes highlighted briefly
- Multiple refinement rounds supported
```

```
US-010: Text-Based Refinement
As a user on desktop or preferring typing,
I want to refine content via chat
So that I have flexibility in how I interact.

Acceptance Criteria:
- Chat input available alongside article view
- Type refinement requests
- AI responds with updated article
- Conversation history maintained
- Can switch between voice and text freely
```

```
US-011: Direct Editing
As a user who wants precise control,
I want to directly edit the generated article
So that I can make specific word-level changes.

Acceptance Criteria:
- "Edit mode" makes article text editable
- Standard text editing (select, type, delete)
- Changes auto-saved
- Can request AI help on selected text
- Undo/redo supported
```

#### Content Management

```
US-012: Save and Access Content
As a user,
I want to save generated content and access it later
So that I can manage my content library.

Acceptance Criteria:
- All generated content auto-saved
- Dashboard shows recent content with previews
- Search/filter by date, title, status
- Content states: Draft, Final, Published
- Delete with confirmation
```

```
US-013: Voice Session History
As a user,
I want to see my past voice sessions
So that I can regenerate or reference previous recordings.

Acceptance Criteria:
- Session history shows date, duration, topic
- Transcript viewable for each session
- Can regenerate content from past session
- Can delete session (transcript only, audio already deleted)
```

---

## 5. MVP Feature Requirements

### 5.1 Feature Priority Matrix

| Feature | Priority | Complexity | MVP |
|---------|----------|------------|-----|
| Google OAuth | P0 | Low | ✅ |
| Voice recording (mobile + desktop) | P0 | Medium | ✅ |
| Async transcription (Whisper) | P0 | Medium | ✅ |
| Emotion/enthusiasm detection | P0 | High | ✅ |
| AI follow-up questions | P0 | Medium | ✅ |
| Voice DNA profile storage | P0 | Medium | ✅ |
| Blog post generation | P0 | High | ✅ |
| Voice-based refinement | P0 | Medium | ✅ |
| Text-based refinement | P0 | Low | ✅ |
| Direct article editing | P0 | Low | ✅ |
| Copy/download content | P0 | Low | ✅ |
| Pre-built referent profiles (4) | P1 | Medium | ✅ |
| Referent influence blending | P1 | Medium | ✅ |
| Writing sample upload | P1 | Medium | ✅ |
| Voice-based calibration | P1 | Medium | ✅ |
| Quick capture mode | P1 | Low | ✅ |
| Guided session mode | P1 | Medium | ✅ |
| Content history/library | P1 | Low | ✅ |
| Mobile-responsive UI | P0 | Medium | ✅ |
| Desktop UI | P1 | Medium | ✅ |

### 5.2 Out of Scope (MVP)

- Offline recording
- Background recording (phone locked)
- Real-time AI voice responses
- Multiple content formats (social, email)
- Multi-session synthesis
- Team collaboration
- Direct publishing integrations
- Custom referent creation

---

## 6. Voice Capture System

### 6.1 Recording Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      VOICE CAPTURE ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CLIENT (Browser/PWA)                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  ││
│  │  │  MediaRecorder   │    │  Audio Chunks    │    │   Upload to      │  ││
│  │  │  API             │───▶│  Buffer          │───▶│   Server         │  ││
│  │  │                  │    │  (WebM/Opus)     │    │   (on stop)      │  ││
│  │  └──────────────────┘    └──────────────────┘    └──────────────────┘  ││
│  │         │                                                                ││
│  │         ▼                                                                ││
│  │  ┌──────────────────┐                                                    ││
│  │  │  Audio Visualizer│  Real-time waveform feedback                       ││
│  │  │  (Canvas/WebGL)  │                                                    ││
│  │  └──────────────────┘                                                    ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  SERVER (Vercel Functions)                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  ││
│  │  │  Receive Audio   │    │  Send to         │    │  Store Transcript││
│  │  │  (temp storage)  │───▶│  OpenAI Whisper  │───▶│  Delete Audio    │  ││
│  │  │                  │    │  API             │    │                  │  ││
│  │  └──────────────────┘    └──────────────────┘    └──────────────────┘  ││
│  │                                    │                                     ││
│  │                                    ▼                                     ││
│  │                          ┌──────────────────┐                            ││
│  │                          │  Whisper Output: │                            ││
│  │                          │  - Transcript    │                            ││
│  │                          │  - Timestamps    │                            ││
│  │                          │  - Word-level    │                            ││
│  │                          └──────────────────┘                            ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Recording Component Specification

```typescript
// Component: VoiceRecorder

interface VoiceRecorderProps {
  mode: 'quick' | 'guided';
  maxDuration: number; // seconds (300 for guided, 120 for quick)
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onError: (error: RecordingError) => void;
}

interface RecordingState {
  status: 'idle' | 'recording' | 'paused' | 'processing';
  duration: number; // current recording length
  audioLevel: number; // 0-100 for visualization
  error: string | null;
}

// Features:
// - Visual waveform during recording
// - Duration display (mm:ss)
// - Pause/resume capability
// - Auto-stop on max duration
// - Silence detection (optional auto-stop after 5s silence)
```

### 6.3 Audio Format Specifications

| Property | Specification |
|----------|---------------|
| Format | WebM with Opus codec |
| Sample Rate | 48kHz (browser default) |
| Channels | Mono (1 channel) |
| Bitrate | 32kbps (sufficient for speech) |
| Max File Size | ~2.5MB for 5 minutes |
| Max Duration | 5 minutes (guided), 2 minutes (quick) |

### 6.4 Transcription Pipeline

```typescript
// API Route: /api/voice/transcribe

interface TranscribeRequest {
  sessionId: string;
  audioBlob: Blob;
  mode: 'quick' | 'guided';
}

interface TranscribeResponse {
  sessionId: string;
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
  language: string;
}

interface TranscriptSegment {
  id: number;
  start: number; // timestamp in seconds
  end: number;
  text: string;
  confidence: number;
  words: WordTimestamp[];
}

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

// Processing Steps:
// 1. Receive audio blob
// 2. Upload to temporary storage (or stream directly)
// 3. Call Whisper API with word-level timestamps
// 4. Parse response into structured format
// 5. Delete audio file
// 6. Store transcript with session
// 7. Return transcript to client
```

---

## 7. Voice DNA Engine

### 7.1 Voice DNA Schema

```typescript
interface VoiceDNA {
  meta: {
    id: string;
    userId: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    calibrationScore: number; // 0-100
    dataSourcesSummary: {
      voiceSessions: number;
      writingSamples: number;
      calibrationRounds: number;
    };
  };

  // Extracted from VOICE (primary)
  spokenPatterns: {
    vocabulary: {
      frequentWords: string[];
      uniquePhrases: string[];
      fillerWords: string[]; // "um", "like", "you know"
      preserveFillers: boolean; // user preference
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
      topicsThatExcite: string[]; // detected from prosody
      emphasisPatterns: string[]; // phrases often emphasized
      energyBaseline: number; // 0-1
    };
  };

  // Extracted from WRITING SAMPLES (supplementary)
  writtenPatterns: {
    structurePreference: 'linear' | 'modular' | 'narrative';
    formality: number; // 0-1
    paragraphLength: 'short' | 'medium' | 'long';
    openingStyle: 'hook' | 'context' | 'question' | 'story';
    closingStyle: 'cta' | 'summary' | 'question' | 'reflection';
  };

  // Blended tonal profile
  tonalAttributes: {
    warmth: number; // 0-1
    authority: number;
    humor: number;
    directness: number;
    empathy: number;
  };

  // Referent influences
  referentInfluences: {
    userWeight: number; // always >= 50
    referents: Array<{
      id: string;
      name: string;
      weight: number;
      activeTraits: string[];
    }>;
  };

  // Learned from feedback
  learnedRules: Array<{
    type: 'prefer' | 'avoid' | 'adjust';
    content: string;
    confidence: number;
    sourceCount: number;
  }>;
}
```

### 7.2 Voice Analysis Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       VOICE ANALYSIS PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT: Transcript + Timestamps + Audio Metadata                             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STEP 1: LINGUISTIC ANALYSIS (Claude)                                   ││
│  │                                                                          ││
│  │  Analyze transcript for:                                                 ││
│  │  • Vocabulary complexity and unique phrases                              ││
│  │  • Sentence structure patterns                                           ││
│  │  • Rhetorical devices used                                               ││
│  │  • Storytelling patterns                                                 ││
│  │  • Topic preferences                                                     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STEP 2: PROSODY ANALYSIS (Timestamp-based heuristics)                  ││
│  │                                                                          ││
│  │  Analyze timing data for:                                                ││
│  │  • Speaking pace variations (words per minute)                           ││
│  │  • Pause patterns (long pauses = emphasis or uncertainty)                ││
│  │  • Segment density (more words = excitement/passion)                     ││
│  │  • Questions (rising patterns in word timing)                            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STEP 3: ENTHUSIASM MAPPING                                             ││
│  │                                                                          ││
│  │  Combine linguistic + prosody to identify:                               ││
│  │  • High-energy segments (fast pace, dense content)                       ││
│  │  • Key conviction points (emphasis markers)                              ││
│  │  • Topics that generate excitement                                       ││
│  │  • Natural story beats                                                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STEP 4: PROFILE MERGE                                                  ││
│  │                                                                          ││
│  │  Merge new analysis with existing Voice DNA:                             ││
│  │  • Weighted average for numerical values                                 ││
│  │  • Union + frequency ranking for phrase lists                            ││
│  │  • Recalculate calibration score                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  OUTPUT: Updated VoiceDNA Profile                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Enthusiasm Detection Algorithm

```typescript
// Enthusiasm detection using Whisper timestamps

interface EnthusiasmAnalysis {
  overallEnergy: number; // 0-1
  segments: EnthusiasmSegment[];
  peakMoments: PeakMoment[];
}

interface EnthusiasmSegment {
  startTime: number;
  endTime: number;
  text: string;
  energyScore: number; // 0-1
  indicators: EnthusiasmIndicator[];
}

interface EnthusiasmIndicator {
  type: 'pace_increase' | 'dense_speech' | 'emphasis_words' | 'repetition' | 'pause_before';
  confidence: number;
}

interface PeakMoment {
  timestamp: number;
  text: string;
  reason: string;
  useAs: 'hook' | 'key_point' | 'conclusion' | 'quote';
}

function analyzeEnthusiasm(transcript: TranscribeResponse): EnthusiasmAnalysis {
  const segments = transcript.segments;
  const analyzedSegments: EnthusiasmSegment[] = [];

  for (const segment of segments) {
    const duration = segment.end - segment.start;
    const wordCount = segment.words.length;
    const wordsPerSecond = wordCount / duration;
    
    // Baseline: ~2.5 words/second is normal speech
    // Above 3.0 = excited, below 2.0 = thoughtful/uncertain
    
    const paceScore = Math.min(1, (wordsPerSecond - 2.0) / 2.0);
    
    // Check for emphasis words
    const emphasisWords = ['really', 'absolutely', 'incredible', 'amazing', 'crucial', 'key'];
    const hasEmphasis = emphasisWords.some(w => segment.text.toLowerCase().includes(w));
    
    // Check for repetition (speaker repeating for emphasis)
    const words = segment.text.toLowerCase().split(' ');
    const hasRepetition = words.some((w, i) => i > 0 && words[i-1] === w);
    
    // Calculate energy score
    let energyScore = 0.5; // baseline
    energyScore += paceScore * 0.3;
    if (hasEmphasis) energyScore += 0.1;
    if (hasRepetition) energyScore += 0.1;
    
    analyzedSegments.push({
      startTime: segment.start,
      endTime: segment.end,
      text: segment.text,
      energyScore: Math.min(1, Math.max(0, energyScore)),
      indicators: [] // populated with detected indicators
    });
  }

  // Identify peak moments (top 3 energy segments)
  const peakMoments = analyzedSegments
    .sort((a, b) => b.energyScore - a.energyScore)
    .slice(0, 3)
    .map(seg => ({
      timestamp: seg.startTime,
      text: seg.text,
      reason: 'High energy detected',
      useAs: 'key_point' as const
    }));

  return {
    overallEnergy: analyzedSegments.reduce((sum, s) => sum + s.energyScore, 0) / analyzedSegments.length,
    segments: analyzedSegments,
    peakMoments
  };
}
```

---

## 8. Content Generation Pipeline

### 8.1 Generation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CONTENT GENERATION PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUTS                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Transcript  │  │  Enthusiasm  │  │  Voice DNA   │  │  Referent    │    │
│  │  + Follow-up │  │  Analysis    │  │  Profile     │  │  Profiles    │    │
│  │  Responses   │  │              │  │              │  │              │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │             │
│         └─────────────────┴────────┬────────┴─────────────────┘             │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STEP 1: CONTENT EXTRACTION                                             ││
│  │                                                                          ││
│  │  Claude analyzes all inputs to extract:                                  ││
│  │  • Core thesis/argument                                                  ││
│  │  • Key supporting points                                                 ││
│  │  • Stories and examples mentioned                                        ││
│  │  • Questions raised (explicit or implicit)                               ││
│  │  • High-enthusiasm segments to emphasize                                 ││
│  │                                                                          ││
│  │  Output: ContentOutline                                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STEP 2: STRUCTURE SELECTION                                            ││
│  │                                                                          ││
│  │  Based on content type and Voice DNA preferences, select:                ││
│  │  • Article framework (AIDA, Problem-Solution, Story-Led, etc.)           ││
│  │  • Target length based on content depth                                  ││
│  │  • Opening style (from Voice DNA)                                        ││
│  │  • Closing style (from Voice DNA)                                        ││
│  │                                                                          ││
│  │  Output: StructuredOutline                                               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STEP 3: VOICE-INJECTED GENERATION                                      ││
│  │                                                                          ││
│  │  Claude generates article with system prompt containing:                 ││
│  │  • Complete Voice DNA profile                                            ││
│  │  • Referent influence instructions (weighted)                            ││
│  │  • Structured outline to follow                                          ││
│  │  • Original transcript for reference                                     ││
│  │  • Enthusiasm mapping (what to emphasize)                                ││
│  │                                                                          ││
│  │  Output: BlogPost (markdown)                                             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STEP 4: POST-PROCESSING                                                ││
│  │                                                                          ││
│  │  • Calculate word count                                                  ││
│  │  • Estimate read time                                                    ││
│  │  • Extract title if not provided                                         ││
│  │  • Generate meta description (optional)                                  ││
│  │                                                                          ││
│  │  Output: FinalContent                                                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Follow-Up Question System

```typescript
// Follow-up questions are critical for quality

interface FollowUpSession {
  sessionId: string;
  originalTranscript: string;
  enthusiasmAnalysis: EnthusiasmAnalysis;
  questions: FollowUpQuestion[];
  responses: FollowUpResponse[];
  status: 'generating_questions' | 'awaiting_responses' | 'complete';
}

interface FollowUpQuestion {
  id: string;
  question: string;
  purpose: 'clarify' | 'expand' | 'example' | 'challenge';
  targetArea: string; // which part of transcript this relates to
  priority: number; // 1-3, higher = more important
}

interface FollowUpResponse {
  questionId: string;
  responseType: 'voice' | 'text' | 'skip';
  content: string; // transcript if voice, raw text if typed
  timestamp: string;
}

// Question generation prompt
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

Original transcript:
{transcript}

High-enthusiasm segments:
{enthusiasmSegments}

Generate questions:
`;

// Example output:
// 1. "You mentioned marketers fear losing their creative identity—can you think of a 
//     specific person or moment where you saw this play out?"
// 2. "What would you say to a marketer who argues AI actually enhances creativity 
//     rather than replacing it?"
// 3. "You got really animated talking about 'the human element'—what does that 
//     actually look like in practice?"
```

### 8.3 Voice-Injected System Prompt

```typescript
// Core generation prompt with Voice DNA injection

function buildGenerationPrompt(params: {
  voiceDNA: VoiceDNA;
  contentOutline: ContentOutline;
  originalTranscript: string;
  enthusiasmAnalysis: EnthusiasmAnalysis;
  followUpResponses: FollowUpResponse[];
}): string {
  return `
You are generating a blog post that MUST sound like it was written by the speaker themselves.
You have their Voice DNA profile, their original spoken words, and their follow-up responses.

## CRITICAL INSTRUCTION
This is NOT about writing "in a style"—this is about capturing this SPECIFIC PERSON's voice.
Their spoken words ARE the content. Your job is to structure and polish, not to add your own ideas.

## VOICE DNA PROFILE

### How This Person Speaks
${JSON.stringify(params.voiceDNA.spokenPatterns, null, 2)}

### Their Written Style (from samples)
${JSON.stringify(params.voiceDNA.writtenPatterns, null, 2)}

### Tonal Qualities
- Warmth: ${params.voiceDNA.tonalAttributes.warmth}/1 (${params.voiceDNA.tonalAttributes.warmth > 0.6 ? 'warm and friendly' : 'more reserved'})
- Authority: ${params.voiceDNA.tonalAttributes.authority}/1
- Humor: ${params.voiceDNA.tonalAttributes.humor}/1 (${params.voiceDNA.tonalAttributes.humor > 0.4 ? 'incorporate humor' : 'keep it serious'})
- Directness: ${params.voiceDNA.tonalAttributes.directness}/1

### Phrases They Actually Use
${params.voiceDNA.spokenPatterns.vocabulary.uniquePhrases.join(', ')}

### Phrases to Avoid (Not Their Style)
${params.voiceDNA.learnedRules.filter(r => r.type === 'avoid').map(r => r.content).join(', ')}

${buildReferentSection(params.voiceDNA.referentInfluences)}

## THEIR ORIGINAL WORDS

### Main Recording
${params.originalTranscript}

### Follow-Up Responses
${params.followUpResponses.map(r => `Q: ${r.questionId}\nA: ${r.content}`).join('\n\n')}

## ENTHUSIASM MAP (Emphasize These)
${params.enthusiasmAnalysis.peakMoments.map(p => `- "${p.text}" → Use as: ${p.useAs}`).join('\n')}

## CONTENT STRUCTURE
${JSON.stringify(params.contentOutline, null, 2)}

## OUTPUT REQUIREMENTS

1. Write the complete blog post in THEIR voice
2. Use their actual phrases and examples from the transcript
3. Structure according to the outline
4. Emphasize the high-enthusiasm moments
5. Keep their natural rhythm (sentence length patterns)
6. Do NOT add ideas they didn't express
7. Polish the language but preserve authenticity
8. Apply referent influences subtly (they enhance, not replace)

## BEGIN BLOG POST
`;
}

function buildReferentSection(influences: VoiceDNA['referentInfluences']): string {
  if (influences.referents.length === 0) {
    return `## REFERENT INFLUENCES\nNone selected—write purely in the user's voice.`;
  }

  return `
## REFERENT INFLUENCES

The user's voice is ${influences.userWeight}% of the output. Apply these influences for the remaining ${100 - influences.userWeight}%:

${influences.referents.map(r => `
### ${r.name} (${r.weight}%)
Apply these traits: ${r.activeTraits.join(', ')}
`).join('\n')}

BLENDING RULES:
- User's voice is ALWAYS dominant
- Referent influences are "seasoning," not main ingredients
- When in doubt, favor the user's natural patterns
- Don't make it obvious that referents were applied
`;
}
```

---

## 9. Technical Architecture

### 9.1 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 15 | App Router, React 19, SSR |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS + shadcn/ui | Mobile-first UI |
| **Auth** | Better Auth | Google OAuth |
| **Database** | PostgreSQL (Neon) | Persistent storage |
| **ORM** | Drizzle | Type-safe queries |
| **Transcription** | OpenAI Whisper API | Speech-to-text |
| **LLM** | Claude API (Anthropic) | Analysis + generation |
| **Caching** | Upstash Redis | Session state |
| **Hosting** | Vercel | Edge functions |
| **Local Dev** | Docker | PostgreSQL container |

### 9.2 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VOICEDNA ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CLIENT LAYER                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Next.js App (React 19) - Mobile-First PWA                              ││
│  │                                                                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │  Dashboard  │  │   Voice     │  │  Content    │  │  Settings   │    ││
│  │  │   Home      │  │  Recorder   │  │  Editor     │  │   Voice DNA │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  │         │                │                │                │            ││
│  │         └────────────────┴────────────────┴────────────────┘            ││
│  │                                    │                                     ││
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │  MediaRecorder API │ Audio Visualizer │ React Query State      │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  API LAYER                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Next.js API Routes (Vercel Serverless)                                 ││
│  │                                                                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │ /api/auth   │  │ /api/voice  │  │/api/content │  │/api/session │    ││
│  │  │             │  │             │  │             │  │             │    ││
│  │  │ Better Auth │  │ • upload    │  │ • generate  │  │ • create    │    ││
│  │  │ Google OAuth│  │ • transcribe│  │ • refine    │  │ • questions │    ││
│  │  │             │  │ • analyze   │  │ • save      │  │ • respond   │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  SERVICE LAYER                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  ┌─────────────────────┐  ┌─────────────────────┐                       ││
│  │  │  TRANSCRIPTION      │  │  VOICE DNA ENGINE   │                       ││
│  │  │  SERVICE            │  │                     │                       ││
│  │  │                     │  │  • Voice Analyzer   │                       ││
│  │  │  • Whisper Client   │  │  • Writing Analyzer │                       ││
│  │  │  • Audio Processing │  │  • Profile Builder  │                       ││
│  │  │  • Timestamp Parse  │  │  • Enthusiasm Map   │                       ││
│  │  └─────────────────────┘  └─────────────────────┘                       ││
│  │                                                                          ││
│  │  ┌─────────────────────┐  ┌─────────────────────┐                       ││
│  │  │  CONTENT ENGINE     │  │  FOLLOW-UP ENGINE   │                       ││
│  │  │                     │  │                     │                       ││
│  │  │  • Outline Builder  │  │  • Question Gen     │                       ││
│  │  │  • Prompt Composer  │  │  • Response Process │                       ││
│  │  │  • Claude Client    │  │  • Session Manager  │                       ││
│  │  │  • Post-Processor   │  │                     │                       ││
│  │  └─────────────────────┘  └─────────────────────┘                       ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  DATA LAYER                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         ││
│  │  │  Neon Postgres  │  │  Upstash Redis  │  │  External APIs  │         ││
│  │  │                 │  │                 │  │                 │         ││
│  │  │  • Users        │  │  • Sessions     │  │  • Whisper      │         ││
│  │  │  • VoiceDNA     │  │  • Rate Limits  │  │  • Claude       │         ││
│  │  │  • Content      │  │  • Cache        │  │                 │         ││
│  │  │  • Transcripts  │  │                 │  │                 │         ││
│  │  │  • Referents    │  │                 │  │                 │         ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘         ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Directory Structure

```
voicedna/
├── .claude/                      # Claude Code configuration
├── .cursor/rules/                # Cursor AI rules
├── docs/
│   └── PRD-v2.md                 # This document
├── drizzle/                      # Database migrations
├── public/
│   └── referents/                # Referent creator images
├── src/
│   ├── app/
│   │   ├── (auth)/               # Protected routes
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   ├── record/           # Voice recording
│   │   │   │   ├── quick/        # Quick capture mode
│   │   │   │   └── guided/       # Guided session mode
│   │   │   ├── session/
│   │   │   │   └── [id]/         # Active session (follow-ups)
│   │   │   ├── content/
│   │   │   │   ├── [id]/         # View/edit content
│   │   │   │   └── library/      # Content history
│   │   │   ├── settings/
│   │   │   │   ├── voice-dna/    # Voice profile settings
│   │   │   │   ├── referents/    # Manage referent influences
│   │   │   │   └── samples/      # Writing samples
│   │   │   └── onboarding/       # New user onboarding
│   │   ├── api/
│   │   │   ├── auth/             # Better Auth
│   │   │   ├── voice/
│   │   │   │   ├── upload/       # Audio upload endpoint
│   │   │   │   ├── transcribe/   # Whisper transcription
│   │   │   │   └── analyze/      # Voice DNA analysis
│   │   │   ├── session/
│   │   │   │   ├── create/       # Start new session
│   │   │   │   ├── questions/    # Generate follow-ups
│   │   │   │   └── respond/      # Submit follow-up response
│   │   │   ├── content/
│   │   │   │   ├── generate/     # Generate blog post
│   │   │   │   ├── refine/       # Refine existing content
│   │   │   │   └── [id]/         # CRUD operations
│   │   │   └── onboarding/       # Onboarding endpoints
│   │   ├── layout.tsx
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── auth/
│   │   │   └── SignInButton.tsx
│   │   ├── voice/
│   │   │   ├── VoiceRecorder.tsx       # Core recording component
│   │   │   ├── AudioVisualizer.tsx     # Waveform display
│   │   │   ├── RecordingControls.tsx   # Start/stop/pause
│   │   │   └── TranscriptPreview.tsx   # Show transcript
│   │   ├── session/
│   │   │   ├── FollowUpQuestion.tsx    # Display question
│   │   │   ├── VoiceResponse.tsx       # Record response
│   │   │   ├── TextResponse.tsx        # Type response
│   │   │   └── SessionProgress.tsx     # Status indicator
│   │   ├── content/
│   │   │   ├── ContentEditor.tsx       # Article editor
│   │   │   ├── ContentViewer.tsx       # Read-only view
│   │   │   ├── RefineChat.tsx          # Chat-based refinement
│   │   │   ├── VoiceRefine.tsx         # Voice-based refinement
│   │   │   └── ContentActions.tsx      # Copy/download/save
│   │   ├── voice-dna/
│   │   │   ├── VoiceDNACard.tsx        # Profile summary
│   │   │   ├── CalibrationFlow.tsx     # Voice calibration
│   │   │   └── StrengthIndicator.tsx   # DNA completeness
│   │   ├── referents/
│   │   │   ├── ReferentCard.tsx        # Single referent
│   │   │   ├── ReferentSelector.tsx    # Choose referents
│   │   │   └── BlendSliders.tsx        # Adjust weights
│   │   ├── onboarding/
│   │   │   ├── VoiceIntroStep.tsx      # Record intro
│   │   │   ├── FollowUpStep.tsx        # Answer questions
│   │   │   ├── SampleUploadStep.tsx    # Add writing samples
│   │   │   └── ReferentSelectStep.tsx  # Choose influences
│   │   ├── dashboard/
│   │   │   ├── QuickActions.tsx        # Record buttons
│   │   │   ├── RecentContent.tsx       # Content list
│   │   │   └── VoiceDNAStatus.tsx      # Profile status
│   │   └── ui/                   # shadcn/ui components
│   ├── lib/
│   │   ├── voice/
│   │   │   ├── recorder.ts             # MediaRecorder wrapper
│   │   │   ├── audioUtils.ts           # Audio processing
│   │   │   └── visualizer.ts           # Waveform logic
│   │   ├── transcription/
│   │   │   ├── whisper.ts              # Whisper API client
│   │   │   └── timestampParser.ts      # Parse word timestamps
│   │   ├── analysis/
│   │   │   ├── enthusiasmDetector.ts   # Prosody analysis
│   │   │   ├── linguisticAnalyzer.ts   # Text analysis
│   │   │   └── voiceDNABuilder.ts      # Profile construction
│   │   ├── content/
│   │   │   ├── outlineBuilder.ts       # Structure content
│   │   │   ├── promptComposer.ts       # Build generation prompts
│   │   │   └── postProcessor.ts        # Clean up output
│   │   ├── session/
│   │   │   ├── followUpGenerator.ts    # Generate questions
│   │   │   └── sessionManager.ts       # Session state
│   │   ├── referents/
│   │   │   ├── sethGodin.ts
│   │   │   ├── annHandley.ts
│   │   │   ├── garyVee.ts
│   │   │   └── jamesClear.ts
│   │   ├── ai/
│   │   │   ├── claude.ts               # Claude client
│   │   │   └── prompts/
│   │   │       ├── analysis.ts
│   │   │       ├── followUp.ts
│   │   │       ├── generation.ts
│   │   │       └── refinement.ts
│   │   ├── auth.ts                     # Better Auth config
│   │   ├── auth-client.ts              # Client auth
│   │   ├── db.ts                       # Database connection
│   │   ├── schema.ts                   # Drizzle schema
│   │   └── utils.ts                    # Helpers
│   └── types/
│       ├── voice.ts
│       ├── session.ts
│       ├── content.ts
│       └── voiceDNA.ts
├── .env.example
├── CLAUDE.md                     # Claude Code instructions
├── components.json               # shadcn/ui config
├── docker-compose.yml
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### 9.4 Key Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "better-auth": "^1.0.0",
    "drizzle-orm": "^0.30.0",
    "@neondatabase/serverless": "^0.9.0",
    "ai": "^4.0.0",
    "@ai-sdk/anthropic": "^1.0.0",
    "openai": "^4.50.0",
    "@upstash/redis": "^1.28.0",
    "@radix-ui/react-*": "various",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.300.0",
    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "nanoid": "^5.0.0",
    "date-fns": "^3.0.0"
  }
}
```

---

## 10. Data Models

### 10.1 Database Schema

```typescript
// src/lib/schema.ts

import { 
  pgTable, text, timestamp, uuid, jsonb, 
  integer, boolean, pgEnum 
} from 'drizzle-orm/pg-core';

// ============================================
// ENUMS
// ============================================

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

// ============================================
// USERS
// ============================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  role: userRoleEnum('role').default('user').notNull(),
  onboardingStatus: onboardingStatusEnum('onboarding_status').default('not_started').notNull(),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// VOICE DNA PROFILES
// ============================================

export const voiceDNAProfiles = pgTable('voice_dna_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  
  // Voice-derived patterns
  spokenPatterns: jsonb('spoken_patterns').$type<SpokenPatterns>(),
  
  // Writing sample-derived patterns
  writtenPatterns: jsonb('written_patterns').$type<WrittenPatterns>(),
  
  // Blended tonal attributes
  tonalAttributes: jsonb('tonal_attributes').$type<TonalAttributes>(),
  
  // Referent influences
  referentInfluences: jsonb('referent_influences').$type<ReferentInfluences>(),
  
  // Learned rules from feedback
  learnedRules: jsonb('learned_rules').$type<LearnedRule[]>().default([]),
  
  // Calibration
  calibrationScore: integer('calibration_score').default(0),
  calibrationRoundsCompleted: integer('calibration_rounds_completed').default(0),
  
  // Stats
  voiceSessionsAnalyzed: integer('voice_sessions_analyzed').default(0),
  writingSamplesAnalyzed: integer('writing_samples_analyzed').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// VOICE SESSIONS
// ============================================

export const voiceSessions = pgTable('voice_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  mode: sessionModeEnum('mode').notNull(),
  status: sessionStatusEnum('status').notNull().default('recording'),
  
  // Initial recording
  transcript: text('transcript'),
  durationSeconds: integer('duration_seconds'),
  wordTimestamps: jsonb('word_timestamps').$type<WordTimestamp[]>(),
  
  // Analysis results
  enthusiasmAnalysis: jsonb('enthusiasm_analysis').$type<EnthusiasmAnalysis>(),
  contentOutline: jsonb('content_outline').$type<ContentOutline>(),
  
  // Follow-up Q&A
  followUpQuestions: jsonb('follow_up_questions').$type<FollowUpQuestion[]>().default([]),
  followUpResponses: jsonb('follow_up_responses').$type<FollowUpResponse[]>().default([]),
  
  // Generated content reference
  generatedContentId: uuid('generated_content_id'),
  
  // Metadata
  title: text('title'), // Auto-generated or user-provided
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// FOLLOW-UP RESPONSES
// ============================================

export const followUpResponses = pgTable('follow_up_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => voiceSessions.id, { onDelete: 'cascade' }).notNull(),
  questionId: text('question_id').notNull(),
  
  responseType: responseTypeEnum('response_type').notNull(),
  transcript: text('transcript'), // For voice responses
  textContent: text('text_content'), // For text responses
  durationSeconds: integer('duration_seconds'), // For voice responses
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// GENERATED CONTENT
// ============================================

export const generatedContent = pgTable('generated_content', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionId: uuid('session_id').references(() => voiceSessions.id).notNull(),
  
  // Content
  title: text('title').notNull(),
  content: text('content').notNull(), // Markdown
  wordCount: integer('word_count').notNull(),
  readTimeMinutes: integer('read_time_minutes').notNull(),
  
  // Status
  status: contentStatusEnum('status').default('draft').notNull(),
  
  // Generation context
  voiceDNASnapshot: jsonb('voice_dna_snapshot').$type<VoiceDNA>(), // Snapshot at generation time
  referentInfluencesUsed: jsonb('referent_influences_used').$type<ReferentInfluences>(),
  
  // Versioning
  version: integer('version').default(1).notNull(),
  parentVersionId: uuid('parent_version_id'),
  
  // Metadata
  modelUsed: text('model_used'),
  generationTimeMs: integer('generation_time_ms'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// WRITING SAMPLES
// ============================================

export const writingSamples = pgTable('writing_samples', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  sourceType: text('source_type').notNull(), // 'paste', 'url', 'file'
  sourceUrl: text('source_url'),
  fileName: text('file_name'),
  
  content: text('content').notNull(),
  wordCount: integer('word_count').notNull(),
  
  // Extracted patterns
  extractedPatterns: jsonb('extracted_patterns').$type<ExtractedWritingPatterns>(),
  
  // Whether it's been incorporated into Voice DNA
  analyzedAt: timestamp('analyzed_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// REFERENT CREATORS (Pre-built)
// ============================================

export const referentCreators = pgTable('referent_creators', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  
  // Style profile
  styleProfile: jsonb('style_profile').$type<ReferentStyleProfile>().notNull(),
  
  // Is this a pre-built referent?
  isPreBuilt: boolean('is_pre_built').default(true).notNull(),
  
  // For user-created referents (future)
  createdByUserId: text('created_by_user_id').references(() => users.id),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// CALIBRATION ROUNDS
// ============================================

export const calibrationRounds = pgTable('calibration_rounds', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  roundNumber: integer('round_number').notNull(),
  
  // Prompt and response
  promptText: text('prompt_text').notNull(),
  userResponseTranscript: text('user_response_transcript'),
  userResponseType: responseTypeEnum('user_response_type'),
  
  // Generated sample
  generatedSample: text('generated_sample'),
  
  // User rating
  rating: integer('rating'), // 1-5
  feedbackTranscript: text('feedback_transcript'), // Voice feedback
  feedbackText: text('feedback_text'), // Text feedback
  
  // Analysis of this round
  insightsExtracted: jsonb('insights_extracted').$type<CalibrationInsight[]>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// TYPE DEFINITIONS
// ============================================

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

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface EnthusiasmAnalysis {
  overallEnergy: number;
  segments: Array<{
    startTime: number;
    endTime: number;
    text: string;
    energyScore: number;
  }>;
  peakMoments: Array<{
    timestamp: number;
    text: string;
    reason: string;
    useAs: 'hook' | 'key_point' | 'conclusion' | 'quote';
  }>;
}

export interface ContentOutline {
  thesis: string;
  keyPoints: string[];
  stories: string[];
  suggestedStructure: string;
  estimatedLength: 'short' | 'medium' | 'long';
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  purpose: 'clarify' | 'expand' | 'example' | 'challenge';
  targetArea: string;
  priority: number;
}

export interface FollowUpResponse {
  questionId: string;
  responseType: 'voice' | 'text' | 'skip';
  content: string;
  timestamp: string;
}

export interface ReferentStyleProfile {
  description: string;
  keyCharacteristics: string[];
  linguisticPatterns: {
    sentenceLength: 'short' | 'medium' | 'long' | 'varied';
    vocabularyLevel: 'accessible' | 'professional' | 'technical';
    signaturePhrases: string[];
  };
  tonalAttributes: TonalAttributes;
  promptGuidance: string;
}

export interface ExtractedWritingPatterns {
  avgSentenceLength: number;
  avgParagraphLength: number;
  vocabularyComplexity: number;
  commonPhrases: string[];
  structuralPatterns: string[];
}

export interface CalibrationInsight {
  attribute: string;
  adjustment: 'increase' | 'decrease' | 'confirm';
  confidence: number;
  evidence: string;
}
```

---

## 11. API Specifications

### 11.1 API Routes Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/*` | Better Auth (Google OAuth) |
| POST | `/api/voice/upload` | Upload audio for transcription |
| POST | `/api/voice/transcribe` | Transcribe uploaded audio |
| POST | `/api/voice/analyze` | Analyze transcript for Voice DNA |
| POST | `/api/session/create` | Start new voice session |
| GET | `/api/session/[id]` | Get session status/details |
| POST | `/api/session/[id]/questions` | Generate follow-up questions |
| POST | `/api/session/[id]/respond` | Submit follow-up response |
| POST | `/api/content/generate` | Generate blog post |
| POST | `/api/content/[id]/refine` | Refine existing content |
| GET | `/api/content/[id]` | Get content details |
| PATCH | `/api/content/[id]` | Update content |
| DELETE | `/api/content/[id]` | Delete content |
| GET | `/api/content` | List user's content |
| GET | `/api/voice-dna` | Get user's Voice DNA profile |
| PATCH | `/api/voice-dna` | Update Voice DNA settings |
| POST | `/api/samples` | Add writing sample |
| GET | `/api/referents` | List available referents |
| POST | `/api/calibration/start` | Start calibration round |
| POST | `/api/calibration/respond` | Submit calibration response |

### 11.2 Key API Specifications

#### POST /api/voice/upload

```typescript
// Upload audio blob for processing

interface UploadRequest {
  audioBlob: Blob; // FormData
  sessionId: string;
  mode: 'quick' | 'guided' | 'follow_up' | 'calibration';
}

interface UploadResponse {
  uploadId: string;
  status: 'uploaded' | 'error';
  durationSeconds: number;
  fileSizeBytes: number;
}
```

#### POST /api/voice/transcribe

```typescript
// Transcribe uploaded audio

interface TranscribeRequest {
  uploadId: string;
  sessionId: string;
}

interface TranscribeResponse {
  transcript: string;
  durationSeconds: number;
  wordTimestamps: WordTimestamp[];
  language: string;
  status: 'complete' | 'error';
}
```

#### POST /api/session/create

```typescript
// Create new voice session

interface CreateSessionRequest {
  mode: 'quick' | 'guided';
  title?: string; // Optional working title
}

interface CreateSessionResponse {
  sessionId: string;
  mode: 'quick' | 'guided';
  status: 'recording';
  createdAt: string;
}
```

#### POST /api/session/[id]/questions

```typescript
// Generate follow-up questions based on transcript

interface GenerateQuestionsRequest {
  sessionId: string; // In URL
  transcript: string;
  enthusiasmAnalysis: EnthusiasmAnalysis;
}

interface GenerateQuestionsResponse {
  questions: FollowUpQuestion[];
  sessionStatus: 'follow_ups';
}
```

#### POST /api/content/generate

```typescript
// Generate blog post from session

interface GenerateContentRequest {
  sessionId: string;
  options?: {
    referentOverrides?: ReferentInfluences;
    targetLength?: 'short' | 'medium' | 'long';
  };
}

interface GenerateContentResponse {
  contentId: string;
  title: string;
  content: string; // Markdown
  wordCount: number;
  readTimeMinutes: number;
  status: 'draft';
}
```

#### POST /api/content/[id]/refine

```typescript
// Refine content via voice or text

interface RefineContentRequest {
  contentId: string; // In URL
  refinementType: 'voice' | 'text';
  instruction: string; // Transcript if voice, raw text if typed
}

interface RefineContentResponse {
  contentId: string;
  content: string; // Updated markdown
  version: number;
  changes: string; // Summary of changes made
}
```

---

## 12. UI/UX Specifications

### 12.1 Design Principles

1. **Voice-First**: Recording is always one tap away
2. **Mobile-Native**: Designed for thumb reach zones
3. **Minimal Friction**: Reduce taps to create content
4. **Clear Feedback**: Always show what's happening
5. **Graceful Degradation**: Works without JavaScript for core reading

### 12.2 Color System (Dark Mode)

```css
--background: 0 0% 3.9%;
--foreground: 0 0% 98%;
--primary: 250 95% 64%;      /* Vibrant purple for actions */
--primary-foreground: 0 0% 100%;
--secondary: 240 4.8% 15.9%;
--muted: 240 3.7% 15.9%;
--accent: 250 95% 64%;
--destructive: 0 84.2% 60.2%;
--recording: 0 84% 60%;      /* Red for recording state */
--success: 142 76% 36%;      /* Green for complete */
```

### 12.3 Page Layouts

#### Dashboard (Mobile)

```
┌─────────────────────────────────────────┐
│  VoiceDNA                      [Avatar] │
├─────────────────────────────────────────┤
│                                         │
│  Good morning, Enrique                  │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  🎤  Create Content                 ││
│  │                                     ││
│  │  Tap to start a guided session      ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌────────────────┐ ┌──────────────────┐│
│  │ ⚡ Quick       │ │ 🎯 Guided        ││
│  │    Capture     │ │    Session       ││
│  │                │ │                  ││
│  │ < 2 min        │ │ 2-5 min          ││
│  └────────────────┘ └──────────────────┘│
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Recent Content                    See all│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📄 Why AI Won't Replace Marketers  ││
│  │    Draft • 1,245 words • Today      ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📄 The Solo Marketer's Tech Stack  ││
│  │    Final • 2,100 words • Yesterday  ││
│  └─────────────────────────────────────┘│
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Voice DNA                              │
│  ┌─────────────────────────────────────┐│
│  │ ████████████░░░░░░░░ 62% calibrated ││
│  │ [Complete Setup →]                  ││
│  └─────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│  [🏠]     [📚]     [⚙️]                │
│  Home    Library   Settings             │
└─────────────────────────────────────────┘
```

#### Voice Recording (Mobile)

```
┌─────────────────────────────────────────┐
│  ← Cancel              Guided Session   │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│                                         │
│          What's on your mind?           │
│                                         │
│       Talk through your idea for        │
│          today's blog post.             │
│                                         │
│                                         │
│                                         │
│           ┌─────────────────┐           │
│           │                 │           │
│           │   ~~~~~~~~      │           │
│           │  ~~~~~~~~~~     │  Waveform │
│           │   ~~~~~~~~      │           │
│           │                 │           │
│           └─────────────────┘           │
│                                         │
│              ◉ 02:34 / 05:00            │
│                                         │
│                                         │
│                                         │
│           ┌─────────────────┐           │
│           │                 │           │
│           │       ⏹️        │           │
│           │      STOP       │           │
│           │                 │           │
│           └─────────────────┘           │
│                                         │
│                                         │
│              [Pause]                    │
│                                         │
└─────────────────────────────────────────┘
```

#### Follow-Up Questions (Mobile)

```
┌─────────────────────────────────────────┐
│  ← Back                      2 of 3     │
├─────────────────────────────────────────┤
│                                         │
│  Let's dig deeper...                    │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │  "You mentioned that marketers      ││
│  │   fear losing their creative        ││
│  │   identity to AI. Can you think     ││
│  │   of a specific person or moment    ││
│  │   where you saw this play out?"     ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│                                         │
│  How would you like to respond?         │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  🎤  Record Answer                  ││
│  │      Recommended • 30-60 seconds    ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  ⌨️  Type Answer                    ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  ⏭️  Skip This Question             ││
│  └─────────────────────────────────────┘│
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

#### Content Generation Status (Mobile)

```
┌─────────────────────────────────────────┐
│                                    ✕    │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│                                         │
│                                         │
│              Creating your              │
│               blog post...              │
│                                         │
│                                         │
│           ┌─────────────────┐           │
│           │                 │           │
│           │       ✨        │           │
│           │                 │           │
│           └─────────────────┘           │
│                                         │
│                                         │
│  ✓ Transcription complete               │
│  ✓ Voice patterns analyzed              │
│  ✓ Follow-ups incorporated              │
│  ● Generating article...                │
│  ○ Final polish                         │
│                                         │
│                                         │
│                                         │
│         Usually takes 30-60 seconds     │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

#### Content Viewer (Mobile)

```
┌─────────────────────────────────────────┐
│  ← Back                [Edit] [Share]   │
├─────────────────────────────────────────┤
│                                         │
│  Why AI Won't Replace                   │
│  Creative Marketers                     │
│                                         │
│  Draft • 1,245 words • 6 min read       │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Here's the thing about AI and          │
│  creativity: everyone's asking the      │
│  wrong question.                        │
│                                         │
│  They're asking "Will AI replace        │
│  creative jobs?" when they should       │
│  be asking "How will AI change what     │
│  creativity means?"                     │
│                                         │
│  I've been thinking about this a lot    │
│  lately, especially after watching...   │
│                                         │
│  [Article continues...]                 │
│                                         │
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│  │ 🎤      │ │ 💬      │ │ 📋 Copy   │ │
│  │ Refine  │ │ Chat    │ │           │ │
│  │ Voice   │ │ Refine  │ │           │ │
│  └─────────┘ └─────────┘ └───────────┘ │
└─────────────────────────────────────────┘
```

#### Desktop Layout (Split View)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  VoiceDNA                                              [Voice DNA] [⚙️] [Avatar]│
├───────────────────────────────────┬─────────────────────────────────────────────┤
│                                   │                                             │
│  Session                          │  Generated Content                          │
│                                   │                                             │
│  ┌─────────────────────────────┐  │  Why AI Won't Replace                       │
│  │ Original Recording          │  │  Creative Marketers                         │
│  │                             │  │                                             │
│  │ "So I've been thinking      │  │  ─────────────────────────────────────────  │
│  │  about why marketers        │  │                                             │
│  │  resist AI tools..."        │  │  Here's the thing about AI and              │
│  │                             │  │  creativity: everyone's asking the          │
│  │  [▶ Play] 02:34             │  │  wrong question.                            │
│  └─────────────────────────────┘  │                                             │
│                                   │  They're asking "Will AI replace            │
│  Follow-Up Responses              │  creative jobs?" when they should           │
│                                   │  be asking "How will AI change what         │
│  ┌─────────────────────────────┐  │  creativity means?"                         │
│  │ Q: Example of fear?         │  │                                             │
│  │ A: "Yeah, my colleague      │  │  I've been thinking about this a lot        │
│  │     Sarah..."               │  │  lately, especially after watching          │
│  └─────────────────────────────┘  │  my colleague Sarah freeze up when          │
│                                   │  her company introduced AI tools...         │
│  ┌─────────────────────────────┐  │                                             │
│  │ Q: Counter-argument?        │  │  [Article continues...]                     │
│  │ A: "I guess you could       │  │                                             │
│  │     say..."                 │  │                                             │
│  └─────────────────────────────┘  │                                             │
│                                   │                                             │
│  ─────────────────────────────    │                                             │
│                                   │                                             │
│  Refine                           ├─────────────────────────────────────────────┤
│                                   │  Voice Blend                                │
│  ┌─────────────────────────────┐  │  You: 70%  •  Seth Godin: 20%  •           │
│  │ 🎤 Speak or type...         │  │  James Clear: 10%                          │
│  └─────────────────────────────┘  │  [Adjust]                                  │
│                                   ├─────────────────────────────────────────────┤
│                                   │  [Copy] [Download] [Mark as Final]          │
└───────────────────────────────────┴─────────────────────────────────────────────┘
```

### 12.4 Component Specifications

#### VoiceRecorder Component

```typescript
interface VoiceRecorderProps {
  mode: 'quick' | 'guided' | 'follow_up' | 'calibration';
  maxDuration: number; // seconds
  prompt?: string; // Text to display above recorder
  onComplete: (audio: Blob, duration: number) => void;
  onCancel: () => void;
}

// States:
// - idle: Ready to record
// - recording: Actively recording
// - paused: Recording paused
// - processing: Uploading/transcribing

// Visual elements:
// - Waveform visualizer (real-time)
// - Duration counter
// - Max duration indicator
// - Record/Stop button (large, thumb-friendly)
// - Pause button (secondary)
// - Cancel button (top left)
```

#### FollowUpQuestionCard Component

```typescript
interface FollowUpQuestionCardProps {
  question: FollowUpQuestion;
  questionNumber: number;
  totalQuestions: number;
  onVoiceResponse: (audio: Blob) => void;
  onTextResponse: (text: string) => void;
  onSkip: () => void;
}

// Layout:
// - Question text prominently displayed
// - Three action buttons: Voice, Text, Skip
// - Progress indicator (2 of 3)
```

#### ContentEditor Component

```typescript
interface ContentEditorProps {
  content: GeneratedContent;
  onSave: (content: string) => void;
  onRefine: (instruction: string, type: 'voice' | 'text') => void;
  voiceDNA: VoiceDNA;
}

// Features:
// - Markdown rendering in view mode
// - Raw markdown editing in edit mode
// - Voice refinement button (opens recorder)
// - Text refinement chat input
// - Copy/Download buttons
// - Status indicator (Draft/Final)
```

---

## 13. Referent Creator System

### 13.1 Pre-Built Referents (MVP)

Four carefully selected referents with distinct, complementary styles:

| Referent | Key Trait | When to Use |
|----------|-----------|-------------|
| Seth Godin | Punchy, provocative, short | Add impact and memorability |
| Ann Handley | Warm, conversational, witty | Add friendliness and approachability |
| Gary Vaynerchuk | Direct, urgent, energetic | Add urgency and conviction |
| James Clear | Clear, structured, evidence-based | Add clarity and credibility |

### 13.2 Referent Profile: Seth Godin

```typescript
export const sethGodinProfile: ReferentStyleProfile = {
  id: 'ref-seth-godin',
  name: 'Seth Godin',
  slug: 'seth-godin',
  description: 'Marketing legend known for short, punchy, provocative insights',
  imageUrl: '/referents/seth-godin.jpg',
  
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
    signaturePhrases: [
      'Here\'s the thing',
      'It turns out',
      'The question is',
      'Perhaps',
    ],
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

### 13.3 Referent Profile: Ann Handley

```typescript
export const annHandleyProfile: ReferentStyleProfile = {
  id: 'ref-ann-handley',
  name: 'Ann Handley',
  slug: 'ann-handley',
  description: 'Content marketing pioneer with warm, witty, conversational style',
  imageUrl: '/referents/ann-handley.jpg',
  
  keyCharacteristics: [
    'Warm, conversational tone',
    'Self-deprecating humor',
    'Direct reader address ("you")',
    'Practical, actionable advice',
    'Empathetic acknowledgment',
  ],
  
  linguisticPatterns: {
    sentenceLength: 'medium',
    vocabularyLevel: 'accessible',
    signaturePhrases: [
      'Here\'s the thing',
      'I know, I know',
      'The truth is',
      'So what does this mean for you?',
    ],
  },
  
  tonalAttributes: {
    warmth: 0.9,
    authority: 0.7,
    humor: 0.6,
    directness: 0.8,
    empathy: 0.95,
  },
  
  promptGuidance: `
Apply Ann Handley's influence by:
- Writing like talking to a smart friend
- Using "you" frequently
- Adding occasional self-deprecating humor
- Acknowledging reader struggles before solutions
- Using contractions freely
- Including practical takeaways
`,
};
```

### 13.4 Referent Profile: Gary Vaynerchuk

```typescript
export const garyVeeProfile: ReferentStyleProfile = {
  id: 'ref-gary-vee',
  name: 'Gary Vaynerchuk',
  slug: 'gary-vee',
  description: 'High-energy entrepreneur with raw, unfiltered authenticity',
  imageUrl: '/referents/gary-vee.jpg',
  
  keyCharacteristics: [
    'High energy and urgency',
    'Raw authenticity',
    'Repetition for emphasis',
    'Tough love approach',
    'Action-focused',
  ],
  
  linguisticPatterns: {
    sentenceLength: 'short',
    vocabularyLevel: 'accessible',
    signaturePhrases: [
      'Look',
      'Here\'s the truth',
      'Stop making excuses',
      'Execute',
    ],
  },
  
  tonalAttributes: {
    warmth: 0.5,
    authority: 0.95,
    humor: 0.3,
    directness: 1.0,
    empathy: 0.4,
  },
  
  promptGuidance: `
Apply Gary Vee's influence by:
- Being direct and unapologetic
- Using short, punchy sentences
- Repeating key points
- Challenging the reader to act
- Focusing on execution over theory
- Showing tough love
`,
};
```

### 13.5 Referent Profile: James Clear

```typescript
export const jamesClearProfile: ReferentStyleProfile = {
  id: 'ref-james-clear',
  name: 'James Clear',
  slug: 'james-clear',
  description: 'Habit expert with clear, research-backed, actionable insights',
  imageUrl: '/referents/james-clear.jpg',
  
  keyCharacteristics: [
    'Crystal clear explanations',
    'Research-backed claims',
    'Practical frameworks',
    'Illustrative stories',
    'Memorable one-liners',
  ],
  
  linguisticPatterns: {
    sentenceLength: 'medium',
    vocabularyLevel: 'professional',
    signaturePhrases: [
      'The lesson is clear:',
      'Here\'s what matters:',
      'The key insight is',
    ],
  },
  
  tonalAttributes: {
    warmth: 0.6,
    authority: 0.85,
    humor: 0.2,
    directness: 0.8,
    empathy: 0.7,
  },
  
  promptGuidance: `
Apply James Clear's influence by:
- Leading with stories that illustrate concepts
- Breaking down complex ideas simply
- Referencing research when making claims
- Creating memorable frameworks
- Using numbered lists for steps
- Ending with clear takeaways
`,
};
```

### 13.6 Blending Algorithm

```typescript
function applyReferentBlend(
  userVoice: VoiceDNA,
  content: string,
  influences: ReferentInfluences
): string {
  // User voice is always primary (minimum 50%)
  const userWeight = Math.max(50, influences.userWeight);
  
  // Build blended style guidance
  let styleGuidance = `
## VOICE BLEND

PRIMARY (${userWeight}%): User's authentic voice
- Use their natural vocabulary: ${userVoice.spokenPatterns.vocabulary.uniquePhrases.join(', ')}
- Match their rhythm: ${userVoice.spokenPatterns.rhythm.avgSentenceLength} sentences
- Maintain their tone: warmth=${userVoice.tonalAttributes.warmth}, authority=${userVoice.tonalAttributes.authority}
`;

  // Add referent influences
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
4. The result should feel authentic to the user, just enhanced
`;

  return styleGuidance;
}
```

---

## 14. Security & Privacy

### 14.1 Audio Data Handling

**Critical Policy: Transcribe and Delete**

```typescript
// Audio processing flow
async function processAudioSecurely(audioBlob: Blob, sessionId: string): Promise<string> {
  // 1. Upload to temporary storage
  const tempPath = await uploadToTemp(audioBlob, sessionId);
  
  try {
    // 2. Send to Whisper for transcription
    const transcript = await transcribeWithWhisper(tempPath);
    
    // 3. Store transcript only
    await storeTranscript(sessionId, transcript);
    
    // 4. Delete audio immediately
    await deleteAudioFile(tempPath);
    
    return transcript;
  } catch (error) {
    // Ensure audio is deleted even on error
    await deleteAudioFile(tempPath);
    throw error;
  }
}
```

**What We Store:**
- Transcripts (text only)
- Word timestamps (for analysis)
- Extracted voice patterns
- Generated content

**What We Delete Immediately:**
- Audio files (after transcription)
- Temporary processing files

### 14.2 Authentication & Authorization

- **Authentication**: Google OAuth via Better Auth
- **Session**: HTTP-only cookies, 7-day expiry
- **Authorization**: Role-based (admin/user)
- **API Protection**: All routes require authentication except landing page

### 14.3 Data Encryption

- **In Transit**: HTTPS everywhere (Vercel default)
- **At Rest**: Neon Postgres managed encryption
- **API Keys**: Environment variables only

### 14.4 Rate Limiting

```typescript
const rateLimits = {
  voiceUpload: { limit: 20, window: '1h' },
  transcription: { limit: 20, window: '1h' },
  contentGeneration: { limit: 15, window: '1h' },
  refinement: { limit: 30, window: '1h' },
};
```

---

## 15. Success Metrics

### 15.1 MVP Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Voice-to-Content Time | < 10 min | First recording to published content |
| Transcription Accuracy | > 95% | Whisper word error rate |
| Voice Match Rating | > 4/5 | User rating after calibration |
| Content Usability | > 80% | Content rated usable without major edits |
| Session Completion | > 70% | Started sessions that reach content |
| Return Usage | > 3x/week | Average sessions per active user |

### 15.2 Key Performance Indicators

**Engagement:**
- Sessions started per user per week
- Completion rate (recording → content)
- Refinement iterations per content
- Time spent reviewing content

**Quality:**
- Voice DNA calibration scores
- User satisfaction ratings
- Edit/regeneration rate
- Copy/download rate (usage signal)

**Technical:**
- Transcription latency
- Generation latency
- Error rates by step
- API costs per user

---

## 16. Development Phases

### 16.1 Phase 1: Foundation (Days 1-3)

**Goal**: Basic infrastructure and auth

- [ ] Clone and configure boilerplate
- [ ] Set up Neon Postgres
- [ ] Configure Google OAuth
- [ ] Create database schema
- [ ] Deploy to Vercel
- [ ] Build landing page

**Deliverable**: Authenticated app shell deployed

### 16.2 Phase 2: Voice Capture (Days 4-6)

**Goal**: Core voice recording functionality

- [ ] Build VoiceRecorder component
- [ ] Implement audio visualization
- [ ] Create audio upload API
- [ ] Integrate Whisper API
- [ ] Parse word timestamps
- [ ] Build recording UI (mobile + desktop)

**Deliverable**: Can record and transcribe voice

### 16.3 Phase 3: Voice DNA & Analysis (Days 7-9)

**Goal**: Voice profile and enthusiasm detection

- [ ] Build enthusiasm detection algorithm
- [ ] Implement linguistic analysis
- [ ] Create Voice DNA profile builder
- [ ] Build onboarding voice flow
- [ ] Add writing sample upload
- [ ] Create Voice DNA settings page

**Deliverable**: Voice DNA profiles created from recordings

### 16.4 Phase 4: Content Generation (Days 10-12)

**Goal**: Core content creation flow

- [ ] Build follow-up question generator
- [ ] Create follow-up response UI
- [ ] Implement session state management
- [ ] Build content generation prompts
- [ ] Create content viewer/editor
- [ ] Add voice refinement
- [ ] Add text refinement

**Deliverable**: Complete voice → content flow

### 16.5 Phase 5: Referents & Polish (Days 13-15)

**Goal**: Referent system and final polish

- [ ] Add 4 pre-built referent profiles
- [ ] Build referent selector UI
- [ ] Implement blending algorithm
- [ ] Create calibration flow
- [ ] Add content library
- [ ] Mobile responsiveness polish
- [ ] Error handling
- [ ] Deploy production

**Deliverable**: Complete MVP ready for users

### 16.6 Development Commands

```bash
# Local Development
docker compose up -d          # Start PostgreSQL
pnpm dev                      # Start dev server

# Database
pnpm db:generate              # Generate migrations
pnpm db:migrate               # Run migrations
pnpm db:studio                # Open Drizzle Studio

# Deployment
vercel                        # Deploy preview
vercel --prod                 # Deploy production
```

---

## 17. Future Vision

### 17.1 Post-MVP Roadmap

**Phase 2: Enhanced Voice (Month 2)**
- Real-time AI voice conversation (OpenAI Realtime API)
- AI voice responses (ElevenLabs)
- Offline recording with sync
- Multi-session synthesis

**Phase 3: Content Expansion (Month 3)**
- LinkedIn posts from voice
- Twitter/X threads
- Email newsletters
- Multi-format from single session

**Phase 4: Intelligence Layer (Month 4)**
- Content research agent
- SEO optimization agent
- Competitive analysis
- Content calendar

**Phase 5: Scale (Month 5+)**
- Public launch
- Subscription tiers
- Team collaboration
- API access
- Direct publishing integrations

### 17.2 Evolution to Persona Engine

The long-term vision is evolving VoiceDNA into a comprehensive "Persona Engine" where:

- Every voice session contributes to an ever-improving AI twin
- The AI can represent you across platforms
- Multi-modal input (voice, video, writing)
- Autonomous content creation within boundaries
- True personalization through continuous learning

---

## 18. Appendices

### 18.1 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://..."

# Auth
BETTER_AUTH_SECRET="your-32-char-secret"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI Services
OPENAI_API_KEY="sk-..." # For Whisper
ANTHROPIC_API_KEY="sk-ant-..." # For Claude

# Caching
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_EMAILS="your-email@example.com"
```

### 18.2 Claude Code Instructions (CLAUDE.md)

```markdown
# VoiceDNA - Claude Code Instructions

## Project Overview
VoiceDNA is a voice-first AI content creation platform. Users speak their ideas,
and the AI transforms them into polished blog posts while preserving their
authentic voice.

## Tech Stack
- Next.js 15 (App Router, React 19)
- TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Better Auth (Google OAuth)
- Drizzle ORM + Neon Postgres
- OpenAI Whisper (transcription)
- Claude API (analysis + generation)
- Upstash Redis (caching)

## Key Concepts

### Voice DNA
A profile built from:
1. How the user speaks (vocabulary, rhythm, enthusiasm)
2. Writing samples (optional)
3. Referent influences (optional)

### Session Flow
1. User records voice (1-5 min)
2. Whisper transcribes with timestamps
3. AI analyzes for enthusiasm peaks
4. AI asks 2-4 follow-up questions
5. User responds via voice or text
6. AI generates blog post with Voice DNA applied
7. User refines via voice or text chat

### Audio Policy
- Audio is transcribed then IMMEDIATELY deleted
- Only transcripts are stored
- This is a privacy requirement

## File Structure
- /src/app - Next.js pages and API routes
- /src/components - React components by feature
- /src/lib - Business logic and utilities
- /src/types - TypeScript definitions

## Commands
pnpm dev           # Start development
pnpm db:migrate    # Run migrations
pnpm db:studio     # Database GUI

## Important Notes
- Mobile-first design
- Voice recording uses MediaRecorder API
- Whisper API for transcription
- Claude for analysis and generation
- Always delete audio after transcription
```

### 18.3 API Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Authentication required |
| AUTH_002 | Invalid session |
| VOICE_001 | Recording too short (< 10 seconds) |
| VOICE_002 | Recording too long (> 5 minutes) |
| VOICE_003 | Transcription failed |
| VOICE_004 | Upload failed |
| SESSION_001 | Session not found |
| SESSION_002 | Invalid session state |
| CONTENT_001 | Generation failed |
| CONTENT_002 | Refinement failed |
| RATE_001 | Rate limit exceeded |

### 18.4 Glossary

| Term | Definition |
|------|------------|
| Voice DNA | User's unique voice profile built from speech patterns, writing samples, and preferences |
| Enthusiasm Detection | Analysis of speech timing/pace to identify high-energy moments |
| Referent Creator | A renowned writer whose style can be blended into output |
| Quick Capture | Short recording mode (< 2 min) for capturing ideas |
| Guided Session | Structured recording with AI follow-up questions |
| Voice Refinement | Updating generated content by speaking instructions |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-27 | Initial PRD (typing-based) |
| 2.0 | 2025-12-29 | Complete rewrite for voice-first architecture |

---

*This PRD is designed to be used directly with Claude Code for implementation.*
