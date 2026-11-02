import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'www.kipris.or.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.kipris.or.kr',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // 타입 검사는 빌드 시 항상 실행 (2026-08-10부터 활성화)
  // ESLint는 기존 지적 174건을 단계적으로 정리한 뒤 켤 예정
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
