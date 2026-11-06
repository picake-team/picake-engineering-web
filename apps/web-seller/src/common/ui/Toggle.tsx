/**
 * 켜고 끄기 · 체크 · 하나 고르기 (디자인 기준 B-3).
 * 켜고 끄기는 바로 바뀌는 설정, 체크는 여러 개 동의·고르기, 동그라미는 하나만 고르기.
 */
import React from "react";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { Icon } from "@/apps/web-seller/common/ui/icons";

/** 켜고 끄기 48 × 28. 누르는 칸은 44 높이 */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** 화면 읽기 프로그램용 이름(줄 제목과 같게) */
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx("inline-flex h-11 shrink-0 items-center disabled:opacity-40", className)}
    >
      <span
        className={cx(
          "relative inline-block h-7 w-12 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-ink-200",
        )}
      >
        <span
          className={cx(
            "absolute top-[3px] size-[22px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left]",
            checked ? "left-[23px]" : "left-[3px]",
          )}
        />
      </span>
    </button>
  );
}

/** 체크 칸 22(모서리 6) + 글자. 줄 전체를 누를 수 있다 */
export function Checkbox({
  checked,
  onChange,
  children,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cx(
        "flex min-h-11 cursor-pointer items-center gap-3 font-app",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className={cx(
          "inline-flex size-[22px] shrink-0 items-center justify-center rounded-check peer-focus-visible:ring-2 peer-focus-visible:ring-ink-900 peer-focus-visible:ring-offset-2",
          checked ? "bg-brand text-white" : "border-[1.5px] border-ink-200 bg-white",
        )}
      >
        {checked ? <Icon name="check" size={14} strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1 text-body text-ink-900">{children}</span>
    </label>
  );
}

/** 동그라미 하나 고르기(22) + 글자 */
export function Radio({
  checked,
  onChange,
  name,
  value,
  children,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (value: string) => void;
  name: string;
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cx(
        "flex min-h-11 cursor-pointer items-center gap-3 font-app",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <input
        type="radio"
        className="peer sr-only"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
      />
      <span
        aria-hidden="true"
        className={cx(
          "inline-block size-[22px] shrink-0 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-ink-900 peer-focus-visible:ring-offset-2",
          checked ? "border-[7px] border-brand" : "border-[1.5px] border-ink-200",
        )}
      />
      <span className="min-w-0 flex-1 text-body text-ink-900">{children}</span>
    </label>
  );
}
