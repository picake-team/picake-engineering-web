/**
 * 날짜 하나 고르기 창(주문 적기 "픽업 날짜", 기획 I-42). 기간 고르기 창(DateRangeSheet)과 같은 달력 칸.
 * - 날짜를 누르면 바로 골라지고 닫힌다(아래 버튼 없음)
 * - 날짜 아래에 그날 이미 받은 수(회색 숫자)·"휴무", 그 아래 대목 이름(dayInfo가 주면)
 * - 고른 날은 주황 동그라미 + 흰 글씨, 오늘은 주황 글씨. 휴무여도 고를 수 있다(사장님이 받은 주문을 적는 곳이라)
 */
import { useEffect, useState } from "react";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import {
  addDaysToKey,
  formatKeyMonthDayWeek,
  monthEndKey,
  monthStartKey,
  shiftMonthKey,
  weekdayLabel,
  weekdayOfKey,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { useKstTodayKey } from "@/apps/web-seller/common/hooks/useKstTodayKey";

export interface DateSheetDayInfo {
  /** 그날 이미 받은 수(0이면 비움) */
  count?: number;
  /** 쉬는 날 */
  closed?: boolean;
  /** 대목 등 짧은 이름 */
  tag?: string | null;
}

export function DateSheet({
  open,
  onClose,
  value,
  title,
  onPick,
  dayInfo,
  onMonthChange,
}: {
  open: boolean;
  onClose: () => void;
  /** 지금 고른 날(YYYY-MM-DD) */
  value: string;
  title: string;
  onPick: (key: string) => void;
  dayInfo?: (key: string) => DateSheetDayInfo;
  /** 보는 달이 바뀔 때(그달 받은 수를 불러오게) — 그달 1일 */
  onMonthChange?: (monthKey: string) => void;
}) {
  const todayKey = useKstTodayKey();
  const [month, setMonth] = useState(() => monthStartKey(value || todayKey));

  // 열 때마다 고른 날의 달로
  useEffect(() => {
    if (!open) return;
    setMonth(monthStartKey(value || todayKey));
  }, [open, value, todayKey]);

  useEffect(() => {
    if (open) onMonthChange?.(month);
  }, [open, month, onMonthChange]);

  const [y, m] = month.split("-").map(Number);
  const last = monthEndKey(month);
  const days: string[] = [];
  for (let k = month; k <= last; k = addDaysToKey(k, 1)) days.push(k);

  return (
    <BottomSheet open={open} onClose={onClose} showClose title={title}>
      <div className="flex flex-col gap-2 pb-2 font-app">
        <div className="flex items-center justify-between">
          <h3 className="text-group font-bold text-ink-900" aria-live="polite">
            {y}년 {m}월
          </h3>
          <div className="flex items-center">
            <button
              type="button"
              aria-label="지난달"
              onClick={() => setMonth(shiftMonthKey(month, -1))}
              className="inline-flex size-11 items-center justify-center rounded-full text-ink-900 active:bg-ink-50"
            >
              <Icon name="back" size={22} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              aria-label="다음 달"
              onClick={() => setMonth(shiftMonthKey(month, 1))}
              className="inline-flex size-11 items-center justify-center rounded-full text-ink-900 active:bg-ink-50"
            >
              <span className="rotate-180">
                <Icon name="back" size={22} strokeWidth={1.8} />
              </span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center text-caption text-ink-600" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i}>{weekdayLabel(i)}</span>
          ))}
        </div>
        <div className="grid grid-cols-7" role="grid" aria-label={`${y}년 ${m}월 달력`}>
          {Array.from({ length: weekdayOfKey(month) }, (_, i) => (
            <span key={`blank-${i}`} aria-hidden="true" />
          ))}
          {days.map((key) => {
            const info = dayInfo?.(key) ?? {};
            const selected = key === value;
            const count = info.count ?? 0;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                aria-label={`${formatKeyMonthDayWeek(key)}${key === todayKey ? " 오늘" : ""}${
                  info.tag ? `, ${info.tag}` : ""
                }${info.closed ? ", 휴무" : ""}, 받은 주문 ${count}건`}
                onClick={() => {
                  onPick(key);
                  onClose();
                }}
                className="flex flex-col items-center gap-0.5 py-1"
              >
                <span
                  className={cx(
                    "flex size-9 items-center justify-center rounded-full text-body tabular-nums",
                    selected
                      ? "bg-brand font-bold text-white"
                      : key === todayKey
                        ? "font-bold text-brand-ink"
                        : info.closed
                          ? "text-ink-500"
                          : "text-ink-900",
                  )}
                >
                  {Number(key.slice(8))}
                </span>
                <span
                  aria-hidden="true"
                  className="h-[15px] text-tab font-semibold leading-[15px] tabular-nums text-ink-600"
                >
                  {count > 0 ? count : info.closed ? "휴무" : ""}
                </span>
                {/* 대목이 있는 날만(그 주만 한 줄 높아진다) */}
                {info.tag ? (
                  <span
                    aria-hidden="true"
                    className="h-[15px] whitespace-nowrap text-tab leading-[15px] text-ink-600"
                  >
                    {info.tag}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}
