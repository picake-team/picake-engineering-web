import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@/apps/web-user/common/styles/globals.css";
import { QueryProvider } from "@/apps/web-user/common/components/providers/QueryProvider";
import { ErrorBoundaryProvider } from "@/apps/web-user/common/components/providers/ErrorBoundaryProvider";
import { PostHogProvider } from "@/apps/web-user/common/components/providers/PostHogProvider";
import { LoadingFallback } from "@/apps/web-user/common/components/fallbacks/LoadingFallback";
import RootWrapperLayout from "@/apps/web-user/common/components/layouts/RootWrapperLayout";
import {
  SITE_BASE_URL,
  SITE_NAME,
  SITE_OG_IMAGE,
} from "@/apps/web-user/common/constants/site.constants";

/**
 * 루트 레이아웃 메타데이터
 * - 하위 페이지의 generateMetadata가 없으면 이 값이 기본으로 적용됨
 * - OpenGraph / Twitter Card 포함
 */
export const metadata: Metadata = {
  // 하위 페이지의 상대경로 canonical(`/product/<id>` 등)을 절대 주소로 해석하는 기준
  metadataBase: new URL(SITE_BASE_URL),
  title: {
    default: "Picake - 케이크 주문 플랫폼",
    template: "%s | Picake",
  },
  description:
    "Picake에서 내 주변 케이크 전문 매장을 찾고 예약하세요. 생일케이크, 레터링케이크, 커스텀케이크 등 다양한 케이크를 간편하게 주문할 수 있어요.",
  keywords: [
    "케이크 주문",
    "케이크 예약",
    "생일케이크",
    "레터링케이크",
    "커스텀케이크",
    "케이크 픽업",
    "근처 케이크",
    "케이크 맛집",
    "디저트 주문",
    "Picake",
    "피케이크",
    "케이크 배달",
  ],
  authors: [{ name: SITE_NAME, url: SITE_BASE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  // Canonical URL
  alternates: {
    canonical: SITE_BASE_URL,
    languages: { "ko-KR": SITE_BASE_URL },
  },

  // Open Graph - 카카오톡, 인스타그램, 페이스북 등 SNS 공유 미리보기
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_BASE_URL,
    siteName: SITE_NAME,
    title: "Picake - 케이크 주문 플랫폼",
    description:
      "Picake에서 내 주변 케이크 전문 매장을 찾고 예약하세요. 생일케이크, 레터링케이크, 커스텀케이크 등 다양한 케이크를 간편하게 주문할 수 있어요.",
    // 카카오톡·인스타그램은 SVG 미리보기를 보여 주지 않아 PNG
    images: [SITE_OG_IMAGE],
  },

  // Twitter / X Card
  twitter: {
    card: "summary_large_image",
    site: "@picake_kr",
    creator: "@picake_kr",
    title: "Picake - 케이크 주문 플랫폼",
    description:
      "Picake에서 내 주변 케이크 전문 매장을 찾고 예약하세요. 생일케이크, 레터링케이크, 커스텀케이크 등 다양한 케이크를 간편하게 주문할 수 있어요.",
    images: [SITE_OG_IMAGE.url],
  },

  applicationName: SITE_NAME,
  category: "Food & Dining",
  referrer: "origin-when-cross-origin",
  // 네이버 서치어드바이저 사이트 소유 확인(picakes.com). 공개해도 되는 값이고, 지우면 네이버 등록이 풀린다.
  // 구글은 picakes.com 도메인 전체가 DNS로 확인돼 있어 여기 넣지 않는다.
  verification: {
    other: {
      "naver-site-verification": "6793b0b84befbe95e58a77a00d06f13c51b9946f",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // 밝은 화면만 쓴다. 휴대폰이 어두운 모드여도 브라우저(삼성 인터넷 등)가 색을 억지로 어둡게 바꾸지 않게(판매자 앱과 같음)
  colorScheme: "only light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <ErrorBoundaryProvider>
          <PostHogProvider>
            <QueryProvider>
              <Suspense
                fallback={<LoadingFallback variant="overlay" message="페이지를 불러오는 중" />}
              >
                <RootWrapperLayout>{children}</RootWrapperLayout>
              </Suspense>
            </QueryProvider>
          </PostHogProvider>
        </ErrorBoundaryProvider>
      </body>
    </html>
  );
}
