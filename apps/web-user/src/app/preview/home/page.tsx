import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeRenewalScreen from "@/apps/web-user/features/home/components/renewal/HomeRenewalScreen";
import { magazineDesigns } from "@/apps/web-user/features/design/utils/design.util";
import { fetchConsumerApi } from "@/apps/web-user/common/utils/server-api.util";
import { isProduction } from "@/apps/web-user/common/utils/environment.util";
import type { HomeBannerListResponse } from "@/apps/web-user/features/home-banner/types/home-banner.type";

export const revalidate = 60;

// 디자이너 확인용 주소라 검색에 잡히지 않게 한다
export const metadata: Metadata = {
  title: "홈 새 화면 시안",
  robots: { index: false, follow: false },
};

/**
 * 홈 새 화면 시안(2026-11-15). staging·로컬에서만 열리고 상용에서는 없는 주소(404)다.
 * 디자이너가 확인하면 지금 홈(app/page.tsx)으로 옮기고 이 주소는 지운다.
 */
export default async function HomeRenewalPreviewPage() {
  if (isProduction(process.env.NEXT_PUBLIC_NODE_ENV)) notFound();
  const banners = await fetchConsumerApi<HomeBannerListResponse>("/home-banners", {
    revalidate,
  });
  const magazineIds = magazineDesigns().map((d) => d.id);
  return <HomeRenewalScreen initialBanners={banners?.data} magazineIds={magazineIds} />;
}
