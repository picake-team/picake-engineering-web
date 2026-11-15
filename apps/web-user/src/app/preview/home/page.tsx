import type { Metadata } from "next";
import HomeRenewalScreen from "@/apps/web-user/features/home/components/renewal/HomeRenewalScreen";
import { magazineDesigns } from "@/apps/web-user/features/design/utils/design.util";
import { fetchConsumerApi } from "@/apps/web-user/common/utils/server-api.util";
import type { HomeBannerListResponse } from "@/apps/web-user/features/home-banner/types/home-banner.type";

export const revalidate = 60;

// 디자이너 확인용 주소라 검색에 잡히지 않게 한다
export const metadata: Metadata = {
  title: "홈 새 화면 시안",
  robots: { index: false, follow: false },
};

/**
 * 홈 새 화면 시안(2026-11-15). 어디에도 링크가 없고 검색에도 잡히지 않는다.
 * 상용에서도 열린다(11-15 운영자: 실제 앱에서 보려고 — 마이 > 버전정보 > "웹 버전" 7번 누르기).
 * 디자이너가 확인하면 지금 홈(app/page.tsx)으로 옮기고 이 주소와 숨은 입구는 지운다.
 */
export default async function HomeRenewalPreviewPage() {
  const banners = await fetchConsumerApi<HomeBannerListResponse>("/home-banners", {
    revalidate,
  });
  const magazineIds = magazineDesigns().map((d) => d.id);
  return <HomeRenewalScreen initialBanners={banners?.data} magazineIds={magazineIds} />;
}
