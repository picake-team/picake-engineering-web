import type { ManualOrderSource } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";

/**
 * GET `/v1/seller/statistics/orders/overview` 응답 본문(`data` 필드).
 * 접수일(created_at)이 기간에 들어가고 상태가 `includedOrderStatuses`인 주문만 집계.
 */

export interface OrderStatisticsProductStatDto {
  productId: string;
  productName: string;
  revenue: number;
  orderCount: number;
}

export interface OrderStatisticsWeekdayDto {
  weekday: number;
  label: string;
  total: number;
}

export interface OrderStatisticsHourlyDto {
  hour: number;
  count: number;
}

/** 직접 적은 주문(기획 I-42) 받은 곳 한 줄 */
export interface ManualOrderSourceStatDto {
  source: ManualOrderSource;
  sales: number;
  orders: number;
}

/**
 * 직접 적은 주문(기획 I-42) 통계. Picake 주문과 달리 픽업 날이 기간 안이고 오늘까지 지난 주문을 센다.
 * 매출은 금액을 적은 주문만. 사장님 화면은 Picake 숫자와 더해 보인다
 */
export interface ManualOrderStatisticsDto {
  totalSales: number;
  totalOrders: number;
  bySource: ManualOrderSourceStatDto[];
  weekdayPickupSales: OrderStatisticsWeekdayDto[];
  weekdayPickupOrders: OrderStatisticsWeekdayDto[];
  hourlyPickupOrders: OrderStatisticsHourlyDto[];
}

export interface OrderStatisticsOverviewResponseDto {
  includedOrderStatuses: string[];
  totalSales: number;
  totalOrders: number;
  topProductsByRevenue: OrderStatisticsProductStatDto[];
  topProductsByOrders: OrderStatisticsProductStatDto[];
  weekdaySales: OrderStatisticsWeekdayDto[];
  weekdayOrders: OrderStatisticsWeekdayDto[];
  hourlyOrders: OrderStatisticsHourlyDto[];
  /** 픽업 예정일시(Asia/Seoul) 기준, 픽업일 없는 주문 제외 */
  weekdayPickupSales: OrderStatisticsWeekdayDto[];
  weekdayPickupOrders: OrderStatisticsWeekdayDto[];
  hourlyPickupOrders: OrderStatisticsHourlyDto[];
  /** 직접 적은 주문(기획 I-42). 옛 서버면 없다 */
  manual?: ManualOrderStatisticsDto;
}

export interface OrderStatisticsOverviewQueryParams {
  storeId: string;
  startDate: string;
  endDate: string;
}
