# Requirements: VoiceDNA MVP

## Overview

VoiceDNA is a voice-first AI content creation platform that captures authentic thinking through speech and transforms it into polished, publish-ready blog articles. Unlike traditional AI writing tools where users type prompts, VoiceDNA lets users speak naturally—capturing not just words, but enthusiasm, emphasis, and authentic voice patterns.

## Core Value Proposition

> "Stop typing prompts. Start talking ideas. VoiceDNA captures your authentic thinking and transforms it into polished content—preserving what makes YOU sound like YOU."

## Target Users

- Content creators who have ideas but struggle to translate them to written content
- People who are better speakers than writers
- Users who want to capture insights on-the-go (commute, walks, gym)
- Those who feel AI-generated content sounds generic

## Feature Requirements

### Authentication
- **FR-001**: Support both Google OAuth and Email/Password authentication
- **FR-002**: Protect all voice and content features behind authentication
- **FR-003**: Track user onboarding status (not_started, voice_intro, follow_ups, samples, complete)

### Voice Capture
- **FR-010**: Record audio via browser MediaRecorder API (mobile + desktop)
- **FR-011**: Display real-time waveform visualization during recording
- **FR-012**: Support two capture modes:
  - Quick Capture: < 2 minutes, minimal follow-ups
  - Guided Session: 2-5 minutes, full Socratic Q&A
- **FR-013**: Transcribe audio using OpenAI Whisper API with word-level timestamps
- **FR-014**: Delete audio files immediately after transcription (privacy requirement)
- **FR-015**: Maximum recording duration: 5 minutes (guided), 2 minutes (quick)

### Voice DNA Engine
- **FR-020**: Extract voice patterns from transcripts:
  - Vocabulary (frequent words, unique phrases, filler words)
  - Rhythm (sentence length, pace variation, pause patterns)
  - Rhetoric (questions, analogies, storytelling style)
  - Enthusiasm (topics that excite, emphasis patterns)
- **FR-021**: Detect enthusiasm peaks from speech timing/pace data
- **FR-022**: Build and store Voice DNA profiles per user
- **FR-023**: Update profiles progressively with each recording

### Onboarding & Calibration
- **FR-030**: Voice-first onboarding flow:
  - Record 2-3 minute "about me" intro
  - Answer 3-4 AI-generated follow-up questions
  - Optional: Upload 1-5 writing samples
  - Optional: Select referent influences
- **FR-031**: Writing sample analysis (paste, URL, or file upload)
- **FR-032**: 3-round calibration system to improve Voice DNA accuracy
- **FR-033**: Display Voice DNA strength indicator (0-100%)

### Session Flow & Follow-up Questions
- **FR-040**: Session state management (recording → transcribing → analyzing → follow_ups → generating → complete)
- **FR-041**: AI-generated 2-4 follow-up questions per session based on:
  - Clarify: ambiguous or underdeveloped points
  - Expand: interesting points needing detail
  - Example: request stories/anecdotes
  - Challenge: probe assumptions
- **FR-042**: Support voice OR text responses to follow-ups
- **FR-043**: Allow skipping individual follow-up questions

### Content Generation
- **FR-050**: Generate blog posts from completed sessions
- **FR-051**: Apply Voice DNA patterns during generation
- **FR-052**: Apply referent influences (if selected) during generation
- **FR-053**: Include enthusiasm peaks as key points in content
- **FR-054**: Generate title, word count, and read time estimate

### Content Refinement
- **FR-060**: Voice-based refinement (speak instructions like "make opening more punchy")
- **FR-061**: Text-based refinement via chat interface
- **FR-062**: Direct markdown editing mode
- **FR-063**: Track content versions

### Content Management
- **FR-070**: Auto-save all generated content
- **FR-071**: Content status: Draft, Final, Published
- **FR-072**: Content library with search/filter by date, title, status
- **FR-073**: Copy content to clipboard
- **FR-074**: Download content as markdown

### Referent Creator System
- **FR-080**: 4 pre-built referent profiles:
  - Seth Godin: Punchy, provocative, short
  - Ann Handley: Warm, conversational, witty
  - Gary Vaynerchuk: Direct, urgent, energetic
  - James Clear: Clear, structured, evidence-based
- **FR-081**: Select 0-3 referents with influence weights
- **FR-082**: User voice always ≥50% weight in blending
- **FR-083**: Subtle influence blending (enhance, not replace user voice)

### Platform & UX
- **FR-090**: Mobile-first responsive design
- **FR-091**: Desktop support with split-view layouts
- **FR-092**: Dark mode support
- **FR-093**: One-tap access to recording from dashboard

## Non-Functional Requirements

### Performance
- **NFR-001**: Transcription latency < 30 seconds for 5-minute recording
- **NFR-002**: Content generation < 90 seconds
- **NFR-003**: Voice-to-content total time < 10 minutes

### Privacy & Security
- **NFR-010**: Audio files deleted immediately after transcription
- **NFR-011**: Only transcripts stored (no audio retention)
- **NFR-012**: HTTPS everywhere
- **NFR-013**: Authentication required for all voice/content features

### Scalability
- **NFR-020**: Support maximum 10 users for MVP

## Out of Scope (MVP)

- Offline recording
- Background recording (phone locked)
- Real-time AI voice responses
- Multiple content formats (social, email)
- Multi-session synthesis
- Team collaboration
- Direct publishing integrations
- Custom referent creation

## Acceptance Criteria

1. **Voice Capture**: User can record audio on mobile browser, see waveform, and receive transcript within 30 seconds
2. **Voice DNA**: Profile is created from first recording and improves with subsequent recordings
3. **Content Generation**: Blog posts reflect user's voice patterns and selected referent influences
4. **Refinement**: User can refine content via voice or text and see updates immediately
5. **Mobile Experience**: All flows work smoothly on mobile with thumb-friendly controls
6. **Authentication**: Both Google OAuth and email/password work for sign-up/sign-in

## Dependencies

- OpenAI API (Whisper transcription)
- OpenRouter API (LLM for analysis and generation)
- PostgreSQL database (Neon)
- Vercel hosting
- Google OAuth credentials (optional, for OAuth flow)

## Related Documents

- PRD: `/docs/PRD/VoiceDNA-PRD-v2.md`
- Implementation Plan: `./implementation-plan.md`
- Action Required: `./action-required.md`
