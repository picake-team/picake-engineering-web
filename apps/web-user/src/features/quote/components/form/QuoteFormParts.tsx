"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/apps/web-user/common/components/icons";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { cn } from "@/apps/web-user/common/lib/utils";
import {
  QUOTE_DISTANCE_STOPS,
  type QuoteDistance,
} from "@/apps/web-user/features/quote/constants/quote.constant";
import { formatHour } from "@/apps/web-user/features/quote/utils/quote-time.util";

/**
 * 요청서 공통 모양(기획 I-46 "화면 모양"): 제목 20 굵게, 설명 14 회색,
 * 제목 아래 32, 항목 사이 24, 항목 이름과 칸 사이 10, 칸 아래 안내 6.
 */
export function StepTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-[32px]">
      <h1 className="text-xl font-bold leading-[27.5px] tracking-[-0.4px] text-gray-900">
        {title}
      </h1>
      {description && (
        <p className="mt-[4px] text-sm leading-[22.75px] text-gray-500">{description}</p>
      )}
    </div>
  );
}

export function Field({
  label,
  optional,
  right,
  children,
  caption,
}: {
  label: string;
  optional?: string;
  right?: ReactNode;
  children: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <section className="mb-[24px]">
      <div className="mb-[10px] flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">
          {label}
          {optional && (
            <span className="ml-[6px] text-xs font-normal text-gray-400">{optional}</span>
          )}
        </span>
        {right}
      </div>
      {children}
      {caption && <p className="mt-[6px] text-xs text-gray-500">{caption}</p>}
    </section>
  );
}

/** 회색 안내 상자(느낌표) — 손님 앱 InfoNotice와 같은 모양 */
export function NoticeBox({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "gray" | "blue";
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-[8px] rounded-xl px-[12px] py-[10px] text-xs leading-[18px]",
        tone === "blue" ? "bg-blue-50 text-gray-900" : "bg-gray-50 text-gray-700",
      )}
    >
      <Icon
        name="warning"
        width={16}
        height={16}
        className={cn("mt-[1px] shrink-0", tone === "blue" ? "text-blue-400" : "text-gray-400")}
      />
      <span>{children}</span>
    </p>
  );
}

/** 고르는 둥근 칸(검색 "정렬 및 필터"의 칸, 고르면 연한 주황) */
export function Pill({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex h-[36px] items-center justify-center rounded-full border px-[14px] text-sm",
        selected
          ? "border-primary-100 bg-primary-50 font-bold text-primary"
          : "border-gray-100 bg-white text-gray-700",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** 개수 −/+ */
export function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const btn =
    "flex h-[36px] w-[36px] items-center justify-center rounded-full border border-gray-100 disabled:opacity-40";
  return (
    <div className="flex items-center gap-[12px]">
      <button
        type="button"
        aria-label="하나 빼기"
        className={btn}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Icon name="minus" width={16} height={16} />
      </button>
      <span className="w-[28px] text-center text-base font-bold text-gray-900">{value}</span>
      <button
        type="button"
        aria-label="하나 더하기"
        className={btn}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Icon name="plus" width={16} height={16} />
      </button>
    </div>
  );
}

const WHEEL_ROW = 44;

/** 위아래로 돌려 고르는 시간 휠(가운데 줄이 고른 값) */
function HourWheel({
  hours,
  value,
  onChange,
  label,
}: {
  hours: number[];
  value: number;
  onChange: (hour: number) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const index = Math.max(0, hours.indexOf(value));
    ref.current?.scrollTo({ top: index * WHEEL_ROW });
    // 고를 수 있는 시각 목록이 바뀔 때만 맞춘다
  }, [hours.join(",")]);

  const onScroll = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const index = Math.min(hours.length - 1, Math.max(0, Math.round(el.scrollTop / WHEEL_ROW)));
      el.scrollTo({ top: index * WHEEL_ROW, behavior: "smooth" });
      if (hours[index] !== value) onChange(hours[index]);
    }, 80);
  };

  return (
    <div className="flex flex-1 flex-col items-center">
      <span className="mb-[8px] text-xs text-gray-500">{label}</span>
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-x-0 top-[44px] h-[44px] rounded-lg bg-gray-50" />
        <div
          ref={ref}
          onScroll={onScroll}
          role="listbox"
          aria-label={label}
          data-no-sheet-drag
          className="relative h-[132px] snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div style={{ height: WHEEL_ROW }} />
          {hours.map((h) => (
            <button
              type="button"
              key={h}
              role="option"
              aria-selected={h === value}
              onClick={() => {
                ref.current?.scrollTo({ top: hours.indexOf(h) * WHEEL_ROW, behavior: "smooth" });
                onChange(h);
              }}
              className={cn(
                "flex w-full snap-center items-center justify-center text-base",
                h === value ? "font-bold text-gray-900" : "text-gray-400",
              )}
              style={{ height: WHEEL_ROW }}
            >
              {formatHour(h)}
            </button>
          ))}
          <div style={{ height: WHEEL_ROW }} />
        </div>
      </div>
    </div>
  );
}

/** "몇 시에 받을 수 있어요?" 창: 부터~까지를 돌려 고른다 */
export function HourRangeSheet({
  isOpen,
  onClose,
  firstHour,
  from,
  to,
  onChange,
  onConfirm,
  onClear,
}: {
  isOpen: boolean;
  onClose: () => void;
  firstHour: number;
  from: number;
  to: number;
  onChange: (from: number, to: number) => void;
  onConfirm: () => void;
  onClear: () => void;
}) {
  const fromHours = Array.from({ length: 24 - firstHour }, (_, i) => firstHour + i);
  const toHours = Array.from({ length: 24 - from }, (_, i) => from + 1 + i);

  const short = (h: number) => formatHour(h).split(" ")[1];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="몇 시에 받을 수 있어요?"
      footer={
        <div className="flex gap-2 px-5 py-3">
          <Button variant="outline" size="lg" className="flex-1" onClick={onClear}>
            상관없어요
          </Button>
          <Button size="lg" className="flex-[2]" onClick={onConfirm}>
            {short(from)} ~ {short(to)}로 정하기
          </Button>
        </div>
      }
    >
      <div className="px-[20px] pb-[16px] pt-[8px]">
        <div className="flex items-center gap-[12px]">
          <HourWheel
            label="부터"
            hours={fromHours}
            value={from}
            onChange={(h) => onChange(h, Math.max(to, h + 1))}
          />
          <span className="mt-[20px] text-gray-400">~</span>
          <HourWheel label="까지" hours={toHours} value={to} onChange={(h) => onChange(from, h)} />
        </div>
      </div>
    </BottomSheet>
  );
}

/** 거리 막대: 가격 막대를 한 손잡이로(1·2·3·4·5·10·20km·시도) */
export function DistanceSlider({
  value,
  sidoLabel,
  onChange,
}: {
  value: QuoteDistance;
  sidoLabel: string;
  onChange: (value: QuoteDistance) => void;
}) {
  const stops = QUOTE_DISTANCE_STOPS;
  const index = stops.indexOf(value);
  const percent = (index / (stops.length - 1)) * 100;
  return (
    <div className="pt-[8px]">
      <div className="relative h-[24px]">
        <div className="absolute left-0 right-0 top-[10px] h-[4px] rounded-full bg-gray-50" />
        <div
          className="absolute left-0 top-[10px] h-[4px] rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={0}
          max={stops.length - 1}
          step={1}
          value={index}
          aria-label="거리"
          aria-valuetext={value === "SIDO" ? `${sidoLabel} 전체` : `${value}km`}
          onChange={(e) => onChange(stops[Number(e.target.value)])}
          className="absolute inset-0 h-[24px] w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-[24px] [&::-moz-range-thumb]:w-[24px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-gray-200 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-[24px] [&::-webkit-slider-thumb]:w-[24px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-200 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
        />
      </div>
      <div className="mt-[8px] flex justify-between text-2xs text-gray-400">
        {stops.map((s) => (
          <span key={String(s)} className={cn(s === value && "font-bold text-gray-900")}>
            {s === "SIDO" ? sidoLabel : s === 20 ? "20km" : s}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 아래 고정 버튼 자리 */
export function FixedFooter({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 mx-auto max-w-[638px] bg-white px-[20px] pb-[12px] pt-[10px]">
      {children}
    </div>
  );
}

/**
 * 사진 보고 채운 칸 아래 표시. 위 안내(NoticeBox)와 같은 회색 상자에 ✦만 주황(운영자 11-14 E).
 * 손님이 칸을 고치면 부르는 쪽에서 감춘다
 */
export function FillNote({
  children,
  sub,
  action,
}: {
  children: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mt-[8px] flex items-start gap-[8px] rounded-xl bg-gray-50 px-[12px] py-[10px] text-xs leading-[18px] text-gray-700">
      <span aria-hidden className="w-[16px] shrink-0 text-center text-primary">
        ✦
      </span>
      <div className="min-w-0 flex-1">
        <p>{children}</p>
        {sub && <p className="text-gray-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
