# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **뉴맨틀** (NewMantle), a Korean word-guessing game built with Next.js. It's an improved version of "꼬맨틀" where players guess daily words based on semantic similarity scores. The app is deployed at https://newmantle.kr.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run tests (Vitest)
npm test
npx vitest run -t "A-5-1"   # run by case ID
```

## Testing

Harness guide: `src/test/README.md` (fake game server, `renderGame`, presets, clock/timezone helpers, mock setup). Read it before writing tests.

### Workflow: TDD
1. Write the test cases in the task's `docs/tasks/<task>/verification.md` first (ID / level / precondition / action / expected), based on the spec or problem decisions, not on the implementation
2. Write the tests, prefixing each test name with its case ID
3. Run them and confirm they **fail for the right reason** (missing behavior, not a typo or missing mock). A test that passes before implementation does not distinguish the bug, so revisit the case
4. Implement until they pass, then record the result in the verification doc's result log
- When adding tests to code that already exists, do not edit implementation files to see them fail. Check that in an isolated copy (git worktree) and only after asking

### What to test
- Test behavior, not implementation details: assert on requests sent to the server, hook return values, what is visible on screen, stored `localStorage` values, and Amplitude events. Not on internal state/ref names, call order, or component structure
- Find screen elements by role and accessible name. Do not assert on copy (toast/notice text), only on presence and which options exist
- Do not verify the same rule at both logic and screen levels

### Mocking
- Mock only external boundaries: game server (fake `fetch` in `src/test/fakeGameServer.ts`), Supabase, Amplitude, confetti, time/timezone. Use real app code for hooks, components, `utils`, and UI libraries
- Do not `vi.mock` `api.ts` or hooks. Intercepting at HTTP keeps tests valid when the client changes and lets tests check request paths
- Per-file overrides (e.g. a logged-in Supabase session) go in that test file with `vi.mock`, and must include every method the rendered screen calls

## Architecture

### Tech Stack
- **Framework**: Next.js 14.2.4 with App Router
- **Styling**: Tailwind CSS with custom Pretendard font
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Analytics**: Amplitude for user tracking
- **Language**: TypeScript with strict mode

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with metadata and fonts
│   └── page.tsx           # Home page with game interface
├── components/
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   ├── AmplitudeInitializer.tsx  # Analytics setup
│   ├── GameDescription.tsx       # Game rules and FAQ
│   ├── classic/, excel/      # Theme-specific game UI (NewMantleForm, HintButton, GiveUpButton)
│   └── Footer.tsx               # App footer
├── utils/
│   ├── api.ts             # API client for backend communication
│   ├── amplitude.ts       # Analytics tracking utilities
│   └── date.ts            # Date formatting utilities
├── hooks/                 # Custom React hooks
├── test/                  # Test harness (see src/test/README.md); *.test.ts(x) live next to the code
└── static/                # Static assets
```

### Key Features
- **Daily Word Game**: Players guess Korean words with similarity scoring
- **API Integration**: Communicates with backend for word validation and hints
- **Analytics**: Tracks user interactions via Amplitude
- **Responsive Design**: Mobile-first with Tailwind CSS
- **SEO Optimized**: Korean OpenGraph metadata and structured data

### API Integration
- Base URL configured via `NEXT_PUBLIC_API_BASE_URL` environment variable
- Spec: `docs/api/game-v2.md` (game API), `docs/api/openapi.json` (full OpenAPI schema). v1 `/quizzes/...` endpoints are deprecated; use v2 only
- Auth required: `Authorization: Bearer <Supabase JWT>` or `X-Guest-Id: <uuid>` (exactly one)
- `{date}` is a KST `YYYY-MM-DD` string; only today and yesterday (KST) are accessible, others return 422
- Game endpoints:
  - `GET /v2/quizzes/{date}/guess/{word}` - Submit a guess. `rank` is 1~999 when ranked, `-1` when out of rank, `null` when correct
  - `GET /v2/quizzes/{date}/hint/{rank}` - Word at the given rank (`0 <= rank <= 999`); `rank=0` returns the answer's initial consonants
  - `GET /v2/quizzes/{date}/give-up` - Returns the answer
- Hint / give-up game rules: `docs/spec/hint-giveup.md`
- Game requests have a 3-second timeout with AbortController

### State Management
- Uses React built-in state (useState, useEffect)
- Game state persisted in localStorage via custom hooks
- No external state management library

### Styling Conventions
- Tailwind CSS with custom design system
- Pretendard font family for Korean text
- Blue color scheme (#2563eb) for primary branding
- Responsive breakpoints: sm (640px+), md (768px+)

### Environment Variables
- `NEXT_PUBLIC_API_BASE_URL` - Backend API endpoint

### Korean Localization
- All UI text in Korean
- Special handling for Unicode strings in API responses
- Korean date formatting (YYYY-MM-DD)
- OpenGraph metadata in Korean (ko_KR locale)