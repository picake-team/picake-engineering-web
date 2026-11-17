/**
 * 30분 간격 시각 고르기 창 (SC-80·81). 휴대폰 기본 시간 고르기는 30분 단위를 지키지 못해 쓰지 않는다(C 점검).
 * emptyLabel을 주면 맨 위에 "시간 미정" 줄(고르면 "")이 생기고, 비어 있을 때는 낮(11:00) 근처를 보여 준다(주문 적기, I-42).
 */
import { useEffect } from "react";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { OptionRow, useScrollSelectedIntoView } from "@/apps/web-seller/common/ui/OptionSheet";
import { buildHalfHourTimeOptions } from "@/apps/web-seller/features/store/utils/store-calendar.util";

const SLOTS = buildHalfHourTimeOptions();
const EMPTY_SCROLL_TO = "11:00";

export function TimeSlotSheet({
  open,
  title,
  value,
  onPick,
  onClose,
  emptyLabel,
}: {
  open: boolean;
  title: string;
  value: string;
  onPick: (time: string) => void;
  onClose: () => void;
  /** 고르지 않음 줄(예: "시간 미정") */
  emptyLabel?: string;
}) {
  const listRef = useScrollSelectedIntoView(open, value);
  // 비어 있으면 "시간 미정"이 골라진 맨 위 대신 낮 시각을 가운데에
  useEffect(() => {
    if (!open || !emptyLabel || value) return;
    const id = window.setTimeout(() => {
      Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="radio"]') ?? [])
        .find((row) => row.textContent?.trim() === EMPTY_SCROLL_TO)
        ?.scrollIntoView({ block: "center" });
    }, 60);
    return () => window.clearTimeout(id);
  }, [open, emptyLabel, value, listRef]);
  return (
    <BottomSheet open={open} onClose={onClose} showClose title={title}>
      <div ref={listRef} role="radiogroup" aria-label={title} className="-mt-2 flex flex-col">
        {emptyLabel ? (
          <OptionRow
            selected={value === ""}
            onClick={() => {
              onPick("");
              onClose();
            }}
          >
            {emptyLabel}
          </OptionRow>
        ) : null}
        {SLOTS.map((t) => (
          <OptionRow
            key={t}
            selected={t === value}
            onClick={() => {
              onPick(t);
              onClose();
            }}
          >
            {t}
          </OptionRow>
        ))}
      </div>
    </BottomSheet>
  );
}

/** 시각 칸(52): 누르면 30분 간격 창을 연다 */
export function TimeBox({
  label,
  value,
  onClick,
  invalid = false,
}: {
  label: string;
  value: string;
  onClick: () => void;
  /** 고친 게 맞지 않을 때 다른 칸처럼 주황 1.5 테두리 */
  invalid?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={`${label} ${value}`}
      aria-invalid={invalid || undefined}
      onClick={onClick}
      className={cx(
        // 다른 고르는 칸(PickerButton·SheetSelect)과 같은 48 · 15 보통 글씨
        "flex h-12 min-w-0 flex-1 items-center justify-between rounded-control bg-white px-4 text-body tabular-nums text-ink-900 active:bg-ink-50",
        invalid ? "border-[1.5px] border-brand" : "border border-ink-200",
      )}
    >
      {value}
      <span className="text-ink-600">
        <Icon name="chevronDown" size={18} strokeWidth={2} />
      </span>
    </button>
  );
}
