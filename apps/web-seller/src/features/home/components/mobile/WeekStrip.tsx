/**
 * 홈 주간 달력 (SC-70 ③, 디자인 1-A): 이번 주 일~토, 날짜 아래 점 = 그날 픽업 수(3개까지).
 * 고른 날은 주황 동그라미, 오늘은 고르지 않았을 때도 주황 글씨로. 옆으로 밀면 지난주·다음 주(제안).
 */
import { useRef } from "react";
import { cx } from "@/apps/web-seller/common/ui/cx";
import {
  addDaysToKey,
  dayOfKey,
  formatKeyMonthDayWeek,
  weekdayLabel,
} from "@/apps/web-seller/common/utils/kst-date.util";

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
  countsByDay: Record<string, number>;
  onSelect: (key: string) => void;
  /** -1 지난주, +1 다음 주 */
  onChangeWeek: (delta: -1 | 1) => void;
}) {
  const touch = useRef<{ x: number; y: number } | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStartKey, i));
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
        const count = countsByDay[key] ?? 0;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected}
            aria-label={`${formatKeyMonthDayWeek(key)}${today ? " 오늘" : ""}, 픽업 ${count}건`}
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
            <span aria-hidden="true" className="flex h-1.5 gap-1">
              {Array.from({ length: Math.min(count, 3) }, (_, d) => (
                <span key={d} className="size-[5px] rounded-full bg-brand" />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
