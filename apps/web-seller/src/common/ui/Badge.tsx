/**
 * 상태 배지 (디자인 기준 B-5 "추천 1": 누가 할 차례인지 + 알약, B-6: 안쪽 3·8, 12/700).
 * - turn(사장님 차례): 연한 주황 바탕 + 작은 주황 글씨
 * - wait(기다림): 회색 바탕 + #4E4E4B
 * - done(끝): 흰 바탕 + 얇은 테두리 + #686864
 */
import React from "react";
import { cx } from "@/apps/web-seller/common/ui/cx";

export type StatusTone = "turn" | "wait" | "done";

const TONE: Record<StatusTone, string> = {
  turn: "bg-brand-tint text-brand-ink",
  wait: "bg-ink-50 text-ink-700",
  done: "border border-ink-100 bg-white text-ink-600",
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-[3px] text-badge font-bold",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** 주황 숫자 동그라미(11/700 흰 글씨). 탭 칸·스토어 선택 등 */
export function CountBubble({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-tab font-bold leading-none text-white",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
