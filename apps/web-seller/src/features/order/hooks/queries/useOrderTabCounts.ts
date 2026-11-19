import type { OrderSortBy } from "@/apps/web-seller/features/order/types/order.dto";
import {
  groupsForTab,
  type OrderTab,
} from "@/apps/web-seller/features/order/utils/order-mobile.util";
import {
  useOrderStatusGroup,
  type OrderDateFilter,
} from "@/apps/web-seller/features/order/hooks/queries/useOrderMobileQuery";

/**
 * 탭 숫자와 빈 탭 판단(처리할 것·진행 중). 탭 안 묶음 목록과 같은 조건이라 캐시를 같이 쓴다 — 휴대폰 주문 목록·PC 주문 화면 공용.
 * 묶음은 많아야 4개라 훅을 네 번 부르고(훅은 반복문에서 부를 수 없음) 없는 칸은 꺼 둔다.
 */
export function useOrderTabCounts(
  storeId: string,
  tab: Exclude<OrderTab, "past">,
  filter: OrderDateFilter & { sortBy?: OrderSortBy },
) {
  const groups = groupsForTab(tab);
  const a = useOrderStatusGroup(storeId, groups[0].status, filter);
  const b = useOrderStatusGroup(storeId, groups[1].status, filter);
  const c = useOrderStatusGroup(storeId, groups[2]?.status ?? groups[0].status, filter, {
    enabled: Boolean(groups[2]),
  });
  const d = useOrderStatusGroup(storeId, groups[3]?.status ?? groups[0].status, filter, {
    enabled: Boolean(groups[3]),
  });
  const qs = [a, b, c, d].slice(0, groups.length);
  const loading = qs.some((q) => q.isLoading);
  const error = qs.find((q) => q.isError);
  const total = qs.reduce((sum, q) => sum + (q.total ?? 0), 0);
  return { loading, error, total, refetch: () => Promise.all(qs.map((q) => q.refetch())) };
}
