import { useMemo } from "react";
import { useCalendarMonthOrders } from "@/apps/web-seller/features/order/hooks/queries/useOrderQuery";
import { useManualOrdersInRange } from "@/apps/web-seller/features/manual-order/hooks/queries/useManualOrderQuery";
import {
  groupManualByDay,
  groupOrdersByPickupDay,
  pickupCountsByDay,
} from "@/apps/web-seller/features/manual-order/utils/day-pickups.util";

/**
 * 기간(홈 한 주·캘린더 한 달·날짜 창 한 달)의 픽업: Picake 주문(취소 빼고)과 직접 적은 주문(기획 I-42)을
 * 날짜별로 묶고 날마다 수를 센다. 직접 적은 주문만 못 불러오면 Picake 주문은 그대로 보이게 따로 알린다
 * (새 기능 API가 실패해도 가장 중요한 오늘 픽업이 가려지지 않게)
 */
export function useDayPickups(
  storeId: string,
  startKey: string,
  endKey: string,
  opts?: { enabled?: boolean },
) {
  const orders = useCalendarMonthOrders(storeId, startKey, endKey, opts);
  const manual = useManualOrdersInRange(storeId, startKey, endKey, opts);
  const byDay = useMemo(() => groupOrdersByPickupDay(orders.data?.data), [orders.data]);
  const manualByDay = useMemo(() => groupManualByDay(manual.data), [manual.data]);
  const counts = useMemo(() => pickupCountsByDay(byDay, manualByDay), [byDay, manualByDay]);
  return {
    byDay,
    manualByDay,
    counts,
    /** Picake 주문이 왔고, 직접 적은 주문은 왔거나 실패함 */
    loaded: Boolean(orders.data) && (Boolean(manual.data) || manual.isError),
    ordersFailed: orders.isError && !orders.data,
    manualFailed: manual.isError && !manual.data,
    refetchOrders: () => void orders.refetch(),
    refetchManual: () => void manual.refetch(),
  };
}
