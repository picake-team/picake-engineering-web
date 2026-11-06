/**
 * 휴대폰 캘린더(SC-79)와 영업시간(SC-81)의 날짜별 영업 계산.
 * 규칙은 지금 PC 캘린더와 같다: 쉬는 요일 → 그날만 바꾼 것(dayOverrides, 바꾸기는 PC 캘린더에서)이 우선,
 * 00:00~00:00은 하루 전체.
 */
import { weekdayOfKey } from "@/apps/web-seller/common/utils/kst-date.util";
import type { StoreBusinessCalendarDto } from "@/apps/web-seller/features/store/types/store.dto";
import { defaultBusinessCalendarDto } from "@/apps/web-seller/features/store/utils/store-calendar.util";

export interface DayRule {
  isOpen: boolean;
  start: string;
  end: string;
}

export function calendarOrDefault(
  cal: StoreBusinessCalendarDto | undefined,
): StoreBusinessCalendarDto {
  return cal ?? defaultBusinessCalendarDto();
}

/** 쉬는 요일·기본 영업시간만으로 정한 그날 영업 */
export function baseRule(dateKey: string, cal: StoreBusinessCalendarDto): DayRule {
  const closed = cal.weeklyClosedWeekdays.includes(weekdayOfKey(dateKey));
  return { isOpen: !closed, start: cal.standardOpenTime, end: cal.standardCloseTime };
}

/** 그날 실제 영업(그날만 바꾼 것이 있으면 그것) */
export function effectiveRule(
  dateKey: string,
  cal: StoreBusinessCalendarDto,
): DayRule & { overridden: boolean } {
  const o = cal.dayOverrides.find((d) => d.date === dateKey);
  if (!o) return { ...baseRule(dateKey, cal), overridden: false };
  if (o.isOpen && o.openTime && o.closeTime) {
    return { isOpen: true, start: o.openTime, end: o.closeTime, overridden: true };
  }
  return {
    isOpen: false,
    start: cal.standardOpenTime,
    end: cal.standardCloseTime,
    overridden: true,
  };
}

export function formatHoursRange(start: string, end: string): string {
  return start === "00:00" && end === "00:00" ? "하루 종일" : `${start}~${end}`;
}

/** 달력 칸 아래 표시: 쉬는 날 "휴무", 그날만 바꿔 여는 날 "바꿈" */
export function dayMark(
  dateKey: string,
  cal: StoreBusinessCalendarDto,
): "closed" | "changed" | null {
  const r = effectiveRule(dateKey, cal);
  if (!r.isOpen) return "closed";
  return r.overridden ? "changed" : null;
}
