import type { Metadata } from "next";
import { SITE_BASE_URL } from "@/apps/web-user/common/constants/site.constants";

export const metadata: Metadata = {
  title: "케이크 검색",
  description:
    "원하는 케이크와 매장을 검색해보세요. 생일케이크, 레터링케이크, 커스텀케이크 등 다양한 케이크를 픽케이크에서 찾을 수 있어요.",
  keywords: ["케이크 검색", "케이크 찾기", "케이크 맛집 검색", "픽케이크 검색"],
  alternates: { canonical: "/search" },
  openGraph: {
    title: "케이크 검색 | 픽케이크",
    description: "원하는 케이크와 매장을 검색해보세요.",
    url: `${SITE_BASE_URL}/search`,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
