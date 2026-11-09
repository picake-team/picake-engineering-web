import { QUOTE_LIMITS } from "@/apps/web-user/features/quote/constants/quote.constant";

/**
 * 요청서의 시간 규칙(기획 I-46 SC-14 4·5, 서버 resolvePickupWindow와 같음).
 * 손님 기기의 시계를 한국 시간으로 보고 계산한다(서버가 보낼 때 다시 확인한다).
 */
const HOUR_MS = 60 * 60 * 1000;

/** YYYY-MM-DD (기기 시간 기준 날짜) */
export function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function atHour(ymd: string, hour: number): Date {
  const d = fromYmd(ymd);
  d.setHours(hour, 0, 0, 0);
  return d;
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
    if (atHour(ymd, h).getTime() >= earliest.getTime()) return h;
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
  const dayStart = atHour(ymd, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * HOUR_MS);
  let start: Date;
  let shifted = false;
  if (hourFrom !== null) {
    start = atHour(ymd, hourFrom);
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

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** "23일(수) 밤 11시" (다른 달이면 "1월 3일(일) 밤 11시") */
export function formatDeadline(deadline: Date, now: Date): string {
  const day = `${deadline.getDate()}일(${WEEKDAYS[deadline.getDay()]})`;
  const sameMonth =
    deadline.getFullYear() === now.getFullYear() && deadline.getMonth() === now.getMonth();
  const date = sameMonth ? day : `${deadline.getMonth() + 1}월 ${day}`;
  return `${date} ${formatHour(deadline.getHours())}`;
}

/** "12/24(목)" */
export function formatShortDate(ymd: string): string {
  const d = fromYmd(ymd);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}
