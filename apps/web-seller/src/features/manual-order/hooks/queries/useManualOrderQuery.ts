import { useQuery, useQueryClient } from "@tanstack/react-query";
import { manualOrderApi } from "@/apps/web-seller/features/manual-order/apis/manual-order.api";
import { manualOrderQueryKeys } from "@/apps/web-seller/features/manual-order/constants/manualOrderQueryKeys.constant";
import type { ManualOrderDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";
import { statisticsQueryKeys } from "@/apps/web-seller/features/statistics/constants/statisticsQueryKeys.constant";

/** 픽업 날이 기간(그날 포함) 안인 직접 적은 주문. 달력 한 달·홈 한 주 */
export function useManualOrdersInRange(
  storeId: string,
  startKey: string,
  endKey: string,
  opts?: { enabled?: boolean },
) {
  const query = useQuery<ManualOrderDto[]>({
    queryKey: manualOrderQueryKeys.range(storeId, startKey, endKey),
    queryFn: () => manualOrderApi.list(storeId, startKey, endKey),
    enabled: (opts?.enabled ?? true) && !!storeId && !!startKey && !!endKey,
  });
  return query;
}

export function useManualOrder(storeId: string, id: string) {
  const query = useQuery<ManualOrderDto>({
    queryKey: manualOrderQueryKeys.detail(storeId, id),
    queryFn: () => manualOrderApi.get(storeId, id),
    enabled: !!storeId && !!id,
  });
  return query;
}

/**
 * 적기·고치기·지우기 뒤 달력·목록·매출을 다시 읽는다.
 * 지운 주문(`exceptId`)의 상세는 다시 읽지 않는다(아직 열린 상세가 404를 받아 깜빡이고 캘린더로 튕기지 않게)
 */
export function useInvalidateManualOrders() {
  const queryClient = useQueryClient();
  return (opts?: { exceptId?: string }) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: manualOrderQueryKeys.all,
        predicate: opts?.exceptId
          ? (q) => !(q.queryKey[2] === "detail" && q.queryKey[4] === opts.exceptId)
          : undefined,
      }),
      queryClient.invalidateQueries({ queryKey: statisticsQueryKeys.all }),
    ]);
}
