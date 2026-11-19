import { useCallback } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarOrDefault } from "@/apps/web-seller/features/store/utils/business-day.util";
import type { StoreBusinessCalendarDto } from "@/apps/web-seller/features/store/types/store.dto";
import { QUERY_STALE_TIME } from "@/apps/web-seller/common/constants/query-cache.constants";
import { storeApi } from "@/apps/web-seller/features/store/apis/store.api";
import {
  GetSellerStoresRequestDto,
  StoreListResponseDto,
} from "@/apps/web-seller/features/store/types/store.dto";
import type { GetSellerStoresQueryParams } from "@/apps/web-seller/features/store/types/store.ui";
import { storeQueryKeys } from "../../constants/storeQueryKeys.constant";
import { useAuthStore } from "@/apps/web-seller/features/auth/store/auth.store";

// 스토어 목록 조회 쿼리 (무한 스크롤)
export function useStoreList({
  limit = 100,
  search,
  sortBy,
}: Partial<GetSellerStoresQueryParams> = {}) {
  const { isAuthenticated } = useAuthStore();

  const query = useInfiniteQuery<StoreListResponseDto>({
    queryKey: storeQueryKeys.list({ limit, search, sortBy }),
    queryFn: ({ pageParam = 1 }) => {
      const params: GetSellerStoresRequestDto = {
        page: pageParam as number,
        limit,
      };
      if (search !== undefined && search !== "") params.search = search;
      if (sortBy !== undefined) params.sortBy = sortBy;
      return storeApi.getStoreList(params);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasNext) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: isAuthenticated,
    staleTime: QUERY_STALE_TIME.STORE,
  });

  return query;
}

// 스토어 상세 조회 쿼리
export function useStoreDetail(storeId: string) {
  const query = useQuery({
    queryKey: storeQueryKeys.detail(storeId),
    queryFn: () => storeApi.getStoreDetail(storeId),
    enabled: !!storeId,
    staleTime: QUERY_STALE_TIME.STORE,
  });

  return query;
}

// 링크 효과(I-45): 링크 보내기 창을 열 때마다 새로 센다. 못 불러와도 알림은 띄우지 않는다(창의 다른 일은 그대로)
export function useStoreLinkStats(storeId: string) {
  return useQuery({
    queryKey: storeQueryKeys.linkStats(storeId),
    queryFn: () => storeApi.getLinkStats(storeId),
    enabled: !!storeId,
    staleTime: 0,
  });
}

/**
 * 저장 직전에 서버의 지금 영업 달력을 받는다. 영업 달력 저장은 쉬는 요일·영업시간·그날만 바꾼 날을 통째로 바꾸므로,
 * 화면에 갖고 있던(몇 시간 전일 수 있는) 값으로 저장하면 그사이 다른 기기에서 바꾼 것을 되돌린다(11-19 검토).
 * 받은 값은 화면 캐시에도 넣는다.
 */
export function useFetchFreshBusinessCalendar(storeId: string) {
  const queryClient = useQueryClient();
  return useCallback(async (): Promise<StoreBusinessCalendarDto> => {
    const store = await queryClient.fetchQuery({
      queryKey: storeQueryKeys.detail(storeId),
      queryFn: () => storeApi.getStoreDetail(storeId),
      staleTime: 0,
    });
    return calendarOrDefault(store.businessCalendar);
  }, [queryClient, storeId]);
}
