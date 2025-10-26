import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // 외부 이미지 허용 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  
  // Playground iframe 미리보기를 위한 설정
  async headers() {
    return [
      {
        // 모든 경로에 대해 iframe 임베딩 허용
        source: '/:path*',
        headers: [
          {
            // CSP에서 frame-ancestors 허용 (모든 도메인에서 iframe 임베딩 가능)
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' *",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
