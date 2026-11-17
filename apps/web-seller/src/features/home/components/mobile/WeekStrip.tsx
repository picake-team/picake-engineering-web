/**
 * 홈 주간 달력 (SC-70 ③, 디자인 1-A): 이번 주 일~토, 날짜 아래 그날 픽업 = 점(3건까지, Picake 주황·직접 적은 주문 회색)
 * 또는 4건부터 숫자, 그 아래 대목 이름(기획 I-42). 고른 날은 주황 동그라미, 오늘은 고르지 않았을 때도 주황 글씨로.
 * 옆으로 밀면 지난주·다음 주(제안).
 */
import { useRef } from "react";
import { cx } from "@/apps/web-seller/common/ui/cx";
import {
  addDaysToKey,
  dayOfKey,
  formatKeyMonthDayWeek,
  weekdayLabel,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { cakeDayOf } from "@/apps/web-seller/common/utils/cake-days.util";
import { DayMarks, DayTag, type DayPickupCount } from "@/apps/web-seller/common/ui/DayMarks";

const SWIPE_PX = 48;

export function WeekStrip({
  weekStartKey,
  selectedKey,
  todayKey,
  countsByDay,
  onSelect,
  onChangeWeek,
}: {
  /** 그 주 일요일 */
  weekStartKey: string;
  selectedKey: string;
  todayKey: string;
  countsByDay: Record<string, DayPickupCount>;
  onSelect: (key: string) => void;
  /** -1 지난주, +1 다음 주 */
  onChangeWeek: (delta: -1 | 1) => void;
}) {
  const touch = useRef<{ x: number; y: number } | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStartKey, i));
  // 대목이 있는 주만 이름 줄을 둔다(다른 주는 달력이 길어지지 않게)
  const anyTag = days.some((key) => cakeDayOf(key));
  return (
    <div
      role="group"
      aria-label="주간 달력"
      className="grid touch-pan-y grid-cols-7 text-center"
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
          onChangeWeek(dx < 0 ? 1 : -1);
        }
      }}
    >
      {days.map((key, i) => {
        const selected = key === selectedKey;
        const today = key === todayKey;
        const count = countsByDay[key];
        const total = (count?.picake ?? 0) + (count?.manual ?? 0);
        const tag = cakeDayOf(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected}
            aria-label={`${formatKeyMonthDayWeek(key)}${today ? " 오늘" : ""}${
              tag ? `, ${tag.full}` : ""
            }, 픽업 ${total}건`}
            onClick={() => onSelect(key)}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-caption text-ink-600">{weekdayLabel(i)}</span>
            <span
              className={cx(
                "flex size-10 items-center justify-center rounded-full text-body font-bold tabular-nums",
                selected ? "bg-brand text-white" : today ? "text-brand-ink" : "text-ink-900",
              )}
            >
              {dayOfKey(key)}
            </span>
            <DayMarks count={count} className="-my-1" />
            {anyTag ? <DayTag label={tag?.short ?? null} /> : null}
          </button>
        );
      })}
    </div>
  );
}
