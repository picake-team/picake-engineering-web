import HomeScreen from "@/apps/web-user/features/home/components/HomeScreen";
import { fetchConsumerApi } from "@/apps/web-user/common/utils/server-api.util";
import type { HomeBannerListResponse } from "@/apps/web-user/features/home-banner/types/home-banner.type";

/** 배너를 바꾸면 1분 안에 첫 화면에도 반영된다(화면은 받은 뒤 한 번 더 새로 받음) */
export const revalidate = 60;

/**
 * 손님 홈. 배너 목록을 서버에서 미리 받아 첫 HTML에 배너 그림을 넣는다(첫 화면 LCP).
 * 받지 못하면(3초 넘김·서버 오류) 예전처럼 화면이 받는다.
 */
export default async function HomePage() {
  const banners = await fetchConsumerApi<HomeBannerListResponse>("/home-banners", {
    revalidate,
  });
  return <HomeScreen initialBanners={banners?.data} />;
}
