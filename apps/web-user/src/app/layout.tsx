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
  SITE_LOGO_URL,
  SITE_NAME,
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
    images: [
      {
        url: SITE_LOGO_URL,
        width: 100,
        height: 100,
        alt: "Picake - 케이크 주문 플랫폼",
        type: "image/svg+xml",
      },
    ],
  },

  // Twitter / X Card
  twitter: {
    card: "summary_large_image",
    site: "@picake_kr",
    creator: "@picake_kr",
    title: "Picake - 케이크 주문 플랫폼",
    description:
      "Picake에서 내 주변 케이크 전문 매장을 찾고 예약하세요. 생일케이크, 레터링케이크, 커스텀케이크 등 다양한 케이크를 간편하게 주문할 수 있어요.",
    images: [SITE_LOGO_URL],
  },

  applicationName: SITE_NAME,
  category: "Food & Dining",
  referrer: "origin-when-cross-origin",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
