import { QUOTE_LIMITS } from "@/apps/web-user/features/quote/constants/quote.constant";

/**
 * 요청서의 시간 규칙(기획 I-46 P-72, 서버 resolvePickupWindow와 같음).
 * 픽업 날짜·시각은 한국 시간이다. 휴대폰 시간대가 달라도(해외 로밍 등) 서버와 같은 값이 나오게
 * 시각 계산은 모두 한국 시간(UTC+9)으로 한다. 달력이 주고받는 Date만 기기 날짜(그날 0시)로 둔다.
 */
const HOUR_MS = 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * HOUR_MS;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function kstParts(date: Date) {
  const k = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: k.getUTCFullYear(),
    month: k.getUTCMonth() + 1,
    day: k.getUTCDate(),
    hour: k.getUTCHours(),
    weekday: k.getUTCDay(),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 달력에서 고른 날(기기 날짜) → YYYY-MM-DD */
export function toYmd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** YYYY-MM-DD → 달력에 넘길 Date(기기 날짜 0시) */
export function fromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 지금 한국 날짜 YYYY-MM-DD */
export function todayKstYmd(now: Date): string {
  const p = kstParts(now);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** 한국 시각의 시(0~23) */
export function kstHour(date: Date): number {
  return kstParts(date).hour;
}

/** 한국 날짜 ymd의 h시(실제 시각) */
function atKstHour(ymd: string, hour: number): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour) - KST_OFFSET_MS);
}

/** 지금부터 3시간 뒤를 정시로 올린 시각 */
export function earliestPickup(now: Date): Date {
  const t = now.getTime() + QUOTE_LIMITS.MIN_LEAD_HOURS * HOUR_MS;
  return new Date(Math.ceil(t / HOUR_MS) * HOUR_MS);
}

/** 그 날짜에 고를 수 있는 가장 이른 "부터" 시각(0~23). 없으면 null(오늘 저녁 8시 이후) */
export function firstSelectableHour(ymd: string, now: Date): number | null {
  const earliest = earliestPickup(now);
  for (let h = 0; h <= 23; h += 1) {
    if (atKstHour(ymd, h).getTime() >= earliest.getTime()) return h;
  }
  return null;
}

/** 픽업 시작 시각과 견적 마감 */
export function pickupWindow(
  ymd: string,
  hourFrom: number | null,
  now: Date,
): { start: Date; deadline: Date; shifted: boolean } | null {
  const earliest = earliestPickup(now);
  const dayStart = atKstHour(ymd, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * HOUR_MS);
  let start: Date;
  let shifted = false;
  if (hourFrom !== null) {
    start = atKstHour(ymd, hourFrom);
    if (start.getTime() < earliest.getTime()) return null;
  } else if (dayStart.getTime() >= earliest.getTime()) {
    start = dayStart;
  } else {
    start = earliest;
    shifted = true;
  }
  if (start.getTime() >= dayEnd.getTime()) return null;
  return { start, deadline: new Date(start.getTime() - HOUR_MS), shifted };
}

/** 0~24시를 "오전 9시"·"오후 2시"·"밤 11시"처럼 */
export function formatHour(hour: number): string {
  const h = hour % 24;
  if (h === 0) return "밤 12시";
  if (h <= 5) return `새벽 ${h}시`;
  if (h <= 11) return `오전 ${h}시`;
  if (h === 12) return "낮 12시";
  if (h <= 20) return `오후 ${h - 12}시`;
  return `밤 ${h - 12}시`;
}

/** "오후 2시 ~ 5시", 오전·오후가 다르면 "오전 11시 ~ 오후 2시" */
export function formatHourRange(from: number, to: number): string {
  const a = formatHour(from);
  const b = formatHour(to);
  return a.split(" ")[0] === b.split(" ")[0] ? `${a} ~ ${b.split(" ")[1]}` : `${a} ~ ${b}`;
}

/** "23일(수) 밤 11시" (다른 달이면 "1월 3일(일) 밤 11시"), 한국 시간 */
export function formatDeadline(deadline: Date, now: Date): string {
  const d = kstParts(deadline);
  const n = kstParts(now);
  const day = `${d.day}일(${WEEKDAYS[d.weekday]})`;
  const sameMonth = d.year === n.year && d.month === n.month;
  return `${sameMonth ? day : `${d.month}월 ${day}`} ${formatHour(d.hour)}`;
}

/** "12/24(목)" */
export function formatShortDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${m}/${d}(${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]})`;
}
