import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QUERY_STALE_TIME } from "@/apps/web-seller/common/constants/query-cache.constants";
import { useQueryErrorAlert } from "@/apps/web-seller/common/hooks/useQueryErrorAlert";
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

  useQueryErrorAlert(query);

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

  useQueryErrorAlert(query);

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
