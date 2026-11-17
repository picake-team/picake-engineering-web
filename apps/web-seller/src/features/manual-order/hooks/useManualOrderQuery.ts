import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryErrorAlert } from "@/apps/web-seller/common/hooks/useQueryErrorAlert";
import { manualOrderApi } from "@/apps/web-seller/features/manual-order/apis/manual-order.api";
import { manualOrderQueryKeys } from "@/apps/web-seller/features/manual-order/constants/manual-order.constant";
import type { ManualOrderDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";
import { statisticsQueryKeys } from "@/apps/web-seller/features/statistics/constants/statisticsQueryKeys.constant";

/** 픽업 날이 기간(그날 포함) 안인 직접 적은 주문. 달력 한 달·홈 한 주 */
export function useManualOrdersInRange(storeId: string, startKey: string, endKey: string) {
  const query = useQuery<ManualOrderDto[]>({
    queryKey: manualOrderQueryKeys.range(storeId, startKey, endKey),
    queryFn: () => manualOrderApi.list(storeId, startKey, endKey),
    enabled: !!storeId && !!startKey && !!endKey,
  });
  useQueryErrorAlert(query);
  return query;
}

export function useManualOrder(storeId: string, id: string) {
  const query = useQuery<ManualOrderDto>({
    queryKey: manualOrderQueryKeys.detail(storeId, id),
    queryFn: () => manualOrderApi.get(storeId, id),
    enabled: !!storeId && !!id,
  });
  useQueryErrorAlert(query);
  return query;
}

/** 적기·고치기·지우기 뒤 달력·목록·매출을 다시 읽는다 */
export function useInvalidateManualOrders() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: manualOrderQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: statisticsQueryKeys.all }),
    ]);
}
