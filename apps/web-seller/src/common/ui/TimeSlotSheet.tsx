/**
 * 30분 간격 시각 고르기 창 (SC-80·81). 휴대폰 기본 시간 고르기는 30분 단위를 지키지 못해 쓰지 않는다(C 점검).
 */
import { useEffect, useRef } from "react";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { buildHalfHourTimeOptions } from "@/apps/web-seller/features/store/utils/store-calendar.util";

const SLOTS = buildHalfHourTimeOptions();

export function TimeSlotSheet({
  open,
  title,
  value,
  onPick,
  onClose,
}: {
  open: boolean;
  title: string;
  value: string;
  onPick: (time: string) => void;
  onClose: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    // 고른 시각이 가운데 보이게
    const id = window.setTimeout(() => {
      listRef.current
        ?.querySelector<HTMLElement>('[aria-checked="true"]')
        ?.scrollIntoView({ block: "center" });
    }, 50);
    return () => window.clearTimeout(id);
  }, [open, value]);
  return (
    <BottomSheet open={open} onClose={onClose} showClose title={title}>
      <div ref={listRef} role="radiogroup" aria-label={title} className="-mt-2 flex flex-col">
        {SLOTS.map((t) => {
          const on = t === value;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                onPick(t);
                onClose();
              }}
              className={cx(
                "flex min-h-11 items-center justify-between border-b border-ink-100 text-left text-body tabular-nums active:bg-ink-50",
                on ? "font-bold text-ink-900" : "text-ink-900",
              )}
            >
              {t}
              {on ? (
                <span className="text-brand">
                  <Icon name="check" size={20} strokeWidth={2.4} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

/** 시각 칸(52): 누르면 30분 간격 창을 연다 */
export function TimeBox({
  label,
  value,
  onClick,
  large = false,
}: {
  label: string;
  value: string;
  onClick: () => void;
  /** 영업시간 화면은 18/700(디자인 4-D) */
  large?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={`${label} ${value}`}
      onClick={onClick}
      className={cx(
        "flex h-12 min-w-0 flex-1 items-center justify-between rounded-control border border-ink-200 bg-white px-4 tabular-nums text-ink-900 active:bg-ink-50",
        large ? "text-group font-bold" : "text-body",
      )}
    >
      {value}
      <span className="text-ink-600">
        <Icon name="chevronDown" size={18} strokeWidth={2} />
      </span>
    </button>
  );
}
