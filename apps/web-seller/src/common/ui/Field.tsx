/**
 * 입력 칸 (디자인 기준 B-2·B-3·B-6).
 * - 칸 이름 14/700 #4E4E4B, 칸 52 · 모서리 12 · 테두리 #D4D4D3, 글씨 16
 * - 입력 중: 진한 테두리 1.5 #1F1F1E / 고칠 곳: 주황 테두리 1.5 + 아래 문구 13/600 #B5401C
 * - 꺼진 칸: 회색 바탕 + #686864 글씨 / 예시 글씨 16 #767672 / 설명 13 #686864
 * - 입력 칸 바로 옆 버튼(재전송·검색 등)은 52 흰 보조 버튼(Button variant="secondary" size="lg")
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
  /** 칸 오른쪽에 붙는 52 버튼(재전송·검색) */
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
