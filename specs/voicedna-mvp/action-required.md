# Action Required: VoiceDNA MVP

This document lists manual tasks that require human action before or during implementation.

## Pre-Implementation Actions

### Environment Variables

**Status**: ⚠️ Verify Required

1. **OpenAI API Key** (Whisper Transcription)
   - [ ] Obtain API key from https://platform.openai.com/api-keys
   - [ ] Add to `.env.local`: `OPENAI_API_KEY=sk-...`
   - [ ] Verify billing is enabled for Whisper usage

2. **OpenRouter API Key** (Already in boilerplate)
   - [ ] Verify `OPENROUTER_API_KEY` is set and working
   - [ ] Check credits/billing at https://openrouter.ai/settings/keys

3. **Google OAuth Credentials** (Optional - for OAuth flow)
   - [ ] Create OAuth 2.0 credentials at https://console.cloud.google.com/
   - [ ] Add authorized redirect URI: `{APP_URL}/api/auth/callback/google`
   - [ ] Add to `.env.local`:
     ```
     GOOGLE_CLIENT_ID=...
     GOOGLE_CLIENT_SECRET=...
     ```

### Database

**Status**: ⚠️ Action Required

- [ ] Ensure PostgreSQL database is running (Neon or local)
- [ ] Verify `POSTGRES_URL` connection string is correct
- [ ] After schema changes, run migrations:
  ```bash
  pnpm db:generate && pnpm db:migrate
  ```

## Phase-Specific Actions

### Phase 0: Boilerplate Cleanup

**Human Review Required**:
- [ ] Review landing page content after cleanup
- [ ] Verify branding is acceptable ("VoiceDNA" naming)
- [ ] Test that auth flows still work after cleanup

### Phase 2: Voice Recording

**Browser Permissions**:
- [ ] Test microphone permission flow on mobile Safari
- [ ] Test microphone permission flow on mobile Chrome
- [ ] Document any browser-specific issues

**Audio Format Testing**:
- [ ] Verify WebM/Opus works on target browsers
- [ ] Test fallback to WAV if needed
- [ ] Verify Whisper accepts the audio format

### Phase 4: Onboarding

**Content Creation**:
- [ ] Write/approve "about me" prompt text
- [ ] Review follow-up question templates
- [ ] Approve onboarding flow copy

### Phase 7: Referent System

**Content Review**:
- [ ] Review 4 referent profile descriptions:
  - Seth Godin: "Punchy, provocative, short paragraphs"
  - Ann Handley: "Warm, conversational, witty"
  - Gary Vaynerchuk: "Direct, urgent, energetic"
  - James Clear: "Clear, structured, evidence-based"
- [ ] Approve influence blending approach
- [ ] Test generated content with referent influence

## Testing Checkpoints

### Mobile Testing

At each phase completion:
- [ ] Test on iOS Safari (iPhone)
- [ ] Test on Android Chrome
- [ ] Verify touch targets are thumb-friendly (44px minimum)
- [ ] Check audio recording works on mobile

### Voice Recording Testing

- [ ] Test in quiet environment
- [ ] Test with background noise
- [ ] Test maximum recording duration (2 min quick, 5 min guided)
- [ ] Verify transcription accuracy is acceptable

### Content Quality

- [ ] Review 3-5 generated blog posts for quality
- [ ] Verify Voice DNA influence is perceptible
- [ ] Check referent blending is subtle (not overpowering)

## Deployment Checklist

Before production deployment:

- [ ] All environment variables set in Vercel/hosting
- [ ] Database migrations applied to production
- [ ] HTTPS enabled everywhere
- [ ] Audio upload size limits configured
- [ ] Error monitoring set up (optional: Sentry)
- [ ] Analytics tracking added (optional)

## API Rate Limits

Be aware of external API limits:

| API | Limit | Notes |
|-----|-------|-------|
| OpenAI Whisper | Varies by tier | Monitor usage dashboard |
| OpenRouter | Varies by plan | Check rate limits |

## Privacy Compliance

- [ ] Review audio deletion policy (immediate after transcription)
- [ ] Verify no audio files persist on server
- [ ] Consider privacy policy page for production

## Questions for Product Owner

Before proceeding, confirm:

1. **Recording Limits**: Are 2 min (quick) and 5 min (guided) acceptable limits?
2. **Calibration Rounds**: Is 3 rounds of calibration the right balance?
3. **Referent Selection**: Can users select 0-3 referents? Or minimum 1?
4. **Content Formats**: MVP is blog posts only - confirm no other formats needed

## Related Documents

- Requirements: `./requirements.md`
- Implementation Plan: `./implementation-plan.md`
- PRD: `/docs/PRD/VoiceDNA-PRD-v2.md`
