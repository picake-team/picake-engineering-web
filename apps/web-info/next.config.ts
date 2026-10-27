import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    /** GitHub Actions 빌드 커밋 SHA를 클라이언트에 주입합니다. */
    NEXT_PUBLIC_GITHUB_SHA: process.env.GITHUB_SHA ?? "",
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

export default nextConfig;
