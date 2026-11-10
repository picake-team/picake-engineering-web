import { useInfiniteQuery } from "@tanstack/react-query";
import { QUERY_STALE_TIME } from "@/apps/web-user/common/constants/query-cache.constants";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import { orderApi } from "@/apps/web-user/features/order/apis/order.api";
import { orderQueryKeys } from "@/apps/web-user/features/order/constants/orderQueryKeys.constant";
import { MyOrdersResponse } from "@/apps/web-user/features/order/types/order.type";

const DEFAULT_LIMIT = 10;

export function useMyOrders(params?: { type?: "UPCOMING" | "PAST"; limit?: number }) {
  const { isAuthenticated } = useAuthStore();
  const limit = params?.limit ?? DEFAULT_LIMIT;

  const query = useInfiniteQuery<MyOrdersResponse>({
    queryKey: orderQueryKeys.mypage(params?.type),
    queryFn: ({ pageParam = 1 }) =>
      orderApi.getMyOrders({ type: params?.type, page: pageParam as number, limit }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.currentPage + 1 : undefined,
    initialPageParam: 1,
    enabled: isAuthenticated,
    staleTime: QUERY_STALE_TIME.REALTIME,
  });
  // 조회 실패는 목록 화면이 "불러오지 못했어요 · 다시 시도"로 알린다(오류 창 없음)

  return query;
}
