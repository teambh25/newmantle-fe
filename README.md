This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Testing

Tests use [Vitest](https://vitest.dev/) with React Testing Library.

```bash
# Run all tests once
npm test

# Re-run tests on file changes
npm run test:watch

# Run a single test file
npx vitest run src/utils/gameRules.test.ts

# Run tests whose name matches a pattern (e.g. a case ID)
npx vitest run -t "A-5-1"
```

Test files live next to the code they test (`*.test.ts`, `*.test.tsx`). Test case IDs follow each task's `docs/tasks/<task>/verification.md`. The test harness (fake game server, helpers, mocking rules, TDD workflow) is documented in `src/test/README.md`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
