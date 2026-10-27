import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  env: {
    /** GitHub Actions 빌드 커밋 SHA를 클라이언트에 주입합니다. */
    NEXT_PUBLIC_GITHUB_SHA: process.env.GITHUB_SHA ?? "",
  },
  async redirects() {
    return [
      // 홈 허브가 생기기 전까지는 사장님 소개 페이지가 대표 페이지다. 허브를 만들 때 이 규칙을 걷어낸다.
      { source: "/", destination: "/seller/about", permanent: false },
    ];
  },
  eslint: {
    // ESLint 검사를 비활성화하고 루트(yarn run common:lint)에서 별도로 실행
    ignoreDuringBuilds: true,
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
