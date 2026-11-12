/**
 * 기간 고르기 창 (주문 통계 "직접 고르기", 주문 찾기의 픽업·주문 날짜). 휴대폰 기본 날짜 창 대신 앱 달력
 * (캘린더 탭과 같은 날짜 칸)으로 고른다. 여는 곳은 고르는 칸(PickerButton)이다.
 * - 시작일 → 종료일 순서로 누른다. 종료일까지 고르면 다시 누를 때 새로 시작한다. 시작일보다 앞을 누르면 그날이 시작일
 * - 고른 두 날은 주황 동그라미 + 흰 글씨, 사이는 회색 띠, 오늘은 주황 글씨
 * - max가 있으면(주문일·통계는 오늘) 그 뒤 날짜는 고를 수 없다(회색). 픽업 날짜처럼 앞날도 고르면 max를 넘기지 않는다
 * - 아래 버튼(기본 "이 기간 보기")은 종료일까지 골라야 누를 수 있다. 하루만 보려면 같은 날을 두 번 누른다
 */
import { useEffect, useState } from "react";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import {
  addDaysToKey,
  formatKeyMonthDayWeek,
  kstDateKey,
  monthEndKey,
  monthStartKey,
  shiftMonthKey,
  weekdayLabel,
  weekdayOfKey,
} from "@/apps/web-seller/common/utils/kst-date.util";

interface Draft {
  start: string | null;
  end: string | null;
}

export function DateRangeSheet({
  open,
  onClose,
  start,
  end,
  max,
  title = "기간 고르기",
  applyLabel = "이 기간 보기",
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  /** 지금 기간(창을 열 때 이 값으로 시작). 비어 있으면 처음부터 고른다 */
  start?: string;
  end?: string;
  /** 고를 수 있는 마지막 날(주문일·통계는 오늘). 없으면 앞날도 고를 수 있다 */
  max?: string;
  title?: string;
  applyLabel?: string;
  onApply: (start: string, end: string) => void;
}) {
  const [todayKey] = useState(() => kstDateKey(new Date()));
  const [draft, setDraft] = useState<Draft>({ start: start ?? null, end: end ?? null });
  const [month, setMonth] = useState(() => monthStartKey(end ?? start ?? todayKey));

  // 열 때마다 지금 기간으로 다시 시작
  useEffect(() => {
    if (!open) return;
    setDraft({ start: start ?? null, end: end ?? null });
    setMonth(monthStartKey(end ?? start ?? todayKey));
  }, [open, start, end, todayKey]);

  const pick = (key: string) =>
    setDraft((d) =>
      d.start !== null && d.end === null && key >= d.start
        ? { ...d, end: key }
        : { start: key, end: null },
    );

  const [y, m] = month.split("-").map(Number);
  const last = monthEndKey(month);
  const days: string[] = [];
  for (let k = month; k <= last; k = addDaysToKey(k, 1)) days.push(k);
  const canNext = max === undefined || shiftMonthKey(month, 1) <= max;

  const summary =
    draft.start === null
      ? "시작일과 종료일을 차례로 눌러 주세요"
      : draft.end === null
        ? `${formatKeyMonthDayWeek(draft.start)} ~ 끝나는 날을 눌러 주세요`
        : `${formatKeyMonthDayWeek(draft.start)} ~ ${formatKeyMonthDayWeek(draft.end)}`;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      showClose
      title={title}
      description={summary}
      footer={
        <Button
          block
          disabled={draft.start === null || draft.end === null}
          onClick={() => {
            if (draft.start !== null && draft.end !== null) onApply(draft.start, draft.end);
          }}
        >
          {applyLabel}
        </Button>
      }
    >
      <div className="flex flex-col gap-2 font-app">
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
              disabled={!canNext}
              onClick={() => setMonth(shiftMonthKey(month, 1))}
              className="inline-flex size-11 items-center justify-center rounded-full text-ink-900 active:bg-ink-50 disabled:text-ink-400"
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
        <div className="grid grid-cols-7 gap-y-1" role="grid" aria-label={`${y}년 ${m}월 달력`}>
          {Array.from({ length: weekdayOfKey(month) }, (_, i) => (
            <span key={`blank-${i}`} aria-hidden="true" />
          ))}
          {days.map((key) => {
            const isStart = key === draft.start;
            const isEnd = key === draft.end;
            const edge = isStart || isEnd;
            const between =
              draft.start !== null && draft.end !== null && key > draft.start && key < draft.end;
            const hasRange = draft.end !== null && draft.end !== draft.start;
            const disabled = max !== undefined && key > max;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                aria-pressed={edge}
                aria-label={`${formatKeyMonthDayWeek(key)}${key === todayKey ? " 오늘" : ""}${
                  isStart ? ", 시작일" : ""
                }${isEnd ? ", 종료일" : ""}`}
                onClick={() => pick(key)}
                className="relative flex h-10 items-center justify-center disabled:cursor-not-allowed"
              >
                {/* 고른 기간 회색 띠: 사이는 가득, 시작일은 오른쪽 반, 종료일은 왼쪽 반 */}
                {between || (hasRange && edge) ? (
                  <span
                    aria-hidden="true"
                    className={cx(
                      "absolute inset-y-0.5 bg-ink-50",
                      between && "inset-x-0",
                      hasRange && isStart && "left-1/2 right-0",
                      hasRange && isEnd && "left-0 right-1/2",
                    )}
                  />
                ) : null}
                <span
                  className={cx(
                    "relative flex size-9 items-center justify-center rounded-full text-body tabular-nums",
                    edge
                      ? "bg-brand font-bold text-white"
                      : disabled
                        ? "text-ink-400"
                        : key === todayKey
                          ? "font-bold text-brand-ink"
                          : "text-ink-900",
                  )}
                >
                  {Number(key.slice(8))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}
