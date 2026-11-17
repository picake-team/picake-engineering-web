/**
 * 그날 픽업 목록에 Picake 주문과 직접 적은 주문(기획 I-42)을 시각 순으로 섞는다.
 * 시각을 적지 않은 직접 적은 주문은 맨 뒤("미정"), 같은 시각이면 Picake 주문이 앞.
 */
import { kstDateKey, kstTime } from "@/apps/web-seller/common/utils/kst-date.util";
import type { DayPickupCount } from "@/apps/web-seller/common/ui/DayMarks";
import { CANCELED_ORDER_STATUSES } from "@/apps/web-seller/features/order/utils/order-mobile.util";
import type { OrderResponseDto } from "@/apps/web-seller/features/order/types/order.dto";
import type { ManualOrderDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";

type DayPickup =
  | { kind: "order"; id: string; order: OrderResponseDto }
  | { kind: "manual"; id: string; manual: ManualOrderDto };

export function mergeDayPickups(
  orders: OrderResponseDto[],
  manuals: ManualOrderDto[],
): DayPickup[] {
  const items = [
    ...orders.map((order) => ({
      item: { kind: "order" as const, id: order.id, order },
      time: kstTime(order.pickupDate),
      rank: 0,
    })),
    ...manuals.map((manual) => ({
      item: { kind: "manual" as const, id: manual.id, manual },
      // "미정"은 맨 뒤
      time: manual.pickupTime ?? "99:99",
      rank: 1,
    })),
  ];
  items.sort((a, b) => (a.time === b.time ? a.rank - b.rank : a.time < b.time ? -1 : 1));
  return items.map((x) => x.item);
}

/** Picake 주문을 픽업 날(한국 날짜)로 묶는다. 취소된 주문은 뺀다(달력 점·그날 목록·날짜 창 수) */
export function groupOrdersByPickupDay(orders: OrderResponseDto[] | undefined) {
  const map: Record<string, OrderResponseDto[]> = {};
  for (const o of orders ?? []) {
    if (CANCELED_ORDER_STATUSES.includes(o.orderStatus)) continue;
    (map[kstDateKey(o.pickupDate)] ??= []).push(o);
  }
  return map;
}

/** 직접 적은 주문을 픽업 날(YYYY-MM-DD)로 묶는다(서버가 날·시각 순으로 줌) */
export function groupManualByDay(manuals: ManualOrderDto[] | undefined) {
  const map: Record<string, ManualOrderDto[]> = {};
  for (const m of manuals ?? []) (map[m.pickupDate] ??= []).push(m);
  return map;
}

/** 날마다 픽업 수(점·숫자) */
export function pickupCountsByDay(
  ordersByDay: Record<string, OrderResponseDto[]>,
  manualByDay: Record<string, ManualOrderDto[]>,
): Record<string, DayPickupCount> {
  const out: Record<string, DayPickupCount> = {};
  for (const [key, list] of Object.entries(ordersByDay)) {
    out[key] = { picake: list.length, manual: 0 };
  }
  for (const [key, list] of Object.entries(manualByDay)) {
    out[key] = { picake: out[key]?.picake ?? 0, manual: list.length };
  }
  return out;
}
