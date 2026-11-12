import type { Metadata } from "next";

/** 사장님 견적 링크(SC-19)는 그 가게만의 열쇠라 검색에 걸리지 않게 한다 */
export const metadata: Metadata = {
  title: "손님 견적 요청 | Picake",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function QuoteLinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
