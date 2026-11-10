/**
 * 입력 칸.
 * - 칸 이름 13/700 #4E4E4B, 칸 48 · 모서리 12 · 테두리 #D4D4D3, 글씨 15
 * - 입력 중: 진한 테두리 1.5 #1F1F1E / 고칠 곳: 주황 테두리 1.5 + 아래 문구 12/600 #B5401C
 * - 꺼진 칸: 회색 바탕 + #686864 글씨 / 예시 글씨 15 #767672 / 설명 12 #686864
 * - 입력 칸 바로 옆 버튼(재전송·검색 등)은 칸과 같은 48 흰 보조 버튼(Button variant="secondary" size="lg")
 * - 날짜·기간은 휴대폰 기본 고르기 창(input type="date")을 쓰지 않고 PickerButton + 앱 창(DateRangeSheet)으로 고른다
 */
import React, { useId } from "react";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { Icon } from "@/apps/web-seller/common/ui/icons";

interface FieldRenderProps {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
}

export function Field({
  label,
  helper,
  error,
  counter,
  trailing,
  className,
  children,
}: {
  /** 칸 이름. 짧은 입력 화면은 칸 이름만, 긴 입력 화면은 묶음 제목 안에 칸 이름 */
  label?: React.ReactNode;
  /** 설명 글 · 도움말 */
  helper?: React.ReactNode;
  /** 고칠 곳 문구. 있으면 칸 테두리가 주황 */
  error?: React.ReactNode;
  /** 글자 수 등 오른쪽 아래 숫자 */
  counter?: React.ReactNode;
  /** 칸 오른쪽에 붙는 48 버튼(재전송·검색) */
  trailing?: React.ReactNode;
  className?: string;
  children: (props: FieldRenderProps) => React.ReactNode;
}) {
  const id = useId();
  const helperId = `${id}-help`;
  const hasBelow = Boolean(error || helper || counter);
  return (
    <div className={cx("flex flex-col gap-2 font-app", className)}>
      {label ? (
        <label htmlFor={id} className="text-sub font-bold text-ink-700">
          {label}
        </label>
      ) : null}
      <div className={cx(trailing && "flex gap-2")}>
        <div className={cx(trailing && "min-w-0 flex-1")}>
          {children({ id, describedBy: hasBelow ? helperId : undefined, invalid: Boolean(error) })}
        </div>
        {trailing}
      </div>
      {hasBelow ? (
        <div id={helperId} className="flex items-start justify-between gap-3 text-caption">
          <span className={cx(error ? "font-semibold text-brand-ink" : "text-ink-600")}>
            {error ?? helper}
          </span>
          {counter ? <span className="shrink-0 tabular-nums text-ink-600">{counter}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

const BOX =
  "w-full rounded-control border bg-white font-app text-body text-ink-900 outline-none transition-colors placeholder:text-ink-500 disabled:bg-ink-50 disabled:text-ink-600";

/** 바꿀 수 없는 칸(readOnly)은 회색. select는 늘 :read-only라 입력 칸·여러 줄에만 붙인다 */
const READ_ONLY = "read-only:bg-ink-50 read-only:text-ink-600";

function stateClass(invalid: boolean) {
  return invalid
    ? "border-[1.5px] border-brand"
    : "border-ink-200 focus:border-[1.5px] focus:border-ink-900";
}

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function TextInput({ invalid = false, className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(BOX, READ_ONLY, "h-12 px-4", stateClass(invalid), className)}
      {...rest}
    />
  );
});

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function TextArea({ invalid = false, className, rows = 4, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cx(
        BOX,
        READ_ONLY,
        "min-h-24 resize-none px-4 py-3 leading-normal",
        stateClass(invalid),
        className,
      )}
      {...rest}
    />
  );
});

/** 고르는 칸: 휴대폰 기본 고르기 창으로 연다 */
export const SelectInput = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    invalid?: boolean;
    placeholder?: string;
  }
>(function SelectInput({ invalid = false, className, placeholder, children, value, ...rest }, ref) {
  const empty = value === "" || value === undefined;
  return (
    <div className="relative">
      <select
        ref={ref}
        value={value}
        aria-invalid={invalid || undefined}
        className={cx(
          BOX,
          "h-12 appearance-none pl-4 pr-11",
          stateClass(invalid),
          empty && "text-ink-500",
          className,
        )}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ink-600">
        <Icon name="chevronDown" size={18} strokeWidth={2} />
      </span>
    </div>
  );
});

/**
 * 앱 창(BottomSheet)으로 고르는 칸: 고르는 칸(SelectInput)과 같은 모양(48 · 모서리 12 · 회색 테두리 · 오른쪽 ▾).
 * 날짜·기간처럼 휴대폰 기본 고르기 창이 앱 디자인과 너무 다른 것은 이 칸을 누르면 앱 창을 연다(예: DateRangeSheet).
 */
export const PickerButton = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
    /** 고른 값. 비어 있으면 placeholder를 예시 글씨 색으로 */
    value?: React.ReactNode;
    placeholder?: string;
    invalid?: boolean;
  }
>(function PickerButton({ value, placeholder, invalid = false, className, ...rest }, ref) {
  const empty = value === undefined || value === null || value === "";
  return (
    <button
      ref={ref}
      type="button"
      aria-invalid={invalid || undefined}
      className={cx(
        BOX,
        "relative flex h-12 items-center pl-4 pr-11 text-left",
        // 창을 닫으면 초점이 이 칸으로 돌아오므로, 진한 테두리는 키보드로 옮겨 왔을 때만
        invalid
          ? "border-[1.5px] border-brand"
          : "border-ink-200 focus-visible:border-[1.5px] focus-visible:border-ink-900",
        empty && "text-ink-500",
        className,
      )}
      {...rest}
    >
      <span className="min-w-0 truncate">{empty ? placeholder : value}</span>
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ink-600">
        <Icon name="chevronDown" size={18} strokeWidth={2} />
      </span>
    </button>
  );
});

/** 검색 칸: 회색 채움 · 높이 40 · 테두리 없음. 옆 아이콘 버튼은 FieldIconButton(같은 높이·모양) */
export const SearchInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }
>(function SearchInput({ label, className, ...rest }, ref) {
  return (
    <label
      className={cx(
        "flex h-10 w-full items-center gap-2 rounded-control bg-ink-50 px-3.5 font-app text-ink-600 focus-within:ring-[1.5px] focus-within:ring-ink-900",
        className,
      )}
    >
      <Icon name="search" size={20} strokeWidth={1.8} />
      <input
        ref={ref}
        type="search"
        enterKeyHint="search"
        aria-label={label}
        className="h-full min-w-0 flex-1 bg-transparent text-body text-ink-900 outline-none placeholder:text-ink-500 [&::-webkit-search-cancel-button]:hidden"
        {...rest}
      />
    </label>
  );
});
