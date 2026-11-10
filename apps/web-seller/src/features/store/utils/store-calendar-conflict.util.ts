import type { OrderResponseDto } from "@/apps/web-seller/features/order/types/order.dto";
import { OrderStatus } from "@/apps/web-seller/features/order/types/order.dto";
import { getOrderStatusLabel } from "@/apps/web-seller/features/order/utils/order-status-ui.util";
import type { StoreBusinessCalendarDto } from "@/apps/web-seller/features/store/types/store.dto";
import {
  formatSeoulPickupHm,
  isFullDayBusinessWindow,
  timeToMinutes,
  toSeoulDateKeyFromUtc,
} from "@/apps/web-seller/features/store/utils/store-calendar.util";

export const CALENDAR_BLOCKING_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.RESERVATION_REQUESTED,
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PAYMENT_COMPLETED,
  OrderStatus.CONFIRMED,
  OrderStatus.PICKUP_PENDING,
]);

export type CalendarOrderConflict = {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  pickupDateSeoulKey: string;
  pickupTimeSeoul: string;
};

function getSeoulMinuteOfDay(pickupUtc: Date | string): number {
  const d = typeof pickupUtc === "string" ? new Date(pickupUtc) : pickupUtc;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = Number.parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const m = Number.parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return h * 60 + m;
}

function getSeoulWeekday(pickupUtc: Date | string): number {
  const d = typeof pickupUtc === "string" ? new Date(pickupUtc) : pickupUtc;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).formatToParts(d);
  const wk = (parts.find((p) => p.type === "weekday")?.value ?? "Sun")
    .toLowerCase()
    .replace(/\./g, "")
    .slice(0, 3);
  const weekdayMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  return weekdayMap[wk] ?? 0;
}

function isMinuteWithinBusinessWindow(
  minuteOfDay: number,
  openHhmm: string,
  closeHhmm: string,
): boolean {
  if (isFullDayBusinessWindow(openHhmm, closeHhmm)) {
    return minuteOfDay >= 0 && minuteOfDay < 24 * 60;
  }
  return minuteOfDay >= timeToMinutes(openHhmm) && minuteOfDay < timeToMinutes(closeHhmm);
}

/** 백엔드 pickupFitsBusinessCalendarState와 동일 규칙 */
export function pickupFitsStoreBusinessCalendarDto(
  pickupUtc: Date | string,
  calendar: StoreBusinessCalendarDto,
): boolean {
  const dateKey = toSeoulDateKeyFromUtc(pickupUtc);
  const minuteOfDay = getSeoulMinuteOfDay(pickupUtc);
  const weekday = getSeoulWeekday(pickupUtc);

  const override = calendar.dayOverrides.find((o) => o.date === dateKey);
  if (override) {
    if (!override.isOpen) return false;
    if (!override.openTime || !override.closeTime) return false;
    return isMinuteWithinBusinessWindow(minuteOfDay, override.openTime, override.closeTime);
  }

  if (calendar.weeklyClosedWeekdays.includes(weekday)) {
    return false;
  }

  return isMinuteWithinBusinessWindow(
    minuteOfDay,
    calendar.standardOpenTime,
    calendar.standardCloseTime,
  );
}

export function findCalendarOrderConflicts(
  proposedCalendar: StoreBusinessCalendarDto,
  orders: readonly OrderResponseDto[],
): CalendarOrderConflict[] {
  const conflicts: CalendarOrderConflict[] = [];

  for (const order of orders) {
    if (!CALENDAR_BLOCKING_ORDER_STATUSES.has(order.orderStatus)) continue;
    if (pickupFitsStoreBusinessCalendarDto(order.pickupDate, proposedCalendar)) continue;

    conflicts.push({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      pickupDateSeoulKey: toSeoulDateKeyFromUtc(order.pickupDate),
      pickupTimeSeoul: formatSeoulPickupHm(order.pickupDate),
    });
  }

  conflicts.sort(
    (a, b) =>
      `${a.pickupDateSeoulKey}T${a.pickupTimeSeoul}`.localeCompare(
        `${b.pickupDateSeoulKey}T${b.pickupTimeSeoul}`,
      ) || a.orderNumber.localeCompare(b.orderNumber),
  );

  return conflicts;
}

export function formatCalendarConflictMessage(conflicts: readonly CalendarOrderConflict[]): string {
  if (conflicts.length === 0) return "";

  const lines = [
    `진행 중인 예약 ${conflicts.length}건과 영업 설정이 맞지 않아 저장할 수 없어요.`,
    "",
    ...conflicts
      .slice(0, 5)
      .map(
        (c) =>
          `· ${c.pickupDateSeoulKey} ${c.pickupTimeSeoul} ${getOrderStatusLabel(c.orderStatus)} (${c.orderNumber})`,
      ),
  ];

  if (conflicts.length > 5) {
    lines.push(`· 외 ${conflicts.length - 5}건`);
  }

  lines.push("", "해당 예약을 취소하거나 영업 시간을 조정한 뒤 다시 저장해 주세요.");
  return lines.join("\n");
}
