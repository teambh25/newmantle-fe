import { withSentryConfig } from '@sentry/nextjs';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 폰트 최적화 설정
  optimizeFonts: true,
  
  // 정적 자산 캐싱 설정
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

const sentryOptions = {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "banghwang",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
};

// 개발 서버에서만 *.dev.tsx를 페이지로 인식한다 (예: src/app/dev/word-list/page.dev.tsx).
// 빌드·배포에서는 무시되어 경로 자체가 생기지 않는다 (docs/tasks/ui/word-list.md 5장)
const DEFAULT_PAGE_EXTENSIONS = ['tsx', 'ts', 'jsx', 'js'];

export default function config(phase, ctx) {
  const pageExtensions =
    phase === PHASE_DEVELOPMENT_SERVER
      ? ['dev.tsx', ...DEFAULT_PAGE_EXTENSIONS]
      : DEFAULT_PAGE_EXTENSIONS;
  const wrapped = withSentryConfig({ ...nextConfig, pageExtensions }, sentryOptions);
  return typeof wrapped === 'function' ? wrapped(phase, ctx) : wrapped;
}

