/**
 * 휴대폰 화면의 안내 띠(안내 · 처리 성공 / 되돌리기).
 * 흰 바탕 + 그림자, 모든 화면에서 같은 자리(화면 맨 위, 상태 표시줄 바로 아래)에 잠깐 보인다. 새 안내가 맨 위.
 * 저절로 사라지는 안내는 아래쪽 주황 막대가 남은 시간만큼 줄어들고, 누르고 있는 동안은 멈춘다.
 * 위로 밀면 바로 닫히고, 끝나면 위로 살짝 올라가며 흐려진다. 아이콘은 내용에 맞춘다(`toastIconFor`).
 *
 * PC 화면과 같은 알림 저장소(`useAlertStore`)를 읽어, 서버 오류·실시간 주문 알림·처리 결과가
 * 휴대폰 화면에서도 같은 곳에 뜬다. PC 화면에서는 기존 `Alert`가 그대로 그린다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ALERT_ERROR_TITLE,
  type AlertItem,
  useAlertStore,
} from "@/apps/web-seller/common/store/alert.store";
import { Icon, TaskIcon } from "@/apps/web-seller/common/ui/icons";
import { APP_COLUMN_CLASS } from "@/apps/web-seller/common/ui/Screen";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { toastIconFor } from "@/apps/web-seller/common/ui/toast-icon.util";

/** 한 번에 보이는 안내 수(새 안내에 밀린 것은 지운다) */
const MAX_VISIBLE = 2;
/** 사라질 때 흐려지는 시간 */
const LEAVE_MS = 220;
/** 위로 이만큼 밀면 닫는다 */
const SWIPE_CLOSE_PX = 24;
/** 남은 시간 막대: 밝은 주황에서 주 색으로 */
const PROGRESS_BG = "linear-gradient(90deg, #FF9442 0%, #FF653E 100%)";

export function ToastHost() {
  const alerts = useAlertStore((s) => s.alerts);
  const removeAlert = useAlertStore((s) => s.removeAlert);
  // 새 안내에 밀려 안 보이게 된 안내는 바로 지운다(나중에 다시 튀어나오지 않게)
  useEffect(() => {
    alerts.slice(0, -MAX_VISIBLE).forEach((a) => removeAlert(a.id));
  }, [alerts, removeAlert]);
  const visible = alerts.slice(-MAX_VISIBLE);
  if (visible.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className={cx(
        APP_COLUMN_CLASS,
        // 실제 앱 알림처럼 화면 맨 위(상태 표시줄 바로 아래). 제목 줄을 잠깐 덮지만 위로 밀면 닫힌다
        "pointer-events-none fixed inset-x-0 top-[calc(12px+env(safe-area-inset-top))] z-[60] flex flex-col-reverse gap-2 px-4 font-app",
      )}
    >
      {visible.map((a) => (
        <ToastItem key={a.id} alert={a} />
      ))}
    </div>
  );
}

function ToastItem({ alert: a }: { alert: AlertItem }) {
  const removeAlert = useAlertStore((s) => s.removeAlert);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const [dragY, setDragY] = useState(0);
  const duration = a.autoHideDuration ?? null;
  const remaining = useRef(duration ?? 0);
  const startedAt = useRef(0);
  const downY = useRef<number | null>(null);
  const swiped = useRef(false);

  const close = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => removeAlert(a.id), LEAVE_MS);
  }, [a.id, removeAlert]);

  // 남은 시간이 다 되면 닫는다. 누르고 있는 동안은 멈춘다(막대도 같이)
  useEffect(() => {
    if (!duration || paused || leaving) return;
    startedAt.current = Date.now();
    const t = window.setTimeout(close, remaining.current);
    return () => {
      window.clearTimeout(t);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
    };
  }, [duration, paused, leaving, close]);

  // 누르고 있으면 멈춤, 위로 밀면 닫기
  const gesture = {
    onPointerDown: (e: React.PointerEvent) => {
      // 띠 안의 작은 버튼(되돌리기·닫기)은 그대로 눌리게 둔다
      const inner = (e.target as HTMLElement).closest("button");
      if (inner && inner !== e.currentTarget) return;
      // 손가락이 띠 밖으로 나가도 떼는 순간까지 따라간다(안 그러면 멈춘 채 남는다)
      e.currentTarget.setPointerCapture?.(e.pointerId);
      downY.current = e.clientY;
      swiped.current = false;
      setPaused(true);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (downY.current === null) return;
      const dy = Math.min(0, e.clientY - downY.current);
      setDragY(dy);
      if (dy < -SWIPE_CLOSE_PX && !swiped.current) {
        swiped.current = true;
        close();
      }
    },
    onPointerUp: () => {
      downY.current = null;
      setDragY(0);
      setPaused(false);
    },
    onPointerCancel: () => {
      downY.current = null;
      setDragY(0);
      setPaused(false);
    },
  };

  const isProblem = a.severity === "error" || a.severity === "warning";
  const title = a.title && a.title !== ALERT_ERROR_TITLE ? a.title : null;
  const icon = toastIconFor(a);

  const iconEl = (
    <span className="inline-flex size-6 shrink-0 items-center justify-center text-brand">
      {icon.kind === "task" ? (
        <TaskIcon name={icon.name} active size={22} />
      ) : (
        <Icon name={icon.name} size={20} strokeWidth={2.2} />
      )}
    </span>
  );

  const body = (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      {title ? <span className="font-bold">{title}</span> : null}
      <span
        className={cx(
          "whitespace-pre-line break-keep [overflow-wrap:anywhere]",
          title && "text-sub text-ink-600",
        )}
      >
        {a.message}
      </span>
    </span>
  );

  const bar = duration ? (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 block h-[3px] origin-left"
      style={{
        background: PROGRESS_BG,
        animation: `toast-progress ${duration}ms linear forwards`,
        animationPlayState: paused ? "paused" : "running",
      }}
    />
  ) : null;

  const shell = cx(
    // 모서리는 카드(16)보다 각진 8(운영자 17차)
    "pointer-events-auto relative flex w-full touch-none items-center gap-3 overflow-hidden rounded-[8px] border border-ink-100 bg-white px-4 py-3.5 text-left text-body text-ink-900 shadow-[0_6px_20px_rgba(31,31,30,0.14)] transition-[opacity,transform] duration-200 ease-out animate-in fade-in-0 slide-in-from-top-2",
    leaving && "opacity-0",
  );
  const style = { transform: `translateY(${leaving ? -8 : dragY}px)` };

  if (a.onClick) {
    // 누르면 열리는 알림(새 예약 등): 안내 전체가 버튼 + 오른쪽 화살표(누르면 열리는 줄과 같은 표시)
    return (
      <button
        type="button"
        role="status"
        onClick={() => {
          if (swiped.current) return;
          a.onClick?.();
          removeAlert(a.id);
        }}
        {...gesture}
        style={style}
        className={cx(shell, "active:bg-ink-50")}
      >
        {iconEl}
        {body}
        <span className="shrink-0 text-ink-400">
          <Icon name="chevronRight" size={18} strokeWidth={2} />
        </span>
        {bar}
      </button>
    );
  }

  return (
    <div role={isProblem ? "alert" : "status"} {...gesture} style={style} className={shell}>
      {a.action ? null : iconEl}
      {body}
      {a.action ? (
        <button
          type="button"
          onClick={() => {
            a.action?.onClick();
            removeAlert(a.id);
          }}
          className="relative -my-1.5 inline-flex h-9 shrink-0 items-center rounded-full border border-ink-200 bg-white px-3 text-sub font-bold text-ink-900 before:absolute before:-inset-1 before:content-[''] active:bg-ink-50"
        >
          {a.action.label}
        </button>
      ) : duration === null ? (
        // 저절로 사라지지 않는 안내(겹친 예약 등)는 닫기
        <button
          type="button"
          aria-label="안내 닫기"
          onClick={close}
          className="-my-3 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-600 active:bg-ink-50"
        >
          <Icon name="close" size={18} strokeWidth={2} />
        </button>
      ) : null}
      {bar}
    </div>
  );
}
