/**
 * 그날만 영업 바꾸기(F-24). 휴대폰 캘린더와 PC 캘린더가 같이 쓴다(운영자 결정 2026-11-19 "휴대폰에도").
 * 예전 PC 캘린더(StoreCalendarPage)의 규칙 그대로: 평소와 같으면 바꾼 것을 지우고, 다르면 그날만 바꾼 것으로 둔다.
 */
import type { StoreBusinessCalendarDto } from "@/apps/web-seller/features/store/types/store.dto";
import {
  overridesRecordFromApi,
  toStoreBusinessCalendarDto,
} from "@/apps/web-seller/features/store/utils/store-calendar.util";
import { baseRule, effectiveRule } from "@/apps/web-seller/features/store/utils/business-day.util";

export type DayHoursMode = "base" | "open" | "closed";

export interface DayHoursDraft {
  mode: DayHoursMode;
  start: string;
  end: string;
}

/** 창을 열 때 그날 지금 영업 */
export function draftForDay(cal: StoreBusinessCalendarDto, dateKey: string): DayHoursDraft {
  const r = effectiveRule(dateKey, cal);
  if (!r.overridden) return { mode: "base", start: r.start, end: r.end };
  return { mode: r.isOpen ? "open" : "closed", start: r.start, end: r.end };
}

/** 저장할 달력: 그날만 바꾼 것을 넣거나(다르면) 지운다(평소와 같으면) */
export function calendarWithDay(
  cal: StoreBusinessCalendarDto,
  dateKey: string,
  draft: DayHoursDraft,
): StoreBusinessCalendarDto {
  const overrides = overridesRecordFromApi(
    cal.dayOverrides,
    cal.standardOpenTime,
    cal.standardCloseTime,
  );
  const base = baseRule(dateKey, cal);
  const isOpen = draft.mode === "base" ? base.isOpen : draft.mode === "open";
  const start = draft.mode === "open" ? draft.start : base.start;
  const end = draft.mode === "open" ? draft.end : base.end;
  const sameAsBase =
    draft.mode === "base" ||
    (isOpen === base.isOpen && (!isOpen || (start === base.start && end === base.end)));
  if (sameAsBase) delete overrides[dateKey];
  else overrides[dateKey] = { isOpen, start, end };
  return toStoreBusinessCalendarDto(
    new Set(cal.weeklyClosedWeekdays),
    cal.standardOpenTime,
    cal.standardCloseTime,
    overrides,
  );
}

/** 00:00~00:00은 하루 종일, 그 밖엔 끝이 시작보다 늦어야 한다(서버와 같다) */
export function dayHoursTimeError(draft: DayHoursDraft): string | null {
  if (draft.mode !== "open") return null;
  if (draft.start === "00:00" && draft.end === "00:00") return null;
  return draft.end <= draft.start ? "끝나는 시각을 시작 시각보다 늦게 골라 주세요" : null;
}
