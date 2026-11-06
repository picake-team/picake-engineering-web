/**
 * 칸과 상태 화면 (디자인 기준 B-3).
 * - 카드: 모서리 16 + 얇은 테두리, 아래 가득 찬 버튼
 * - 사진 칸: 정사각형만(주문 카드 48, 주문 항목 64, 참고 사진 88, 처리 창 주문 줄 44)
 * - 단계 막대(주문 상세): 지금 단계 11/700 진한 + 연한 주황 테두리, 지난 11/400 #686864, 다음 11/400 #767672
 * - 빈 화면 · 불러오는 중 · 주의 안내(주황 테두리, 모서리 16)
 */
import React from "react";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { Icon, type IconName } from "@/apps/web-seller/common/ui/icons";
import { Button } from "@/apps/web-seller/common/ui/Button";

export function Card({
  children,
  className,
  footer,
}: {
  children: React.ReactNode;
  className?: string;
  /** 카드 아래 가득 찬 버튼(모서리 없이 카드 안에) */
  footer?: React.ReactNode;
}) {
  return (
    <div className={cx("overflow-hidden rounded-card border border-ink-100 bg-white", className)}>
      {children}
      {footer}
    </div>
  );
}

/** 카드 아래 가득 찬 주 버튼(52) */
export function CardFooterButton({
  children,
  onClick,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "flex h-13 w-full items-center justify-center gap-2 bg-brand font-app text-body font-bold text-white disabled:cursor-not-allowed",
        disabled && !loading ? "opacity-40" : "active:brightness-95",
      )}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="inline-block size-[18px] animate-spin rounded-full border-[2.5px] border-white/45 border-t-white"
          />
          처리 중
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** 정사각형 사진 칸. 사진이 없으면 회색 칸 + 케이크 모양 */
export function Thumb({
  src,
  size,
  alt = "",
  className,
}: {
  src?: string | null;
  size: 44 | 48 | 64 | 88;
  alt?: string;
  className?: string;
}) {
  const box = { 44: "size-11", 48: "size-12", 64: "size-16", 88: "size-[88px]" }[size];
  const iconSize = { 44: 18, 48: 20, 64: 27, 88: 30 }[size];
  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-control bg-ink-50 text-ink-400",
        box,
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : (
        <Icon name="cake" size={iconSize} strokeWidth={1.6} />
      )}
    </span>
  );
}

export interface StepItem {
  label: string;
}

/**
 * 주문 상세 단계 막대. filledThrough까지 주황으로 칠하고, current가 있으면 그 단계를 굵게 + 연한 주황 테두리.
 * 정상 단계 밖 상태(취소·환불·노쇼)는 current 없이 지나온 단계까지만 칠한다.
 */
export function StepBar({
  steps,
  current = null,
  filledThrough,
}: {
  steps: StepItem[];
  current?: number | null;
  filledThrough: number;
}) {
  return (
    <ol className="flex items-start font-app" aria-label="주문 단계">
      {steps.map((s, i) => {
        const filled = i <= filledThrough;
        const now = i === current;
        const last = i === steps.length - 1;
        return (
          <li
            key={s.label}
            aria-current={now ? "step" : undefined}
            className="relative flex flex-1 flex-col items-center gap-2"
          >
            <span
              className={cx(
                "relative z-[1] mt-1 size-3 rounded-full",
                filled ? "bg-brand" : "bg-ink-200",
                now && "shadow-[0_0_0_4px_#FFEFEB]",
              )}
            />
            <span
              className={cx(
                "whitespace-nowrap text-tab",
                now ? "font-bold text-ink-900" : filled ? "text-ink-600" : "text-ink-500",
              )}
            >
              {s.label}
            </span>
            {!last ? (
              <span
                aria-hidden="true"
                className={cx(
                  "absolute left-1/2 top-[7px] h-0.5 w-full",
                  i < filledThrough ? "bg-brand" : "bg-ink-100",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** 빈 화면 · 불러오지 못함 · 인터넷 끊김 */
export function EmptyState({
  icon = "cake",
  title,
  description,
  action,
  className,
  big = false,
}: {
  icon?: IconName;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 44 흰 보조 버튼 등 */
  action?: React.ReactNode;
  className?: string;
  /** 화면 하나를 다 쓰는 빈 화면(72 아이콘 칸) */
  big?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center gap-2 py-3 text-center font-app",
        big && "flex-1 justify-center gap-3 pb-16",
        className,
      )}
    >
      <span
        className={cx(
          "flex items-center justify-center rounded-card bg-ink-50 text-ink-600",
          big ? "size-[72px]" : "size-16",
        )}
      >
        <Icon name={icon} size={big ? 34 : 27} strokeWidth={icon === "cake" ? 1.6 : 1.7} />
      </span>
      <p className={cx("text-group font-bold text-ink-900", big && "mt-1")}>{title}</p>
      {description ? <p className="text-caption text-ink-600">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** 불러오지 못했을 때(다시 시도) */
export function LoadErrorState({
  onRetry,
  title = "불러오지 못했어요",
  big = false,
}: {
  onRetry: () => void;
  title?: React.ReactNode;
  big?: boolean;
}) {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  return (
    <EmptyState
      big={big}
      icon={offline ? "offline" : "retry"}
      title={offline ? "인터넷 연결을 확인해 주세요" : title}
      description={offline ? "연결되면 다시 불러올게요" : "잠시 뒤 다시 시도해 주세요"}
      action={
        <Button variant="secondary" size="md" onClick={onRetry}>
          다시 시도
        </Button>
      }
    />
  );
}

/** 불러오는 중: 카드 모양 회색 칸 */
export function SkeletonCards({ count = 3, thumb = true }: { count?: number; thumb?: boolean }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-card border border-ink-100 p-4">
          {thumb ? (
            <span className="size-12 shrink-0 animate-pulse rounded-control bg-ink-50" />
          ) : null}
          <span className="flex flex-1 flex-col gap-2">
            <span className="block h-3.5 w-[70%] animate-pulse rounded-check bg-ink-50" />
            <span className="block h-3.5 w-1/2 animate-pulse rounded-check bg-ink-50" />
            <span className="block h-3 w-2/5 animate-pulse rounded-check bg-ink-50" />
          </span>
        </div>
      ))}
    </div>
  );
}

/** 주의 안내: 주황 테두리 칸(모서리 16), 글씨 14/400 */
export function WarningBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="note"
      className={cx(
        "flex gap-2 rounded-card border-[1.5px] border-brand px-4 py-3 font-app text-sub text-ink-900",
        className,
      )}
    >
      <span className="mt-0.5 shrink-0 text-brand">
        <Icon name="warning" size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
