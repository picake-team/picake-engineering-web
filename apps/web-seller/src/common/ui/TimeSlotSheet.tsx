/**
 * 30분 간격 시각 고르기 창 (SC-80·81). 휴대폰 기본 시간 고르기는 30분 단위를 지키지 못해 쓰지 않는다(C 점검).
 */
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { OptionRow, useScrollSelectedIntoView } from "@/apps/web-seller/common/ui/OptionSheet";
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
  const listRef = useScrollSelectedIntoView(open, value);
  return (
    <BottomSheet open={open} onClose={onClose} showClose title={title}>
      <div ref={listRef} role="radiogroup" aria-label={title} className="-mt-2 flex flex-col">
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
