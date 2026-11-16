import { describe, expect, it } from "vitest";
import type { OrderResponseDto } from "@/apps/web-seller/features/order/types/order.dto";
import { OrderStatus } from "@/apps/web-seller/features/order/types/order.dto";
import type { StoreBusinessCalendarDto } from "@/apps/web-seller/features/store/types/store.dto";
import { findCalendarOrderConflicts } from "@/apps/web-seller/features/store/utils/store-calendar-conflict.util";

/** 모든 요일 휴무로 바꾸는 캘린더 */
const allClosed = {
  weeklyClosedWeekdays: [0, 1, 2, 3, 4, 5, 6],
  standardOpenTime: "11:00",
  standardCloseTime: "19:00",
  dayOverrides: [],
} as unknown as StoreBusinessCalendarDto;

const order = (id: string, pickupDate: string, orderStatus = OrderStatus.PICKUP_PENDING) =>
  ({
    id,
    orderNumber: `ORD-${id}`,
    orderStatus,
    pickupDate: new Date(pickupDate),
  }) as unknown as OrderResponseDto;

describe("영업 캘린더 겹침 검사(화면) — 앞으로의 픽업만(서버와 같게, 11-16 검토)", () => {
  const now = new Date("2026-11-16T03:00:00.000Z");

  it("픽업 시각이 지난 픽업대기는 막지 않고, 앞으로의 예약만 알려 준다", () => {
    const conflicts = findCalendarOrderConflicts(
      allClosed,
      [order("past", "2026-11-10T05:00:00.000Z"), order("future", "2026-11-18T05:00:00.000Z")],
      now,
    );
    expect(conflicts.map((c) => c.orderId)).toEqual(["future"]);
  });

  it("끝난 상태(픽업 완료)는 앞으로의 픽업이어도 막지 않는다", () => {
    const conflicts = findCalendarOrderConflicts(
      allClosed,
      [order("done", "2026-11-18T05:00:00.000Z", OrderStatus.PICKUP_COMPLETED)],
      now,
    );
    expect(conflicts).toHaveLength(0);
  });
});
