import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_TIME } from "@/apps/web-user/common/constants/query-cache.constants";
import { storeApi } from "@/apps/web-user/features/store/apis/store.api";

export function useStoreRegions() {
  const query = useQuery({
    queryKey: ["store", "regions"],
    queryFn: storeApi.getRegions,
    staleTime: QUERY_STALE_TIME.STATIC,
  });
  // 위쪽 지역 이름·알림 숫자 같은 바탕 조회는 실패해도 오류 창을 띄우지 않는다(목록 화면의 "다시 시도"와 겹치지 않게)

  return query;
}
