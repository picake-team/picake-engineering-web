/**
 * 아래에서 올라오는 창을 손잡이·제목 부분에서 아래로 끌어 닫기(앱처럼).
 * - 끄는 동안 창이 손가락을 따라 내려가고 뒤 어둡게 한 면도 같이 옅어진다.
 * - 창 높이의 30%(최대 120px)보다 많이 끌었거나 빠르게 내렸으면 닫고, 아니면 제자리로 돌아간다.
 *   놓은 뒤에는 손가락 속도를 이어받아 바로 출발해 부드럽게 멈춘다(빨리 던질수록 빨리 닫힘).
 *   규칙·값은 손님 앱과 같은 `sheetGesture`(@picake/design-tokens).
 * - 버튼(닫기 ×)·입력 칸에서 시작하면 끌지 않는다. enabled가 false(처리 중)면 끌지 않는다.
 */
import { useRef } from "react";
import type React from "react";
import { sheetGesture, sheetReleaseMs, shouldCloseSheet } from "@picake/design-tokens";

export { shouldCloseSheet };

export function useSheetDrag({
  panelRef,
  backdropRef,
  onClose,
  enabled = true,
}: {
  panelRef: React.RefObject<HTMLElement | null>;
  backdropRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  enabled?: boolean;
}) {
  const drag = useRef<{
    id: number;
    startY: number;
    lastY: number;
    lastT: number;
    v: number;
  } | null>(null);

  /** ms를 주면 그 시간 동안 옮기고(놓은 뒤), 없으면 바로(끄는 중) */
  const paint = (dy: number, ms?: number) => {
    const panel = panelRef.current;
    if (!panel) return;
    const ease = ms ? `${ms}ms ${sheetGesture.releaseEasing}` : "";
    panel.style.transition = ms ? `transform ${ease}` : "none";
    panel.style.transform = dy > 0 ? `translate3d(0, ${dy}px, 0)` : "";
    panel.style.willChange = ms ? "" : "transform";
    const backdrop = backdropRef.current;
    if (backdrop) {
      backdrop.style.transition = ms ? `opacity ${ease}` : "none";
      backdrop.style.opacity =
        dy > 0 ? String(Math.max(0, 1 - dy / (panel.offsetHeight || 1))) : "";
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!enabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    if ((e.target as HTMLElement).closest("button, a, input, textarea, select, [role='switch']")) {
      return;
    }
    const now = performance.now();
    drag.current = { id: e.pointerId, startY: e.clientY, lastY: e.clientY, lastT: now, v: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const now = performance.now();
    // 마지막 몇 움직임을 고르게(손가락 떨림에 흔들리지 않게)
    d.v = d.v * 0.4 + ((e.clientY - d.lastY) / Math.max(1, now - d.lastT)) * 0.6;
    d.lastY = e.clientY;
    d.lastT = now;
    paint(Math.max(0, e.clientY - d.startY));
  };

  const finish = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    const panel = panelRef.current;
    const dy = Math.max(0, d.lastY - d.startY);
    const height = panel?.offsetHeight ?? 0;
    // 손을 멈췄다 놓으면 속도는 0으로 본다
    const v = performance.now() - d.lastT > 80 ? 0 : d.v;
    if (e.type === "pointerup" && shouldCloseSheet(dy, v, height)) {
      // 손가락 속도를 이어받아 끝까지 내려 보낸 뒤 닫는다
      const ms = sheetReleaseMs(height - dy, v);
      paint(height, ms);
      window.setTimeout(onClose, ms);
    } else {
      paint(0, sheetGesture.settleMs);
    }
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: finish,
    onPointerCancel: finish,
    /** 끄는 동안 화면이 같이 스크롤되지 않게 */
    style: { touchAction: "none" } as React.CSSProperties,
  };
}
