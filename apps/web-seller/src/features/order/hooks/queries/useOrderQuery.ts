import { useQuery } from "@tanstack/react-query";
import { orderApi } from "@/apps/web-seller/features/order/apis/order.api";
import { orderQueryKeys } from "@/apps/web-seller/features/order/constants/orderQueryKeys.constant";
import {
  OrderListResponseDto,
  OrderSortBy,
  OrderResponseDto,
} from "@/apps/web-seller/features/order/types/order.dto";

export function useOrderDetail(orderId: string) {
  const query = useQuery<OrderResponseDto>({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => orderApi.getOrderDetail(orderId),
    enabled: !!orderId,
  });

  return query;
}

/** 스토어 캘린더: 픽업 월(YYYY-MM-DD ~ YYYY-MM-DD) 주문 목록 */
export function useCalendarMonthOrders(
  storeId: string,
  pickupStartKey: string,
  pickupEndKey: string,
  opts?: { enabled?: boolean },
) {
  const query = useQuery<OrderListResponseDto>({
    queryKey: orderQueryKeys.calendarMonthByStore(storeId, pickupStartKey, pickupEndKey),
    queryFn: () =>
      orderApi.getOrders({
        page: 1,
        limit: 200,
        sortBy: OrderSortBy.LATEST,
        storeId,
        pickupStartDate: pickupStartKey,
        pickupEndDate: pickupEndKey,
      }),
    enabled: (opts?.enabled ?? true) && !!storeId && !!pickupStartKey && !!pickupEndKey,
  });

  return query;
}
