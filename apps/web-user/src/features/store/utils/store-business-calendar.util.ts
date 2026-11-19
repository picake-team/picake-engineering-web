import type { StoreBusinessCalendar } from "@/apps/web-user/features/store/types/store.type";

const STORE_BUSINESS_CALENDAR_TIMEZONE = "Asia/Seoul";

function isStoreBusinessFullDayWindow(openHhmm: string, closeHhmm: string): boolean {
  return openHhmm === "00:00" && closeHhmm === "00:00";
}

/**
 * Asia/Seoul 기준 달력 날짜·분·요일(0=일 … 6=토, JS Date.getDay()와 동일)
 */
function getSeoulWallClockForPickup(pickupUtc: Date): {
  dateKey: string;
  minuteOfDay: number;
  weekday: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_BUSINESS_CALENDAR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    // hour12: false만 쓰면 일부 ICU가 자정대(00:00~00:59)를 "24:00~24:59"로 포맷해
    // minuteOfDay가 1440대로 계산되는 문제가 있어 hourCycle로 직접 고정한다.
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(pickupUtc);

  const v = (t: Intl.DateTimeFormatPart["type"]) => parts.find((p) => p.type === t)?.value ?? "";

  const month = v("month");
  const day = v("day");
  const year = v("year");
  const dateKey = `${year}-${month}-${day}`;

  const hour = Number.parseInt(v("hour"), 10);
  const minute = Number.parseInt(v("minute"), 10);
  const minuteOfDay = hour * 60 + minute;

  const wk = v("weekday").toLowerCase().replace(/\./g, "");
  const prefix3 = wk.slice(0, 3);
  const weekdayMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  const weekday = weekdayMap[prefix3] ?? 0;

  return { dateKey, minuteOfDay, weekday };
}

function parseHalfHourTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => Number.parseInt(x, 10));
  return h * 60 + m;
}

/**
 * 픽업 시각이 영업 창 안이면 true.
 * - open/close가 모두 00:00 → 하루 전체(0≤분<24*60)
 * - 그 외 → [open, close) (종료 시각 미포함)
 */
function isMinuteWithinHalfHourWindow(
  minuteOfDay: number,
  openHhmm: string,
  closeHhmm: string,
): boolean {
  if (isStoreBusinessFullDayWindow(openHhmm, closeHhmm)) {
    return minuteOfDay >= 0 && minuteOfDay < 24 * 60;
  }
  const openM = parseHalfHourTimeToMinutes(openHhmm);
  const closeM = parseHalfHourTimeToMinutes(closeHhmm);
  return minuteOfDay >= openM && minuteOfDay < closeM;
}

/**
 * 캘린더에서 고른 날(로컬 연·월·일)을 서울 12:00에 해당하는 instant로 고정해 요일·dateKey를 안정적으로 맞춤.
 */
export function anchorCalendarDateToSeoulNoonInstant(selectedCalendarDate: Date): Date {
  const y = selectedCalendarDate.getFullYear();
  const m = selectedCalendarDate.getMonth();
  const d = selectedCalendarDate.getDate();
  return new Date(Date.UTC(y, m, d, 12 - 9, 0, 0, 0));
}

/** 지도 오전: 서울 00:00~12:00 미만 / 오후: 12:00~24:00 미만 (백엔드와 동일) */
const MAP_MORNING_SLOT_START_MIN = 0;
const MAP_MORNING_SLOT_END_MIN = 12 * 60;
const MAP_AFTERNOON_SLOT_START_MIN = 12 * 60;
const MAP_AFTERNOON_SLOT_END_MIN = 24 * 60;

function openMinuteIntervalsOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  return Math.max(a0, b0) < Math.min(a1, b1);
}

/**
 * 선택한 캘린더 날짜의 서울 달력 기준 유효 영업 구간(분).무면 null.
 */
export function getEffectiveSeoulDayOpenMinuteRange(
  calendar: StoreBusinessCalendar,
  selectedCalendarDate: Date,
): { openMin: number; closeMin: number } | null {
  const anchor = anchorCalendarDateToSeoulNoonInstant(selectedCalendarDate);
  const { dateKey, weekday } = getSeoulWallClockForPickup(anchor);

  const override = calendar.dayOverrides.find((o) => o.date === dateKey);
  if (override) {
    if (!override.isOpen) return null;
    if (!override.openTime || !override.closeTime) return null;
    if (isStoreBusinessFullDayWindow(override.openTime, override.closeTime)) {
      return { openMin: 0, closeMin: 24 * 60 };
    }
    return {
      openMin: parseHalfHourTimeToMinutes(override.openTime),
      closeMin: parseHalfHourTimeToMinutes(override.closeTime),
    };
  }

  if (calendar.weeklyClosedWeekdays.includes(weekday)) {
    return null;
  }

  if (isStoreBusinessFullDayWindow(calendar.standardOpenTime, calendar.standardCloseTime)) {
    return { openMin: 0, closeMin: 24 * 60 };
  }
  return {
    openMin: parseHalfHourTimeToMinutes(calendar.standardOpenTime),
    closeMin: parseHalfHourTimeToMinutes(calendar.standardCloseTime),
  };
}

/**
 * 지도 오전·오후 필터: 해당 서울 반나절과 영업 구간이 겹치면 true.
 */
export function storeCalendarOverlapsMapPickupHalfDay(
  calendar: StoreBusinessCalendar,
  selectedCalendarDate: Date,
  slot: "morning" | "afternoon",
): boolean {
  const range = getEffectiveSeoulDayOpenMinuteRange(calendar, selectedCalendarDate);
  if (!range) return false;
  if (slot === "morning") {
    return openMinuteIntervalsOverlap(
      range.openMin,
      range.closeMin,
      MAP_MORNING_SLOT_START_MIN,
      MAP_MORNING_SLOT_END_MIN,
    );
  }
  return openMinuteIntervalsOverlap(
    range.openMin,
    range.closeMin,
    MAP_AFTERNOON_SLOT_START_MIN,
    MAP_AFTERNOON_SLOT_END_MIN,
  );
}

/**
 * 현재 시각(UTC) 기준 Asia/Seoul에서 해당 스토어가 픽업/예약 가능한 영업 창 안이면 true.
 * (백엔드 pickupFitsBusinessCalendarState와 동일 규칙)
 */
export function isStoreOpenForPickupNow(
  calendar: StoreBusinessCalendar,
  at: Date = new Date(),
): boolean {
  const { dateKey, minuteOfDay, weekday } = getSeoulWallClockForPickup(at);

  const override = calendar.dayOverrides.find((o) => o.date === dateKey);
  if (override) {
    if (!override.isOpen) return false;
    if (!override.openTime || !override.closeTime) return false;
    return isMinuteWithinHalfHourWindow(minuteOfDay, override.openTime, override.closeTime);
  }

  if (calendar.weeklyClosedWeekdays.includes(weekday)) {
    return false;
  }

  return isMinuteWithinHalfHourWindow(
    minuteOfDay,
    calendar.standardOpenTime,
    calendar.standardCloseTime,
  );
}

/**
 * 해당 서울 달력 날짜에 영업(휴무 아님, 임시휴무 아님, 영업 시간대 정의됨)이면 true.
 * 지도 "하루종일" 필터용.
 */
export function isStoreOpenOnSeoulCalendarDay(
  calendar: StoreBusinessCalendar,
  selectedCalendarDate: Date,
): boolean {
  const anchor = anchorCalendarDateToSeoulNoonInstant(selectedCalendarDate);
  const { dateKey, weekday } = getSeoulWallClockForPickup(anchor);

  const override = calendar.dayOverrides.find((o) => o.date === dateKey);
  if (override) {
    if (!override.isOpen) return false;
    return Boolean(override.openTime && override.closeTime);
  }

  if (calendar.weeklyClosedWeekdays.includes(weekday)) {
    return false;
  }

  return Boolean(calendar.standardOpenTime && calendar.standardCloseTime);
}

const KOREAN_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 서울 달력 날짜(dateKey·요일)의 영업 구간(분). 휴무면 null */
function seoulDayOpenRange(
  calendar: StoreBusinessCalendar,
  dateKey: string,
  weekday: number,
): { openMin: number; closeMin: number } | null {
  const override = calendar.dayOverrides.find((o) => o.date === dateKey);
  const open = override ? override.openTime : calendar.standardOpenTime;
  const close = override ? override.closeTime : calendar.standardCloseTime;
  if (override ? !override.isOpen : calendar.weeklyClosedWeekdays.includes(weekday)) return null;
  if (!open || !close) return null;
  if (isStoreBusinessFullDayWindow(open, close)) return { openMin: 0, closeMin: 24 * 60 };
  return { openMin: parseHalfHourTimeToMinutes(open), closeMin: parseHalfHourTimeToMinutes(close) };
}

function koreanClockLabel(minuteOfDay: number): string {
  const h = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${h < 12 ? "오전" : "오후"} ${hour12}시${m ? ` ${m}분` : ""}`;
}

/**
 * 영업시간 밖이면 다음에 여는 때(예: "내일 오전 11시부터", "11월 24일(화) 오후 2시부터").
 * 지금 영업 중이면 null, 14일 안에 여는 날이 없으면 "" (영업시간 밖이지만 언제 여는지 모름).
 * 손님 문의 창·채팅방의 "지금은 영업시간이 아니에요" 줄에 쓴다(기획 I-01·I-11, 영업 캘린더를 그대로 씀).
 */
export function getNextStoreOpenLabel(
  calendar: StoreBusinessCalendar,
  at: Date = new Date(),
): string | null {
  if (isStoreOpenForPickupNow(calendar, at)) return null;
  for (let i = 0; i < 14; i += 1) {
    const { dateKey, weekday, minuteOfDay } = getSeoulWallClockForPickup(
      new Date(at.getTime() + i * 24 * 60 * 60 * 1000),
    );
    const range = seoulDayOpenRange(calendar, dateKey, weekday);
    if (!range) continue;
    // 오늘은 아직 열기 전일 때만(닫은 뒤면 다음 날)
    if (i === 0 && minuteOfDay >= range.openMin) continue;
    const [, month, day] = dateKey.split("-").map((x) => Number.parseInt(x, 10));
    const dayWord =
      i === 0 ? "오늘" : i === 1 ? "내일" : `${month}월 ${day}일(${KOREAN_WEEKDAYS[weekday]})`;
    return range.openMin === 0 && range.closeMin === 24 * 60
      ? `${dayWord}부터`
      : `${dayWord} ${koreanClockLabel(range.openMin)}부터`;
  }
  return "";
}
