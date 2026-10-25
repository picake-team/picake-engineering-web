import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["swiper", "lucide-react"],
    /**
     * 클라이언트 라우터 캐시 유지 시간(초).
     * Next 15 기본값은 dynamic 0이라 탭 이동·뒤로가기마다 서버 왕복이 발생해
     * 웹뷰에서 페이지 전환이 느리게 느껴짐 — 최근 방문 페이지는 캐시로 즉시 복원.
     * (페이지 데이터 신선도는 TanStack Query staleTime이 별도로 관리)
     */
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  env: {
    /** GitHub Actions 빌드 커밋 SHA를 클라이언트에 주입합니다. */
    NEXT_PUBLIC_GITHUB_SHA: process.env.GITHUB_SHA ?? "",
  },
  async redirects() {
    return [
      { source: "/chat", destination: "/", permanent: false },
      { source: "/chat/:path*", destination: "/", permanent: false },
    ];
  },
  eslint: {
    // ESLint 검사를 비활성화하고 루트(yarn run common:lint)에서 별도로 실행
    ignoreDuringBuilds: true,
  },
  images: {
    /**
     * 최적화된 이미지 캐시 유지 시간(초, 31일).
     * 업로드 이미지는 원본에 Cache-Control이 없어 기본값(60초)이 그대로 적용되는데,
     * 파일명이 `타임스탬프_랜덤.확장자`로 매번 새로 만들어져 같은 URL의 내용이 바뀌지 않으므로 길게 캐시한다.
     * (백엔드 upload 모듈 file-validator.util.ts의 generateUniqueFilename)
     */
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static-staging.picakes.com",
      },
      {
        protocol: "https",
        hostname: "static.picakes.com",
      },
      {
        protocol: "https",
        hostname: "static-production.picakes.com",
      },
    ],
  },
  webpack(config) {
    // SVG를 React 컴포넌트로 import하기 위한 설정
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // 빌드 로그 최소화 및 Sentry 텔레메트리 비활성화
  silent: true,
  telemetry: false,
  // 번들에서 Sentry 디버그 로그 제거 (번들 크기 최적화)
  disableLogger: true,
  // 소스맵 업로드 비활성화 (auth token 불필요) — 필요 시 추후 활성화
  sourcemaps: { disable: true },
});
