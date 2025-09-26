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
```

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
│   ├── HintButton.tsx           # Hint request functionality
│   ├── GiveUpButton.tsx         # Give up functionality
│   └── Footer.tsx               # App footer
├── utils/
│   ├── api.ts             # API client for backend communication
│   ├── amplitude.ts       # Analytics tracking utilities
│   └── date.ts            # Date formatting utilities
├── hooks/                 # Custom React hooks
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
- Three main endpoints:
  - `POST /quizzes/{date}/guess/{word}` - Submit word guesses
  - `GET /quizzes/{date}/hint/{rank}` - Get hints based on rank
  - `GET /quizzes/{date}/recent-answer` - Get previous day's answer
- All requests have 3-second timeout with AbortController

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