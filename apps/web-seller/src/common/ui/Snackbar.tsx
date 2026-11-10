/**
 * 스낵바: 한 일을 알리면서 바로 되돌릴 수 있게 버튼 하나를 둔 띠(예: "판매중지로 바꿨어요 · 되돌리기").
 * 화면 아래(아래 탭·저장 줄 위)에서 위로 올라오고(slide in, ease out), 나갈 때는 아래로 내려간다(ease in).
 * 짧은 안내·서버 오류·실시간 주문 알림은 위쪽 알림 배너(AlertBannerHost)를 쓴다(2026-11-11 운영자 결정: 토스트·스낵바·알림 배너 세 가지).
 * 화면에서는 `useSnackbarStore().showSnackbar(...)`로 띄우고 `SnackbarHost`가 그린다.
 *
 * 움직임 값은 공용 기초(packages/design-tokens `animate-snackbar-in|out`)에서 가져온다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { APP_COLUMN_CLASS } from "@/apps/web-seller/common/ui/Screen";
import { useSnackbarStore } from "@/apps/web-seller/common/store/snackbar.store";

/** 나갈 때 움직임 시간(motionDuration.base) */
const LEAVE_MS = 200;

export interface SnackbarProps {
  message: string;
  /** 버튼 글자(예: "되돌리기"). 누르면 onAction 뒤 닫힌다 */
  actionLabel?: string;
  onAction?: () => void;
  /** 닫힌 뒤(시간이 다 되거나 버튼을 누른 뒤) */
  onClose: () => void;
  /** 저절로 닫히기까지(ms). 되돌릴 시간을 주려고 토스트(6초)보다 짧지 않게 */
  duration?: number;
  /** 화면 아래에서 띄울 거리(아래 탭·저장 줄 높이). 기본은 아래 탭 위 */
  bottomOffset?: number;
}

export function Snackbar({
  message,
  actionLabel,
  onAction,
  onClose,
  duration = 6000,
  bottomOffset = 76,
}: SnackbarProps) {
  const [leaving, setLeaving] = useState(false);
  const closed = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const close = useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    setLeaving(true);
    window.setTimeout(() => onCloseRef.current(), LEAVE_MS);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(close, duration);
    return () => window.clearTimeout(t);
  }, [close, duration]);

  return (
    <div
      className={cx(APP_COLUMN_CLASS, "pointer-events-none fixed inset-x-0 z-[80] px-4 font-app")}
      style={{ bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))` }}
    >
      <div
        role="status"
        aria-live="polite"
        className={cx(
          "pointer-events-auto flex min-h-12 items-center gap-3 rounded-[8px] bg-ink-900 py-2 pl-4 pr-2 text-body text-white shadow-[0_6px_20px_rgba(31,31,30,0.24)]",
          leaving
            ? "animate-snackbar-out motion-reduce:animate-toast-out"
            : "animate-snackbar-in motion-reduce:animate-toast-in",
        )}
      >
        <span className="min-w-0 flex-1 break-keep [overflow-wrap:anywhere]">{message}</span>
        {actionLabel ? (
          <button
            type="button"
            onClick={() => {
              onAction?.();
              close();
            }}
            className="-my-1 inline-flex h-10 shrink-0 items-center rounded-[8px] px-3 text-body font-bold text-brand active:bg-white/10"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** 스낵바 저장소(`useSnackbarStore`)에 띄운 것을 그린다. 휴대폰 화면에서 한 번만 둔다(App) */
export function SnackbarHost() {
  const current = useSnackbarStore((s) => s.current);
  const hideSnackbar = useSnackbarStore((s) => s.hideSnackbar);
  if (!current) return null;
  return (
    <Snackbar
      key={current.id}
      message={current.message}
      actionLabel={current.actionLabel}
      onAction={current.onAction}
      duration={current.duration}
      onClose={() => hideSnackbar(current.id)}
    />
  );
}
