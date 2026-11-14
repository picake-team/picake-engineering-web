import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    // 첫 주소(info.picakes.com)에 페이지가 없어 404였다. 네이버 서치어드바이저 소유확인이 첫 주소를 읽다가
    // "접근 실패 404"로 막혀(2026-11-14), 넘기지(리다이렉트) 않고 사장님 소개 페이지를 200으로 그대로 보여 준다.
    // 그 페이지의 canonical이 /seller/about이라 검색에는 한 페이지로 잡힌다.
    return [{ source: "/", destination: "/seller/about" }];
  },
  async headers() {
    // 보안 헤더: 다른 사이트가 이 화면을 틀(iframe)에 넣어 누르게 하는 것을 막고, 파일 종류를 추측하지 않게 한다(2026-11-12 전체 검토)
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
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
