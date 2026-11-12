import type { Metadata } from "next";
import { SITE_NAME, SITE_OG_IMAGE } from "@/apps/web-user/common/constants/site.constants";

/** 사장님 견적 링크(SC-19)는 그 가게만의 열쇠라 검색에 걸리지 않게 한다 */
export const metadata: Metadata = {
  // 뒤의 " | Picake"는 루트 layout 제목 틀이 붙인다
  title: "손님 견적 요청",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  // 운영자가 인스타 DM·카톡으로 보내는 링크라 미리보기를 사장님께 맞춘다(손님용 "매장을 찾고 예약하세요" 대신)
  description: "가입 없이 금액만 보내면 손님께 전해 드려요.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "손님 케이크 견적 요청이 왔어요",
    description: "가입 없이 금액만 보내면 손님께 전해 드려요.",
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "손님 케이크 견적 요청이 왔어요",
    description: "가입 없이 금액만 보내면 손님께 전해 드려요.",
    images: [SITE_OG_IMAGE.url],
  },
};

export default function QuoteLinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
