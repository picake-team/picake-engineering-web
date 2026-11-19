import type {
  StoreBusinessCalendarDto,
  StoreBusinessDayOverrideDto,
} from "@/apps/web-seller/features/store/types/store.dto";

/** 로컬 상태용 일별 오버라이드 (API openTime/closeTime ↔ start/end) */
export type DayOverride = {
  isOpen: boolean;
  start: string;
  end: string;
};

export function defaultBusinessCalendarDto(): StoreBusinessCalendarDto {
  return {
    weeklyClosedWeekdays: [],
    standardOpenTime: "00:00",
    standardCloseTime: "00:00",
    dayOverrides: [],
  };
}

export function toStoreBusinessCalendarDto(
  weeklyOff: Set<number>,
  standardOpen: string,
  standardClose: string,
  overrides: Record<string, DayOverride>,
): StoreBusinessCalendarDto {
  const dayOverrides: StoreBusinessDayOverrideDto[] = Object.entries(overrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, o]) => ({
      date,
      isOpen: o.isOpen,
      ...(o.isOpen ? { openTime: o.start, closeTime: o.end } : {}),
    }));
  return {
    weeklyClosedWeekdays: [...weeklyOff].sort((a, b) => a - b),
    standardOpenTime: standardOpen,
    standardCloseTime: standardClose,
    dayOverrides,
  };
}

export function overridesRecordFromApi(
  dayOverrides: StoreBusinessDayOverrideDto[],
  standardOpen: string,
  standardClose: string,
): Record<string, DayOverride> {
  const rec: Record<string, DayOverride> = {};
  for (const d of dayOverrides) {
    if (d.isOpen && d.openTime && d.closeTime) {
      rec[d.date] = { isOpen: true, start: d.openTime, end: d.closeTime };
    } else {
      rec[d.date] = { isOpen: false, start: standardOpen, end: standardClose };
    }
  }
  return rec;
}

/** 픽업 시각(UTC 저장) → 서울 기준 YYYY-MM-DD */
export function toSeoulDateKeyFromUtc(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** 픽업 시각 표시용 서울 HH:mm */
export function formatSeoulPickupHm(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

/** 30분 단위 시각 옵션 (00:00 ~ 23:30) */
export function buildHalfHourTimeOptions(): string[] {
  const out: string[] = [];
  for (let slot = 0; slot < 48; slot += 1) {
    const h = Math.floor(slot / 2);
    const m = (slot % 2) * 30;
    out.push(`${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`);
  }
  return out;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** 백엔드와 동일: 00:00~00:00 = 하루 전체 영업 */
export function isFullDayBusinessWindow(start: string, end: string): boolean {
  return start === "00:00" && end === "00:00";
}
