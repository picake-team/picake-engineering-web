/**
 * 몇 개 중 하나 고르기: 칸(SheetSelect)을 누르면 아래에서 목록 창(OptionSheet)이 올라온다.
 * 휴대폰 기본 고르기 창(select)·PC 펼침 목록 대신 쓰는 앱 모양. 고른 줄은 굵게 + 오른쪽 주황 체크.
 */
import React, { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { PickerButton } from "@/apps/web-seller/common/ui/Field";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";

export interface SheetOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

/** 목록 한 줄(44 이상). OptionSheet와 틀 안 Select가 같이 쓴다 */
export function OptionRow({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "flex min-h-12 w-full items-center justify-between gap-3 border-b border-ink-100 text-left font-app text-body tabular-nums text-ink-900 active:bg-ink-50 disabled:text-ink-400",
        selected && "font-bold",
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {selected ? (
        <span className="shrink-0 text-brand">
          <Icon name="check" size={20} strokeWidth={2.4} />
        </span>
      ) : null}
    </button>
  );
}

/** 목록이 길면 고른 줄이 가운데 보이게 */
export function useScrollSelectedIntoView(open: boolean, key: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      ref.current
        ?.querySelector<HTMLElement>('[aria-checked="true"]')
        ?.scrollIntoView({ block: "center" });
    }, 50);
    return () => window.clearTimeout(id);
  }, [open, key]);
  return ref;
}

export function OptionSheet({
  open,
  title,
  options,
  value,
  onPick,
  onClose,
}: {
  open: boolean;
  title: string;
  options: readonly SheetOption[];
  value: string | undefined;
  onPick: (value: string) => void;
  onClose: () => void;
}) {
  const listRef = useScrollSelectedIntoView(open, value);
  return (
    <BottomSheet open={open} onClose={onClose} showClose title={title}>
      <div ref={listRef} role="radiogroup" aria-label={title} className="-mt-2 flex flex-col">
        {options.map((o) => (
          <OptionRow
            key={o.value}
            selected={o.value === value}
            disabled={o.disabled}
            onClick={() => {
              onPick(o.value);
              onClose();
            }}
          >
            {o.label}
          </OptionRow>
        ))}
      </div>
    </BottomSheet>
  );
}

/** 고르는 칸(48) + 목록 창 */
export function SheetSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "골라 주세요",
  disabled,
  invalid,
  className,
}: {
  /** 창 제목·읽어 주는 이름 */
  label: string;
  value: string | undefined;
  options: readonly SheetOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <PickerButton
        aria-label={label}
        aria-haspopup="dialog"
        value={current?.label}
        placeholder={placeholder}
        disabled={disabled}
        invalid={invalid}
        className={className}
        onClick={() => setOpen(true)}
      />
      <OptionSheet
        open={open}
        title={label}
        options={options}
        value={value}
        onPick={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
