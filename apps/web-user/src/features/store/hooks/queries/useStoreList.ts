import { useInfiniteQuery } from "@tanstack/react-query";
import { storeApi } from "@/apps/web-user/features/store/apis/store.api";
import { storeQueryKeys } from "@/apps/web-user/features/store/constants/storeQueryKeys.constant";
import {
  StoreListResponse,
  StoreListFilter,
} from "@/apps/web-user/features/store/types/store.type";

export function useStoreList({
  search,
  limit = 20,
  sizes,
  minPrice,
  maxPrice,
  productCategoryTypes,
  sortBy,
}: { search?: string; limit?: number; sortBy?: string } & StoreListFilter = {}) {
  const query = useInfiniteQuery<StoreListResponse>({
    queryKey: storeQueryKeys.list({
      search,
      sizes,
      minPrice,
      maxPrice,
      productCategoryTypes,
      sortBy,
    }),
    queryFn: ({ pageParam = 1 }) =>
      storeApi.getList({
        search,
        page: pageParam as number,
        limit,
        sizes,
        minPrice,
        maxPrice,
        productCategoryTypes,
        sortBy,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.currentPage + 1 : undefined,
    initialPageParam: 1,
    // 검색 화면은 검색어가 있거나 홈 카테고리로 왔을 때만 이 목록을 그린다.
    // 검색어로 막으면 카테고리로 본 "스토어" 탭이 늘 "검색 결과가 없어요"가 된다(서버는 검색어 없이 필터만으로도 찾는다)
  });
  // 조회 실패는 목록 화면이 "불러오지 못했어요 · 다시 시도"로 알린다(오류 창 없음)

  return query;
}
