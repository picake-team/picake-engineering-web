/**
 * 고르는 부품 (디자인 기준 B-3).
 * - SegmentedTabs: 위쪽 탭(회색 칸 안 흰 버튼, 안쪽 3, 버튼 40). 고른 탭 14/700 진한 글씨, 안 고른 탭 14/400 #686864
 * - Chip: 거르기·정렬처럼 여러 개(40, 둥근 끝). 줄이 넘치면 다음 줄로
 * - ChoiceGrid: 선택지가 2~7개로 정해진 것(44 네모 버튼, 쉬는 요일·이 날 영업). 고른 것은 주황 채움
 */
import React, { useRef } from "react";
import { cx } from "@/apps/web-seller/common/ui/cx";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  /** 탭·칩 이름 뒤 숫자(예: "처리할 것 4") */
  count?: number;
  disabled?: boolean;
}

function withCount(label: string, count?: number) {
  return count === undefined ? label : `${label} ${count.toLocaleString("ko-KR")}`;
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 화면 읽기 프로그램용 이름(예: "주문 묶음") */
  label: string;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, step: number) => {
    const n = options.length;
    for (let i = 1; i <= n; i += 1) {
      const next = (from + step * i + n) % n;
      if (!options[next].disabled) {
        refs.current[next]?.focus();
        onChange(options[next].value);
        return;
      }
    }
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx("grid rounded-control bg-ink-50 p-[3px]", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") move(i, 1);
              if (e.key === "ArrowLeft") move(i, -1);
            }}
            className={cx(
              "h-10 min-w-0 truncate rounded-[10px] px-1 font-app text-sub",
              selected
                ? "bg-white font-bold text-ink-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                : "font-normal text-ink-600",
            )}
          >
            {withCount(o.label, o.count)}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  selected,
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        // 보이는 높이 40, 위아래 2씩 더해 누르는 칸 44
        "relative inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full px-4 font-app text-sub font-bold",
        "before:absolute before:-inset-y-0.5 before:inset-x-0 before:content-['']",
        selected ? "bg-brand text-white" : "border border-ink-200 bg-white text-ink-700",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cx("flex flex-wrap gap-2", className)}>
      {options.map((o) => (
        <Chip
          key={o.value}
          selected={o.value === value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
        >
          {withCount(o.label, o.count)}
        </Chip>
      ))}
    </div>
  );
}

/** 네모 버튼 고르기. multiple이면 여러 개(쉬는 요일), 아니면 하나(정상영업·영업·휴무) */
export function ChoiceGrid<T extends string>({
  options,
  selected,
  onToggle,
  label,
  columns,
  className,
}: {
  options: ChoiceOption<T>[];
  /** 고른 값들 */
  selected: T[];
  onToggle: (value: T) => void;
  label: string;
  /** 한 줄에 놓을 개수(기본 = 선택지 수) */
  columns?: number;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx("grid gap-1.5", className)}
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={o.disabled}
            onClick={() => onToggle(o.value)}
            className={cx(
              "h-11 min-w-0 truncate rounded-control px-1 font-app text-sub font-bold disabled:opacity-40",
              on ? "bg-brand text-white" : "border border-ink-200 bg-white text-ink-900",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
