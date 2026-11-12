import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_TIME } from "@/apps/web-user/common/constants/query-cache.constants";
import { useQueryErrorAlert } from "@/apps/web-user/common/hooks/useQueryErrorAlert";
import { homeBannerApi } from "@/apps/web-user/features/home-banner/apis/home-banner.api";
import { homeBannerQueryKeys } from "@/apps/web-user/features/home-banner/constants/homeBannerQueryKeys.constant";
import type { HomeBanner } from "@/apps/web-user/features/home-banner/types/home-banner.type";

// 홈 배너 목록 조회. 서버가 미리 받은 목록(initial)이 있으면 그것을 먼저 보이고 뒤에서 새로 받는다
export function useHomeBanners(initial?: HomeBanner[]) {
  const query = useQuery<HomeBanner[]>({
    queryKey: homeBannerQueryKeys.list(),
    queryFn: async () => {
      const response = await homeBannerApi.getHomeBanners();
      return response.data;
    },
    staleTime: QUERY_STALE_TIME.STATIC,
    initialData: initial,
    // 서버 목록은 최대 1분 전 것이라, 화면에 그대로 보이되 바로 한 번 새로 받는다
    initialDataUpdatedAt: initial ? 0 : undefined,
  });

  useQueryErrorAlert(query);

  return query;
}
