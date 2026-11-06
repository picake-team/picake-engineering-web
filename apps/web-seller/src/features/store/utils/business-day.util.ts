/**
 * 휴대폰 캘린더(SC-79·80)와 영업시간(SC-81)의 날짜별 영업 계산.
 * 규칙은 지금 PC 캘린더와 같다: 쉬는 요일 → 그날만 바꾼 것(dayOverrides)이 우선, 기본과 같게 바꾸면 지운다,
 * 00:00~00:00은 하루 전체.
 */
import { weekdayLabel, weekdayOfKey } from "@/apps/web-seller/common/utils/kst-date.util";
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

function sameRule(a: DayRule, b: DayRule): boolean {
  if (a.isOpen !== b.isOpen) return false;
  if (!a.isOpen) return true;
  return a.start === b.start && a.end === b.end;
}

/** 그날만 바꾼 캘린더. 기본과 같으면 그날 바꾼 것을 지운다 */
export function calendarWithDay(
  cal: StoreBusinessCalendarDto,
  dateKey: string,
  rule: DayRule,
): StoreBusinessCalendarDto {
  const rest = cal.dayOverrides.filter((d) => d.date !== dateKey);
  const dayOverrides = sameRule(rule, baseRule(dateKey, cal))
    ? rest
    : [
        ...rest,
        rule.isOpen
          ? { date: dateKey, isOpen: true, openTime: rule.start, closeTime: rule.end }
          : { date: dateKey, isOpen: false },
      ].sort((a, b) => a.date.localeCompare(b.date));
  return { ...cal, dayOverrides };
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

/** 캘린더 "이 날 영업" 줄 설명 */
export function dayRuleSummary(dateKey: string, cal: StoreBusinessCalendarDto): string {
  const r = effectiveRule(dateKey, cal);
  if (r.overridden) {
    return r.isOpen
      ? `이 날만 바꿨어요 · ${formatHoursRange(r.start, r.end)}`
      : "이 날만 쉬어요 · 다시 열 수 있어요";
  }
  if (!r.isOpen)
    return `매주 ${weekdayLabel(weekdayOfKey(dateKey))}요일 쉬어요 · 이 날만 열 수 있어요`;
  return `기본 영업시간대로 열어요 · ${formatHoursRange(r.start, r.end)}`;
}

/** 날짜 상세 맨 위 "지금은 …" 한 줄 */
export function dayRuleNow(dateKey: string, cal: StoreBusinessCalendarDto): string {
  const r = effectiveRule(dateKey, cal);
  if (r.overridden) {
    return r.isOpen
      ? `지금은 이 날만 바꿨어요 (${formatHoursRange(r.start, r.end)})`
      : "지금은 이 날만 쉬어요";
  }
  if (!r.isOpen) return `지금은 쉬는 날이에요 (매주 ${weekdayLabel(weekdayOfKey(dateKey))}요일)`;
  return `지금은 기본 영업시간대로 열어요 (${formatHoursRange(r.start, r.end)})`;
}
