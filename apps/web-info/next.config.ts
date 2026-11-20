import type { NextConfig } from "next";

/**
 * 상용이 아니면(검증·개발) 모든 응답에 "검색에 싣지 마" 표시를 단다(web-user와 같은 규칙).
 * robots.txt로 막기만 하면 구글이 이 표시를 읽지 못해 검증 사이트가 검색에 남으므로 robots.txt는 열어 둔다(src/app/robots.ts).
 */
const NOINDEX_HEADERS =
  process.env.NEXT_PUBLIC_NODE_ENV === "production"
    ? []
    : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // 첫 주소(info.picakes.com)는 손님 소개 페이지(src/app/page.tsx, 2026-11-20)다. 그 전에는 페이지가 없어
  // 사장님 소개를 그대로 보여 주는 rewrite를 두었다(네이버 서치어드바이저 소유 확인이 첫 주소 404로 막혀서, 2026-11-14).
  // 네이버 확인 태그는 layout의 metadata.verification이라 첫 주소에도 그대로 있다.
  async headers() {
    // 보안 헤더: 다른 사이트가 이 화면을 틀(iframe)에 넣어 누르게 하는 것을 막고, 파일 종류를 추측하지 않게 한다(2026-11-12 전체 검토)
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          ...NOINDEX_HEADERS,
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
