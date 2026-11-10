/**
 * 고르는 부품 (디자인 기준 B-3).
 * - SegmentedTabs: 위쪽 탭(회색 칸 안에서 고른 탭만 흰 칸 + 짙은 글씨 13/700, 안 고른 탭 13/400 #686864, 안쪽 3, 버튼 36).
 *   숫자는 동그라미: 사장님이 할 일(countAccent, 예: "처리할 것")은 주황, 나머지는 회색. 주황은 할 일이 있다는 뜻에만 쓴다.
 *   2026-11-06 "너무 다 회색" → 주황 칸·주황 채움, 2026-11-07 "너무 다 주황, 적절하게" → 지금 모양(운영자 의견)
 * - Chip: 거르기·정렬·분류처럼 여러 개(36, 둥근 끝). 고른 칩은 주황 채움 + 흰 글씨. 줄이 넘치면 다음 줄로,
 *   화면 맨 위 기간처럼 한 줄이어야 하면 ChipGroup scroll(한 줄, 넘치면 옆으로 밀기, 화면 끝까지)
 * - ChoiceGrid: 선택지가 2~7개로 정해진 것(40 네모 버튼, 쉬는 요일). 고른 것은 주황 채움
 */
import React, { useEffect, useRef } from "react";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { CountBubble } from "@/apps/web-seller/common/ui/Badge";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  /** 탭·칩 이름 뒤 숫자(예: "처리할 것 4") */
  count?: number;
  /** 위쪽 탭 숫자를 주황 동그라미로(사장님이 할 일이 있다는 뜻). 0이면 회색 */
  countAccent?: boolean;
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
            aria-label={withCount(o.label, o.count)}
            className={cx(
              "inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-[10px] px-1 font-app text-sub",
              selected
                ? "bg-white font-bold text-ink-900 shadow-[0_1px_3px_rgba(31,31,30,0.12)]"
                : "font-normal text-ink-600",
            )}
          >
            <span className="min-w-0 truncate">{o.label}</span>
            {o.count !== undefined ? (
              o.countAccent && o.count > 0 ? (
                <CountBubble count={o.count} className="shrink-0" />
              ) : (
                <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-ink-100 px-1 text-tab font-bold leading-none text-ink-700">
                  {o.count > 99 ? "99+" : o.count}
                </span>
              )
            ) : null}
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
        // 보이는 높이 36, 위아래 2씩 더해 누르는 칸 40
        "relative inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-4 font-app text-sub font-bold",
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
  scroll = false,
  className,
}: {
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  /** 한 줄에 두고 넘치면 옆으로 민다(좌우 여백 20을 넘어 화면 끝까지, 스크롤 막대 없음) */
  scroll?: boolean;
  className?: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  // 한 줄(scroll)일 때 고른 칩이 화면 밖이면 보이게 민다(처음 열 때 "직접 고르기"가 잘리지 않게)
  useEffect(() => {
    const row = rowRef.current;
    if (!scroll || !row) return;
    const chip = row.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!chip) return;
    const pad = 20;
    if (chip.offsetLeft + chip.offsetWidth + pad > row.scrollLeft + row.clientWidth) {
      row.scrollLeft = chip.offsetLeft + chip.offsetWidth + pad - row.clientWidth;
    } else if (chip.offsetLeft - pad < row.scrollLeft) {
      row.scrollLeft = Math.max(0, chip.offsetLeft - pad);
    }
  }, [scroll, value]);
  return (
    <div
      ref={rowRef}
      role="group"
      aria-label={label}
      className={cx(
        "relative flex gap-2",
        scroll
          ? "-mx-5 overflow-x-auto px-5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex-wrap",
        className,
      )}
    >
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
  large = false,
  className,
}: {
  options: ChoiceOption<T>[];
  /** 고른 값들 */
  selected: T[];
  onToggle: (value: T) => void;
  label: string;
  /** 한 줄에 놓을 개수(기본 = 선택지 수) */
  columns?: number;
  /** 요일처럼 한 글자는 16/700(디자인 4-D) */
  large?: boolean;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx("grid", large ? "gap-2" : "gap-1.5", className)}
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
              "h-10 min-w-0 truncate rounded-control px-1 font-app font-bold disabled:opacity-40",
              large ? "text-body" : "text-sub",
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
