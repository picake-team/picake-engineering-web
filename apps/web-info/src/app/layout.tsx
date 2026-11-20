import type { Metadata, Viewport } from "next";
import "@/apps/web-info/common/styles/globals.css";
import { PostHogProvider } from "@/apps/web-info/common/components/providers/PostHogProvider";
import BuildInfoLogger from "@/apps/web-info/common/components/debug/BuildInfoLogger";
import {
  SITE_BASE_URL,
  SITE_NAME,
  SITE_OG_IMAGE,
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
    // 카카오톡·인스타그램은 SVG 미리보기를 보여 주지 않아 PNG(사장님께 소개 링크를 DM으로 보낼 때)
    images: [SITE_OG_IMAGE],
  },
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
  // 네이버 서치어드바이저 사이트 소유 확인(info.picakes.com). 공개해도 되는 값이고, 지우면 네이버 등록이 풀린다.
  // 구글은 picakes.com 도메인 전체가 DNS로 확인돼 있어 여기 넣지 않는다.
  verification: {
    other: {
      "naver-site-verification": "7f41a4b880856e2c57dccdcbb9a46fba1dd35d34",
    },
  },
};

// 기기 폭에 맞춘다(확대는 막지 않는다). 휴대폰·PC 배치는 페이지가 CSS로 나눈다
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 손님 앱과 달리 소개 사이트는 글을 읽는 곳이라 확대를 막지 않는다(접근성, Lighthouse meta-viewport, 2026-11-14)
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
        {/*
          문서 전체가 스크롤된다(2026-11-20 소개 페이지 PC). 예전에는 web-user처럼 640px 스크롤 칸 안에 휴대폰 화면만
          있었다. 이제 페이지가 휴대폰·PC 배치를 스스로 나눈다(common/constants/screen.constants.ts).
        */}
        <PostHogProvider>
          <BuildInfoLogger />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
