import { useQuery } from "@tanstack/react-query";
import { useQueryErrorAlert } from "@/apps/web-seller/common/hooks/useQueryErrorAlert";
import { orderApi } from "@/apps/web-seller/features/order/apis/order.api";
import { orderQueryKeys } from "@/apps/web-seller/features/order/constants/orderQueryKeys.constant";
import {
  OrderListResponseDto,
  OrderSortBy,
  OrderResponseDto,
  OrderListRequestDto,
} from "@/apps/web-seller/features/order/types/order.dto";
import type { OrderListQueryParams } from "@/apps/web-seller/features/order/types/order.ui";

export function useOrderList({
  page = 1,
  limit = 30,
  sortBy = OrderSortBy.LATEST,
  storeId,
  orderStatus,
  startDate,
  endDate,
  pickupStartDate,
  pickupEndDate,
  orderNumber,
  productName,
  type,
}: Partial<OrderListQueryParams> & { page: number; limit: number; sortBy: OrderSortBy }) {
  const query = useQuery<OrderListResponseDto>({
    queryKey: orderQueryKeys.list({
      page,
      limit,
      sortBy,
      storeId,
      orderStatus,
      startDate,
      endDate,
      pickupStartDate,
      pickupEndDate,
      orderNumber,
      productName,
      type,
    }),
    queryFn: () => {
      const params: OrderListRequestDto = {
        page,
        limit,
        sortBy,
      };
      if (storeId) {
        params.storeId = storeId;
      }
      if (orderStatus) {
        params.orderStatus = orderStatus;
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }
      if (pickupStartDate) {
        params.pickupStartDate = pickupStartDate;
      }
      if (pickupEndDate) {
        params.pickupEndDate = pickupEndDate;
      }
      if (orderNumber) {
        params.orderNumber = orderNumber;
      }
      if (productName) {
        params.productName = productName;
      }
      if (type) {
        params.type = type;
      }
      return orderApi.getOrders(params);
    },
  });

  useQueryErrorAlert(query);

  return query;
}

export function useOrderDetail(orderId: string) {
  const query = useQuery<OrderResponseDto>({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => orderApi.getOrderDetail(orderId),
    enabled: !!orderId,
  });

  useQueryErrorAlert(query);

  return query;
}

/** 스토어 캘린더: 선택한 픽업일(YYYY-MM-DD) 주문 목록 */
export function useCalendarDayOrders(storeId: string, pickupDayKey: string | null) {
  const query = useQuery<OrderListResponseDto>({
    queryKey: orderQueryKeys.calendarByStore(storeId, pickupDayKey),
    queryFn: () =>
      orderApi.getOrders({
        page: 1,
        limit: 200,
        sortBy: OrderSortBy.LATEST,
        storeId,
        pickupStartDate: pickupDayKey!,
        pickupEndDate: pickupDayKey!,
      }),
    enabled: !!storeId && !!pickupDayKey,
  });

  useQueryErrorAlert(query);

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

  useQueryErrorAlert(query);

  return query;
}
