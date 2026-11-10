/**
 * 한국 시간(Asia/Seoul) 날짜 계산과 휴대폰 화면 날짜 글자.
 * 날짜 키는 "YYYY-MM-DD"(서울 달력)이고, 키끼리 계산은 UTC 자정으로 해 기기 시간대와 상관없게 한다.
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const KST_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  weekday: "short",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface KstParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 = 일요일 */
  weekday: number;
}

export function kstParts(date: Date | string): KstParts {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = KST_PARTS.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const hour = Number(get("hour")) % 24; // 일부 엔진은 자정을 24로 준다
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour,
    minute: Number(get("minute")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** 서울 기준 날짜 키 YYYY-MM-DD */
export function kstDateKey(date: Date | string): string {
  const p = kstParts(date);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/** 서울 기준 HH:mm */
export function kstTime(date: Date | string): string {
  const p = kstParts(date);
  return `${pad2(p.hour)}:${pad2(p.minute)}`;
}

/** 올해가 아니면 "2025년 " (작년 주문·내년 픽업이 올해 날짜처럼 보이지 않게), 올해면 "" */
function yearPrefix(year: number): string {
  return year === kstParts(new Date()).year ? "" : `${year}년 `;
}

/** "11월 12일(수)" (올해가 아니면 "2025년 12월 24일(수)") */
export function formatKstMonthDayWeek(date: Date | string): string {
  const p = kstParts(date);
  return `${yearPrefix(p.year)}${p.month}월 ${p.day}일(${WEEKDAYS[p.weekday]})`;
}

/** "11월 12일(수) 14:00" */
export function formatKstMonthDayWeekTime(date: Date | string): string {
  return `${formatKstMonthDayWeek(date)} ${kstTime(date)}`;
}

/** "11월 6일 09:12" (주문 시각처럼 요일이 필요 없는 곳, 올해가 아니면 해 붙임) */
export function formatKstMonthDayTime(date: Date | string): string {
  const p = kstParts(date);
  return `${yearPrefix(p.year)}${p.month}월 ${p.day}일 ${pad2(p.hour)}:${pad2(p.minute)}`;
}

/** "2026년 11월 6일 09:12" (주문 정보처럼 해가 필요한 곳) */
export function formatKstFullDateTime(date: Date | string): string {
  const p = kstParts(date);
  return `${p.year}년 ${p.month}월 ${p.day}일 ${pad2(p.hour)}:${pad2(p.minute)}`;
}

function keyToUtc(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function utcToKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function addDaysToKey(key: string, days: number): string {
  const d = keyToUtc(key);
  d.setUTCDate(d.getUTCDate() + days);
  return utcToKey(d);
}

/** 0 = 일요일 */
export function weekdayOfKey(key: string): number {
  return keyToUtc(key).getUTCDay();
}

/** 그 주 일요일(주간 달력은 일~토) */
export function sundayOfKey(key: string): string {
  return addDaysToKey(key, -weekdayOfKey(key));
}

/** 그 주 월요일(이번 주 매출은 월요일부터) */
export function mondayOfKey(key: string): string {
  const w = weekdayOfKey(key);
  return addDaysToKey(key, w === 0 ? -6 : 1 - w);
}

/** 그달 1일 키 */
export function monthStartKey(key: string): string {
  return `${key.slice(0, 8)}01`;
}

/** 그달 마지막 날 키(1일 키를 넘긴다) */
export function monthEndKey(startKey: string): string {
  const [y, m] = startKey.split("-").map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${pad2(m + 1)}-01`;
  return addDaysToKey(nextMonth, -1);
}

/** 1일 키를 delta달 옮긴다 */
export function shiftMonthKey(startKey: string, delta: number): string {
  const [y, m] = startKey.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  return `${Math.floor(idx / 12)}-${pad2((idx % 12) + 1)}-01`;
}

export function dayOfKey(key: string): number {
  return Number(key.split("-")[2]);
}

/** 날짜 키 → "11월 10일(월)" (올해가 아니면 해 붙임) */
export function formatKeyMonthDayWeek(key: string): string {
  const d = keyToUtc(key);
  return `${yearPrefix(d.getUTCFullYear())}${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${WEEKDAYS[d.getUTCDay()]})`;
}

export function weekdayLabel(index: number): string {
  return WEEKDAYS[((index % 7) + 7) % 7];
}

/** 남은 시간 "2시간 41분" (1분 미만은 "1분 미만") */
export function formatRemainingHm(ms: number): string {
  if (ms <= 0) return "0분";
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 1) return "1분 미만";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** 남은 시간 "02:41:10" */
export function formatRemainingClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}
