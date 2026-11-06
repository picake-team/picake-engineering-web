/**
 * 휴대폰 화면의 안내 띠 (디자인 기준 B-3 "안내 · 처리 성공 / 되돌리기").
 * 흰 바탕 + 그림자, 화면 아래쪽(아래 탭·버튼 띠 위)에 잠깐 보인다.
 *
 * PC 화면과 같은 알림 저장소(`useAlertStore`)를 읽어, 서버 오류·실시간 주문 알림·처리 결과가
 * 휴대폰 화면에서도 같은 곳에 뜬다. PC 화면에서는 기존 `Alert`가 그대로 그린다.
 */
import { useEffect } from "react";
import { ALERT_ERROR_TITLE, useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { APP_COLUMN_CLASS } from "@/apps/web-seller/common/ui/Screen";
import { cx } from "@/apps/web-seller/common/ui/cx";

/** 한 번에 보이는 안내 수(오래된 것부터 사라짐) */
const MAX_VISIBLE = 2;

export function ToastHost() {
  const alerts = useAlertStore((s) => s.alerts);
  const removeAlert = useAlertStore((s) => s.removeAlert);

  useEffect(() => {
    const timers = alerts
      .filter((a) => a.autoHideDuration)
      .map((a) => setTimeout(() => removeAlert(a.id), a.autoHideDuration ?? 0));
    return () => timers.forEach(clearTimeout);
  }, [alerts, removeAlert]);

  const visible = alerts.slice(-MAX_VISIBLE);
  if (visible.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className={cx(
        APP_COLUMN_CLASS,
        "pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[60] flex flex-col gap-2 px-5 font-app",
      )}
    >
      {visible.map((a) => {
        const isProblem = a.severity === "error" || a.severity === "warning";
        const title = a.title && a.title !== ALERT_ERROR_TITLE ? a.title : null;
        return (
          <div
            key={a.id}
            role={isProblem ? "alert" : "status"}
            className="pointer-events-auto flex items-start gap-2 rounded-card border border-ink-100 bg-white p-4 text-body text-ink-900 shadow-[0_6px_20px_rgba(31,31,30,0.14)] animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
          >
            {a.action ? null : (
              <span className="shrink-0 text-brand">
                <Icon name={isProblem ? "warning" : "check"} size={20} strokeWidth={2.4} />
              </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {title ? <p className="font-bold">{title}</p> : null}
              <p
                className={cx("whitespace-pre-line break-words", title && "text-sub text-ink-600")}
              >
                {a.message}
              </p>
            </div>
            {a.action ? (
              <button
                type="button"
                onClick={() => {
                  a.action?.onClick();
                  removeAlert(a.id);
                }}
                className="-my-3 inline-flex min-h-11 shrink-0 items-center px-1 text-body font-bold text-brand-ink"
              >
                {a.action.label}
              </button>
            ) : a.autoHideDuration === null ? (
              // 저절로 사라지지 않는 안내(겹친 예약 등)는 닫기
              <button
                type="button"
                aria-label="안내 닫기"
                onClick={() => removeAlert(a.id)}
                className="-my-3 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-600 active:bg-ink-50"
              >
                <Icon name="close" size={18} strokeWidth={2} />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
