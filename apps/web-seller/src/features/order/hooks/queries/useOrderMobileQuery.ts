/**
 * 휴대폰 화면 주문 목록 조회(계속 불러오기). 키가 "order"로 시작해 상태를 바꾸면 함께 새로 불러온다.
 * 홈 "처리할 주문" 숫자와 주문 탭 칸이 같은 조건이면 같은 캐시를 쓴다.
 */
import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryErrorAlert } from "@/apps/web-seller/common/hooks/useQueryErrorAlert";
import { orderApi } from "@/apps/web-seller/features/order/apis/order.api";
import { orderQueryKeys } from "@/apps/web-seller/features/order/constants/orderQueryKeys.constant";
import {
  OrderSortBy,
  type OrderListRequestDto,
  type OrderListResponseDto,
  type OrderResponseDto,
  type OrderStatus,
  type OrderType,
} from "@/apps/web-seller/features/order/types/order.dto";

/** 찾기 창에서 고르는 날짜(YYYY-MM-DD, 서울 달력) */
export interface OrderDateFilter {
  pickupStartDate?: string;
  pickupEndDate?: string;
  startDate?: string;
  endDate?: string;
}

export const ORDER_MOBILE_PAGE_SIZE = 20;

export interface OrderMobileListParams extends OrderDateFilter {
  storeId: string;
  sortBy: OrderSortBy;
  orderStatus?: OrderStatus;
  type?: OrderType;
  orderNumber?: string;
  productName?: string;
  keyword?: string;
}

function cleanParams(params: OrderMobileListParams): Omit<OrderListRequestDto, "page" | "limit"> {
  const out: Omit<OrderListRequestDto, "page" | "limit"> = {
    storeId: params.storeId,
    sortBy: params.sortBy,
  };
  if (params.orderStatus) out.orderStatus = params.orderStatus;
  if (params.type) out.type = params.type;
  if (params.orderNumber) out.orderNumber = params.orderNumber;
  if (params.productName) out.productName = params.productName;
  if (params.keyword) out.keyword = params.keyword;
  if (params.pickupStartDate) out.pickupStartDate = params.pickupStartDate;
  if (params.pickupEndDate) out.pickupEndDate = params.pickupEndDate;
  if (params.startDate) out.startDate = params.startDate;
  if (params.endDate) out.endDate = params.endDate;
  return out;
}

export interface OrderMobileListOptions {
  enabled?: boolean;
  pageSize?: number;
  /** 같은 조회를 여러 곳에서 쓸 때 오류 안내를 한 번만 띄우려고 나머지는 조용히 */
  silent?: boolean;
}

export function useOrderMobileList(
  params: OrderMobileListParams,
  {
    enabled = true,
    pageSize = ORDER_MOBILE_PAGE_SIZE,
    silent = false,
  }: OrderMobileListOptions = {},
) {
  const base = cleanParams(params);
  const query = useInfiniteQuery<OrderListResponseDto>({
    queryKey: [...orderQueryKeys.lists(), "mobile", pageSize, base],
    queryFn: ({ pageParam }) =>
      orderApi.getOrders({ ...base, page: pageParam as number, limit: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNext ? last.meta.currentPage + 1 : undefined),
    enabled: enabled && !!params.storeId,
  });
  useQueryErrorAlert({ isError: silent ? false : query.isError, error: query.error });

  const orders: OrderResponseDto[] = [];
  const seen = new Set<string>();
  for (const page of query.data?.pages ?? []) {
    for (const o of page.data) {
      if (!seen.has(o.id)) {
        seen.add(o.id);
        orders.push(o);
      }
    }
  }
  const total = query.data?.pages[0]?.meta.totalItems;
  // 다시 불러오기만 실패했으면(끊김 등) 불러 둔 주문을 그대로 보여 준다. 못 불러온 게 처음일 때만 오류 화면
  return { ...query, isError: query.isError && query.data === undefined, orders, total };
}

/** 홈 숫자·주문 탭 칸: 상태 하나, 픽업 가까운 순 */
export function useOrderStatusGroup(
  storeId: string,
  orderStatus: OrderStatus,
  filter: OrderDateFilter & { sortBy?: OrderSortBy } = {},
  options?: OrderMobileListOptions,
) {
  const { sortBy = OrderSortBy.PICKUP_ASC, ...dates } = filter;
  return useOrderMobileList({ storeId, orderStatus, sortBy, ...dates }, options);
}
