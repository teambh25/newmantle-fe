# Repository Guidelines

This guide helps contributors work effectively in this Next.js (14.x) + TypeScript + Tailwind CSS repository.

## Project Structure & Module Organization
- `src/app`: App Router entry (`layout.tsx`, `page.tsx`), global styles (`globals.css`).
- `src/components`: Feature components (e.g., `NewMantleForm/`), plus reusable UI in `components/ui` (shadcn).
- `src/hooks`: Reusable hooks (e.g., `useGameLogic`, `useGameDate`).
- `src/utils`: Utilities (`api.ts`, `date.ts`, `amplitude.ts`). Uses path alias `@/*`.
- `src/lib`: Shared helpers (reserved for cross‑cutting logic).
- `public/`: Static assets. Fonts are optimized via Next config headers.
- `.env`: Runtime config (e.g., `NEXT_PUBLIC_API_BASE_URL`). Do not commit secrets.

## Build, Test, and Development Commands
- `npm run dev`: Run the app locally at `http://localhost:3000`.
- `npm run build`: Production build (Next.js).
- `npm run start`: Serve the production build.
- `npm run lint`: Run ESLint (`next/core-web-vitals`). Fix warnings before PRs.

## Coding Style & Naming Conventions
- TypeScript strict mode; 2‑space indentation; semicolons required.
- Components: PascalCase names and files (e.g., `GameDescription.tsx`). shadcn UI stays kebab‑case (e.g., `accordion.tsx`).
- Hooks: camelCase starting with `use` (e.g., `useGameLogic`).
- Variables/functions: camelCase; constants UPPER_SNAKE_CASE when exported.
- Styling: Tailwind utility classes; prefer composition over custom CSS.
- Imports: use `@/*` alias (e.g., `@/components/...`).

## Testing Guidelines
- No formal test setup yet. If adding tests, use Jest + React Testing Library.
- Place tests alongside files or under `src/__tests__`, using `*.test.ts(x)`.
- Mock network via `fetch`/`AbortController`; do not hit real APIs in CI.

## Commit & Pull Request Guidelines
- Commits: Imperative mood, concise. English or Korean is acceptable. Example: `Refactor GameForm: improve submit handling`.
- Branches: `feature/<scope>` -> PR to `develop` or `main`.
- PRs must include: clear description, linked issues, screenshots for UI changes, steps to validate, and any `.env` requirements.

## Security & Configuration Tips
- Only expose client‑safe keys with `NEXT_PUBLIC_*`. Never commit secrets.
- API base URL comes from `.env`. Example: `NEXT_PUBLIC_API_BASE_URL=https://api.example.com`.
- Keep timeouts/retries in `src/utils/api.ts` reasonable; handle errors user‑safely.

