import type { Metadata, Viewport } from "next";
import "@/apps/web-info/common/styles/globals.css";
import { PostHogProvider } from "@/apps/web-info/common/components/providers/PostHogProvider";
import BuildInfoLogger from "@/apps/web-info/common/components/debug/BuildInfoLogger";
import {
  SITE_BASE_URL,
  SITE_LOGO_URL,
  SITE_NAME,
} from "@/apps/web-info/common/constants/site.constants";

const DESCRIPTION =
  "Picake는 내 주변 케이크 전문 매장을 찾고 예약하는 케이크 주문 플랫폼이에요. 매장 사장님을 위한 주문·예약 관리도 한 곳에서 할 수 있어요.";

export const metadata: Metadata = {
  // 하위 페이지의 상대경로 canonical(`/seller` 등)을 절대 주소로 해석하는 기준
  metadataBase: new URL(SITE_BASE_URL),
  title: {
    default: "Picake 소개",
    template: "%s | Picake",
  },
  description: DESCRIPTION,
  authors: [{ name: SITE_NAME, url: SITE_BASE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // Open Graph - 카카오톡, 인스타그램, 페이스북 등 SNS 공유 미리보기
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_BASE_URL,
    siteName: SITE_NAME,
    title: "Picake 소개",
    description: DESCRIPTION,
    images: [{ url: SITE_LOGO_URL, width: 100, height: 100, alt: "Picake", type: "image/svg+xml" }],
  },
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
};

// web-user와 같은 뷰포트 설정 — 모바일에서 보이는 모습을 그대로 유지한다
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
        {/*
          web-user의 RootWrapperLayout과 같은 스크롤 컨테이너. 모바일은 전체 폭, 640px 이상은 가운데 640px
          열로 보이고, 스크롤은 문서가 아니라 이 안에서 일어난다 (StickySurveyCta 등이 이 전제로 짜여 있다).
        */}
        <PostHogProvider>
          <BuildInfoLogger />
          <div
            id="root-scroll-container"
            className="w-full sm:w-[640px] h-screen mx-auto sm:border-x border-gray-200 overflow-y-auto overflow-x-hidden scrollbar-hide"
          >
            <div>{children}</div>
          </div>
        </PostHogProvider>
      </body>
    </html>
  );
}
