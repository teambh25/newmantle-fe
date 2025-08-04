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

export default nextConfig;
