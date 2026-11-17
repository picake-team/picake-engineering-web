/**
 * 달력 날짜 아래 그날 픽업 표시(홈 이번 주·캘린더·날짜 고르기 창, 기획 I-42).
 * - 3건까지는 점: Picake 주문 주황, 직접 적은 주문 회색(Picake 먼저)
 * - 4건부터는 점 대신 숫자(점이 3개까지라 5건과 8건이 같아 보이던 것)
 * 높이는 늘 같아 점·숫자·빈칸이 섞여도 날짜가 들썩이지 않는다
 */
import { cx } from "@/apps/web-seller/common/ui/cx";
/** 그날 픽업 수: Picake 주문(주황 점)·직접 적은 주문(회색 점) */
export interface DayPickupCount {
  picake: number;
  manual: number;
}

const DAY_MARKS_NUMBER_FROM = 4;

export function DayMarks({ count, className }: { count?: DayPickupCount; className?: string }) {
  const picake = count?.picake ?? 0;
  const manual = count?.manual ?? 0;
  const total = picake + manual;
  return (
    <span
      aria-hidden="true"
      className={cx("flex h-[15px] items-center justify-center gap-1", className)}
    >
      {total >= DAY_MARKS_NUMBER_FROM ? (
        <span className="text-tab font-bold leading-none tabular-nums text-ink-900">{total}</span>
      ) : (
        [
          ...Array.from({ length: Math.min(picake, 3) }, () => "bg-brand"),
          ...Array.from({ length: Math.max(0, Math.min(manual, 3 - picake)) }, () => "bg-ink-400"),
        ].map((color, i) => <span key={i} className={cx("size-[5px] rounded-full", color)} />)
      )}
    </span>
  );
}

/** 대목 이름(날짜 아래 11 회색). 칸보다 길면 양옆으로 넘쳐도 자르지 않는다 */
export function DayTag({ label }: { label: string | null }) {
  return (
    <span
      aria-hidden="true"
      className="h-[15px] whitespace-nowrap text-tab leading-[15px] text-ink-600"
    >
      {label ?? ""}
    </span>
  );
}
